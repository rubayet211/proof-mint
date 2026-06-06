import { describe, expect, it } from "vitest";
import { proofSchema } from "./proof.schema";

const validProof = {
  title: "AI Hackathon ProofMint Demo",
  description: "Built and demonstrated a payment-triggered Hedera proof agent.",
  category: "Work",
  payerAccountId: "0.0.12345",
  recipientAccountId: "",
  issuerName: "ProofMint Agent",
  clientRequestId: "550e8400-e29b-41d4-a716-446655440000",
};

describe("proofSchema", () => {
  it("accepts the MVP proof payload and allows recipient to default to payer", () => {
    const parsed = proofSchema.safeParse(validProof);

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid Hedera account IDs", () => {
    const parsed = proofSchema.safeParse({
      ...validProof,
      payerAccountId: "12345",
    });

    expect(parsed.success).toBe(false);
  });

  it("enforces title length to protect HCS payloads", () => {
    const parsed = proofSchema.safeParse({
      ...validProof,
      title: "x".repeat(101),
    });

    expect(parsed.success).toBe(false);
  });
});
