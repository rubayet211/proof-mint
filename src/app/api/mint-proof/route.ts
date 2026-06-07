import { NextRequest, NextResponse } from "next/server";
import { proofSchema } from "@/lib/validation/proof.schema";
import { getIdempotencyKey } from "@/lib/idempotency";
import { proofStateStore } from "@/lib/proof-state";
import { mintProofRateLimiter } from "@/lib/rate-limit";
import { verifyOrRequestX402Payment } from "@/lib/x402/server";
import { submitProofMessage } from "@/lib/hedera/hcs-service";
import { mintProofToken } from "@/lib/hedera/token-service";
import { createProofDigest } from "@/lib/proof";
import { 
  getTransactionUrl, 
  getAccountUrl, 
  getTokenUrl
} from "@/lib/hedera/hashscan";
import { ProofRecord, MintProofResponse, PaymentResult } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validate Input
    const parsed = proofSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Validation Error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const proofDigest = createProofDigest(data);

    // 2. Idempotency and rate-limit checks
    const idempotencyKey = getIdempotencyKey(data.payerAccountId, data.title, data.clientRequestId);
    
    const existing = await proofStateStore.getCompletedResult(idempotencyKey, proofDigest);
    if (existing) {
      return NextResponse.json(existing);
    }

    const rateLimit = mintProofRateLimiter.check(`${getClientIp(req)}:${data.payerAccountId}`);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Rate Limit Exceeded",
          message: "Too many proof mint attempts. Please retry shortly.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfterSeconds || 60),
          },
        }
      );
    }

    const canProceed = await proofStateStore.markInProgress(idempotencyKey, proofDigest);
    if (!canProceed) {
      return NextResponse.json(
        { success: false, error: "Conflict", message: "A request for this proof is already in progress." },
        { status: 409 }
      );
    }

    let settledPayment: PaymentResult | null = null;

    try {
      // 3. x402 Payment Check and Verification
      settledPayment = await proofStateStore.getRecoverablePayment(idempotencyKey, proofDigest);

      if (!settledPayment) {
        const paymentCheck = await verifyOrRequestX402Payment(req, {
          resource: "/api/mint-proof",
          proofDigest,
        });

        if (paymentCheck.requiresPaymentResponse) {
          await proofStateStore.clearInProgress(idempotencyKey, proofDigest);
          return paymentCheck.requiresPaymentResponse;
        }

        if (!paymentCheck.success || !paymentCheck.payment) {
          await proofStateStore.clearInProgress(idempotencyKey, proofDigest);
          return NextResponse.json(
            {
              success: false,
              error: paymentCheck.paymentError?.error || "Payment Verification Failed",
              message: paymentCheck.paymentError?.message || "The provided x402 payment could not be verified.",
            },
            { status: 402 }
          );
        }

        settledPayment = paymentCheck.payment;
        await proofStateStore.savePaymentSettled(idempotencyKey, proofDigest, settledPayment);
      }

      // 4. Payment verified! Prepare or recover the exact ProofRecord used for HCS.
      const proof: ProofRecord = await proofStateStore.getRecoverableProof(idempotencyKey, proofDigest)
        || {
          proofId: `proof_${crypto.randomUUID()}`,
          title: data.title,
          description: data.description,
          category: data.category,
          payerAccountId: data.payerAccountId,
          recipientAccountId: data.recipientAccountId || data.payerAccountId,
          issuerName: data.issuerName || "ProofMint Agent",
          createdAt: new Date().toISOString(),
          paymentReference: settledPayment.transactionId,
          proofDigest,
          app: "ProofMint Hedera",
          network: "testnet",
          schemaVersion: "1.0"
        };
      await proofStateStore.saveProofPrepared(idempotencyKey, proofDigest, proof);

      // 5. Hedera Agent Kit Execution (HCS + HTS)
      // Since these are on-chain, they could fail. We'll do HCS first as primary.
      const hcsResult = await proofStateStore.getRecoverableHcs(idempotencyKey, proofDigest)
        || await submitProofMessage(proof);
      await proofStateStore.saveHcsSubmitted(idempotencyKey, proofDigest, hcsResult);
      const htsResult = await mintProofToken(proof);

      // 6. Assemble Response
      const response: MintProofResponse = {
        success: true,
        proof,
        payment: settledPayment,
        hedera: {
          hcsTopicId: hcsResult.hcsTopicId,
          hcsTransactionId: hcsResult.hcsTransactionId,
          tokenId: htsResult.tokenId,
          tokenSerial: htsResult.tokenSerial,
          tokenTransactionId: htsResult.tokenTransactionId
        },
        links: {
          hcsTransaction: getTransactionUrl(hcsResult.hcsTransactionId),
          token: htsResult.tokenId ? getTokenUrl(htsResult.tokenId) : undefined,
          paymentTransaction: settledPayment.transactionId ? getTransactionUrl(settledPayment.transactionId) : undefined,
          account: getAccountUrl(proof.recipientAccountId)
        }
      };

      // 7. Save and Return
      await proofStateStore.saveCompletedResult(idempotencyKey, proofDigest, response);
      const res = NextResponse.json(response);
      if (settledPayment.transactionId) {
        res.headers.set("PAYMENT-RESPONSE", Buffer.from(JSON.stringify({
          success: true,
          transaction: settledPayment.transactionId,
          network: settledPayment.network,
          payer: settledPayment.payer,
          amount: settledPayment.amount,
        })).toString("base64"));
      }
      return res;

    } catch (innerError: unknown) {
      if (settledPayment) {
        await proofStateStore.saveExecutionFailure(
          idempotencyKey,
          proofDigest,
          innerError instanceof Error ? innerError.message : "Proof execution failed."
        );
      } else {
        await proofStateStore.clearInProgress(idempotencyKey, proofDigest);
      }
      throw innerError;
    }

  } catch (error: unknown) {
    console.error("Mint Proof API Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", message: "Proof minting failed. Check server logs for details." },
      { status: 500 }
    );
  }
}

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "local";
}
