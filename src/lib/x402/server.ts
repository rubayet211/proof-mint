import { NextRequest, NextResponse } from "next/server";
import { PaymentPayload, PaymentRequirements } from "@x402/core/types";
import {
  PrivateKey,
  createHederaClient,
  createHederaSignAndSubmitTransaction,
  HEDERA_TESTNET_CAIP2,
  HEDERA_USDC_DECIMALS,
  HBAR_ASSET_ID,
} from "@x402/hedera";
import { ExactHederaScheme } from "@x402/hedera/exact/facilitator";
import { x402Config, getAtomicPaymentAmount, getPaymentAssetId } from "./config";
import { PaymentResult } from "@/types";

export interface VerifyPaymentOptions {
  resource: string;
  proofDigest: string;
}

export function buildPaymentRequirements(options: VerifyPaymentOptions): PaymentRequirements {
  const feePayer = process.env.HEDERA_OPERATOR_ACCOUNT_ID;

  if (!x402Config.payToAccountId) {
    throw new Error("Missing X402_PAY_TO_ACCOUNT_ID.");
  }

  if (!feePayer) {
    throw new Error("Missing HEDERA_OPERATOR_ACCOUNT_ID.");
  }

  return {
    scheme: "exact",
    network: HEDERA_TESTNET_CAIP2,
    asset: getPaymentAssetId(),
    amount: getAtomicPaymentAmount(),
    payTo: x402Config.payToAccountId,
    maxTimeoutSeconds: 120,
    extra: {
      feePayer,
      proofDigest: options.proofDigest,
      displayAmount: x402Config.priceAmount,
      displayAsset: x402Config.paymentAsset,
      decimals: x402Config.paymentAsset === "HBAR" ? 8 : HEDERA_USDC_DECIMALS,
    },
  };
}

export async function verifyOrRequestX402Payment(
  req: NextRequest,
  options: VerifyPaymentOptions
): Promise<{ success: boolean; requiresPaymentResponse?: NextResponse; payment?: PaymentResult }> {
  const requirements = buildPaymentRequirements(options);
  const paymentPayload = readPaymentPayload(req);

  if (!paymentPayload) {
    return {
      success: false,
      requiresPaymentResponse: createPaymentRequiredResponse(options, requirements),
    };
  }

  if (paymentPayload.accepted.extra?.proofDigest !== options.proofDigest) {
    return { success: false };
  }

  const facilitator = createHederaFacilitator();
  const verify = await facilitator.verify(paymentPayload, requirements);

  if (!verify.isValid) {
    console.warn("x402 payment verification failed", verify.invalidReason, verify.invalidMessage);
    return { success: false };
  }

  const settlement = await facilitator.settle(paymentPayload, requirements);

  if (!settlement.success) {
    console.warn("x402 payment settlement failed", settlement.errorReason, settlement.errorMessage);
    return { success: false };
  }

  return {
    success: true,
    payment: {
      success: true,
      transactionId: settlement.transaction,
      settlementId: settlement.transaction,
      amount: x402Config.priceAmount,
      asset: x402Config.paymentAsset as "HBAR" | "USDC",
      payer: settlement.payer,
      network: settlement.network,
    },
  };
}

function createPaymentRequiredResponse(options: VerifyPaymentOptions, requirements: PaymentRequirements): NextResponse {
  const body = {
    x402Version: 2,
    error: "Payment required",
    resource: {
      url: options.resource,
      description: "Mint a ProofMint Hedera proof",
      mimeType: "application/json",
      serviceName: "ProofMint Hedera",
    },
    accepts: [requirements],
  };

  const encoded = encodeBase64Json(body);
  return NextResponse.json(body, {
    status: 402,
    headers: {
      "PAYMENT-REQUIRED": encoded,
      "Access-Control-Expose-Headers": "PAYMENT-REQUIRED, PAYMENT-RESPONSE",
    },
  });
}

function readPaymentPayload(req: NextRequest): PaymentPayload | null {
  const header = req.headers.get("PAYMENT-SIGNATURE") || req.headers.get("X-PAYMENT");
  if (!header) return null;

  try {
    return JSON.parse(decodeBase64(header)) as PaymentPayload;
  } catch (error) {
    console.warn("Could not decode x402 payment signature header", error);
    return null;
  }
}

function createHederaFacilitator(): ExactHederaScheme {
  const accountId = process.env.HEDERA_OPERATOR_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_OPERATOR_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error("Missing Hedera operator credentials.");
  }

  const feePayerKey = PrivateKey.fromStringECDSA(privateKey);
  const signAndSubmitTransaction = createHederaSignAndSubmitTransaction(
    (network) => {
      if (network !== HEDERA_TESTNET_CAIP2) {
        throw new Error("ProofMint x402 facilitator is testnet-only.");
      }
      return createHederaClient(network);
    },
    feePayerKey
  );

  return new ExactHederaScheme({
    getAddresses: () => [accountId],
    signAndSubmitTransaction,
  });
}

function encodeBase64Json(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64");
}

function decodeBase64(value: string): string {
  return Buffer.from(value, "base64").toString("utf8");
}

export function paymentAssetLabel(): string {
  return getPaymentAssetId() === HBAR_ASSET_ID ? "HBAR" : x402Config.paymentAsset;
}
