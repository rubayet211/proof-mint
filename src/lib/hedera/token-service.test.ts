import { describe, expect, it, vi } from "vitest";
import { mintProofToken } from "./token-service";
import type { ProofRecord } from "@/types";

const proof: ProofRecord = {
  proofId: "proof_1",
  title: "AI Hackathon ProofMint Demo",
  category: "Work",
  payerAccountId: "0.0.123",
  recipientAccountId: "0.0.123",
  issuerName: "ProofMint Agent",
  createdAt: "2026-06-07T00:00:00.000Z",
  app: "ProofMint Hedera",
  network: "testnet",
  schemaVersion: "1.0",
};

describe("mintProofToken", () => {
  it("fails when proof token minting is not configured", async () => {
    vi.stubEnv("HEDERA_PROOF_TOKEN_ID", "");

    await expect(mintProofToken(proof)).rejects.toThrow("Missing HEDERA_PROOF_TOKEN_ID");
  });
});
