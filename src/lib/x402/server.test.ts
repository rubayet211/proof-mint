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
});
