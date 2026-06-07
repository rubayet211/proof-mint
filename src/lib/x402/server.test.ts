import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

async function importFreshServer() {
  vi.resetModules();
  vi.stubEnv("HEDERA_OPERATOR_ACCOUNT_ID", "0.0.99999");
  vi.stubEnv("X402_PAY_TO_ACCOUNT_ID", "0.0.88888");
  vi.stubEnv("X402_PAYMENT_ASSET", "USDC");
  vi.stubEnv("X402_PRICE_AMOUNT", "0.25");
  return import("./server");
}

describe("x402 server payment gate", () => {
  it("binds payment requirements to the proof digest", async () => {
    const { buildPaymentRequirements } = await importFreshServer();

    const requirements = buildPaymentRequirements({
      resource: "/api/mint-proof",
      proofDigest: "digest-123",
    });

    expect(requirements.payTo).toBe("0.0.88888");
    expect(requirements.amount).toBe("250000");
    expect(requirements.extra?.feePayer).toBe("0.0.99999");
    expect(requirements.extra?.proofDigest).toBe("digest-123");
  });

  it("returns HTTP 402 when no payment signature is present", async () => {
    const { verifyOrRequestX402Payment } = await importFreshServer();

    const result = await verifyOrRequestX402Payment(new NextRequest("http://localhost/api/mint-proof"), {
      resource: "/api/mint-proof",
      proofDigest: "digest-123",
    });

    expect(result.success).toBe(false);
    expect(result.requiresPaymentResponse?.status).toBe(402);
    expect(result.requiresPaymentResponse?.headers.get("PAYMENT-REQUIRED")).toBeTruthy();
  });

  it("returns the facilitator failure message when settlement fails", async () => {
    vi.resetModules();
    vi.stubEnv("HEDERA_OPERATOR_ACCOUNT_ID", "0.0.99999");
    vi.stubEnv("HEDERA_OPERATOR_PRIVATE_KEY", "0x1234");
    vi.stubEnv("X402_PAY_TO_ACCOUNT_ID", "0.0.88888");
    vi.stubEnv("X402_PAYMENT_ASSET", "USDC");
    vi.stubEnv("X402_PRICE_AMOUNT", "0.25");
    vi.doMock("@x402/hedera/exact/facilitator", () => ({
      ExactHederaScheme: class {
        async verify() {
          return { isValid: true };
        }

        async settle() {
          return {
            success: false,
            network: "hedera:testnet",
            transaction: "",
            errorReason: "transaction_failed",
            errorMessage:
              "receipt for transaction 0.0.99999@1780822008.510446976 contained error status TOKEN_NOT_ASSOCIATED_TO_ACCOUNT",
          };
        }
      },
    }));
    vi.doMock("@x402/hedera", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@x402/hedera")>();
      return {
        ...actual,
        PrivateKey: {
          fromStringECDSA: () => ({}),
        },
        createHederaSignAndSubmitTransaction: () => async () => ({
          transactionId: "0.0.99999@1780822008.510446976",
        }),
      };
    });

    const { verifyOrRequestX402Payment } = await import("./server");
    const paymentPayload = {
      x402Version: 2,
      accepted: {
        scheme: "exact",
        network: "hedera:testnet",
        amount: "250000",
        asset: "0.0.429274",
        payTo: "0.0.88888",
        maxTimeoutSeconds: 120,
        extra: {
          feePayer: "0.0.99999",
          proofDigest: "digest-123",
        },
      },
      payload: { transaction: "signed-transaction" },
    };
    const req = new NextRequest("http://localhost/api/mint-proof", {
      headers: {
        "PAYMENT-SIGNATURE": Buffer.from(JSON.stringify(paymentPayload), "utf8").toString("base64"),
      },
    });

    const result = await verifyOrRequestX402Payment(req, {
      resource: "/api/mint-proof",
      proofDigest: "digest-123",
    });

    expect(result.success).toBe(false);
    expect(result.paymentError?.message).toContain("TOKEN_NOT_ASSOCIATED_TO_ACCOUNT");
  });
});
