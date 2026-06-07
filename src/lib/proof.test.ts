import { describe, expect, it } from "vitest";
import { canonicalProofInput, createProofDigest, getProofStateKey } from "./proof";
import { ProofSchemaInput } from "./validation/proof.schema";

const proof: ProofSchemaInput = {
  title: "AI Hackathon ProofMint Demo",
  description: "Built and demonstrated a payment-triggered Hedera proof agent.",
  category: "Work",
  payerAccountId: "0.0.12345",
  recipientAccountId: "",
  issuerName: "ProofMint Agent",
  clientRequestId: "request-1",
};

describe("proof digest", () => {
  it("canonicalizes empty recipient account to payer", () => {
    expect(canonicalProofInput(proof).recipientAccountId).toBe("0.0.12345");
  });

  it("is deterministic for the same proof payload", () => {
    expect(createProofDigest(proof)).toBe(createProofDigest({ ...proof }));
  });

  it("changes when action-bound proof data changes", () => {
    expect(createProofDigest(proof)).not.toBe(
      createProofDigest({
        ...proof,
        title: "Different Achievement",
      })
    );
  });

  it("builds a stable state key from client request id", () => {
    expect(getProofStateKey("0.0.12345", " AI Hackathon ProofMint Demo ", "request-1")).toBe(
      "proof_0.0.12345_request-1"
    );
  });

  it("falls back to normalized title when no client request id exists", () => {
    expect(getProofStateKey("0.0.12345", " AI Hackathon ProofMint Demo ")).toBe(
      "proof_0.0.12345_ai-hackathon-proofmint-demo"
    );
  });
});
