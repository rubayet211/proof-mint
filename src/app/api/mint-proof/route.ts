import { NextRequest, NextResponse } from "next/server";
import { proofSchema } from "@/lib/validation/proof.schema";
import { 
  getIdempotencyKey, 
  getExistingResult, 
  saveCompletedResult, 
  markInProgress, 
  clearInProgress 
} from "@/lib/idempotency";
import { verifyOrRequestX402Payment } from "@/lib/x402/server";
import { submitProofMessage } from "@/lib/hedera/hcs-service";
import { mintProofToken } from "@/lib/hedera/token-service";
import { createProofDigest } from "@/lib/proof";
import { 
  getTransactionUrl, 
  getAccountUrl, 
  getTokenUrl
} from "@/lib/hedera/hashscan";
import { ProofRecord, MintProofResponse } from "@/types";

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

    // 2. Idempotency Check
    const idempotencyKey = getIdempotencyKey(data.payerAccountId, data.title, data.clientRequestId);
    
    const existing = await getExistingResult(idempotencyKey);
    if (existing) {
      return NextResponse.json(existing);
    }

    const canProceed = await markInProgress(idempotencyKey);
    if (!canProceed) {
      return NextResponse.json(
        { success: false, error: "Conflict", message: "A request for this proof is already in progress." },
        { status: 409 }
      );
    }

    try {
      // 3. x402 Payment Check and Verification
      const proofDigest = createProofDigest(data);
      const paymentCheck = await verifyOrRequestX402Payment(req, {
        resource: "/api/mint-proof",
        proofDigest,
      });

      if (paymentCheck.requiresPaymentResponse) {
        await clearInProgress(idempotencyKey);
        return paymentCheck.requiresPaymentResponse;
      }

      if (!paymentCheck.success || !paymentCheck.payment) {
        await clearInProgress(idempotencyKey);
        return NextResponse.json(
          {
            success: false,
            error: paymentCheck.paymentError?.error || "Payment Verification Failed",
            message: paymentCheck.paymentError?.message || "The provided x402 payment could not be verified.",
          },
          { status: 402 }
        );
      }

      // 4. Payment verified! Prepare ProofRecord
      const proof: ProofRecord = {
        proofId: `proof_${crypto.randomUUID()}`,
        title: data.title,
        description: data.description,
        category: data.category,
        payerAccountId: data.payerAccountId,
        recipientAccountId: data.recipientAccountId || data.payerAccountId,
        issuerName: data.issuerName || "ProofMint Agent",
        createdAt: new Date().toISOString(),
        paymentReference: paymentCheck.payment.transactionId,
        proofDigest,
        app: "ProofMint Hedera",
        network: "testnet",
        schemaVersion: "1.0"
      };

      // 5. Hedera Agent Kit Execution (HCS + HTS)
      // Since these are on-chain, they could fail. We'll do HCS first as primary.
      const hcsResult = await submitProofMessage(proof);
      const htsResult = await mintProofToken(proof);

      // 6. Assemble Response
      const response: MintProofResponse = {
        success: true,
        proof,
        payment: paymentCheck.payment,
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
          paymentTransaction: paymentCheck.payment.transactionId ? getTransactionUrl(paymentCheck.payment.transactionId) : undefined,
          account: getAccountUrl(proof.recipientAccountId)
        }
      };

      // 7. Save and Return
      await saveCompletedResult(idempotencyKey, response);
      const res = NextResponse.json(response);
      if (paymentCheck.payment.transactionId) {
        res.headers.set("PAYMENT-RESPONSE", Buffer.from(JSON.stringify({
          success: true,
          transaction: paymentCheck.payment.transactionId,
          network: paymentCheck.payment.network,
          payer: paymentCheck.payment.payer,
          amount: paymentCheck.payment.amount,
        })).toString("base64"));
      }
      return res;

    } catch (innerError: unknown) {
      // In case of execution failure, clean up in-progress state so user can retry
      await clearInProgress(idempotencyKey);
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
