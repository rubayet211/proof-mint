import { createHash } from "crypto";
import { ProofSchemaInput } from "@/lib/validation/proof.schema";

export function canonicalProofInput(data: ProofSchemaInput) {
  return {
    title: data.title.trim(),
    description: data.description?.trim() || "",
    category: data.category,
    payerAccountId: data.payerAccountId,
    recipientAccountId: data.recipientAccountId || data.payerAccountId,
    issuerName: data.issuerName || "ProofMint Agent",
    clientRequestId: data.clientRequestId || "",
  };
}

export function createProofDigest(data: ProofSchemaInput): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalProofInput(data)))
    .digest("hex");
}

export function getProofStateKey(payerAccountId: string, title: string, clientRequestId?: string): string {
  if (clientRequestId) {
    return `proof_${payerAccountId}_${clientRequestId}`;
  }

  const normalizedTitle = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `proof_${payerAccountId}_${normalizedTitle}`;
}
