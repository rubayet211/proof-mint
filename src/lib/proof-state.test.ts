import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { createProofStateStore } from "./proof-state";
import type { MintProofResponse, PaymentResult } from "@/types";

const tempDirs: string[] = [];

async function tempStateDir() {
  const dir = await mkdtemp(join(tmpdir(), "proofmint-state-"));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("proof state store", () => {
  it("persists a settled payment so execution can retry without another payment", async () => {
    const stateDir = await tempStateDir();
    const key = "idemp_0.0.123_request";
    const proofDigest = "digest-123";
    const payment: PaymentResult = {
      success: true,
      transactionId: "0.0.999@1780822008.510446976",
      amount: "0.25",
      asset: "USDC",
      payer: "0.0.123",
      network: "hedera:testnet",
    };

    const firstStore = createProofStateStore({ stateDir });
    await expect(firstStore.markInProgress(key, proofDigest)).resolves.toBe(true);
    await firstStore.savePaymentSettled(key, proofDigest, payment);

    const secondStore = createProofStateStore({ stateDir });
    await expect(secondStore.getRecoverablePayment(key, proofDigest)).resolves.toEqual(payment);
  });

  it("returns a completed response instead of starting duplicate execution", async () => {
    const stateDir = await tempStateDir();
    const store = createProofStateStore({ stateDir });
    const key = "idemp_0.0.123_complete";
    const proofDigest = "digest-456";
    const response: MintProofResponse = {
      success: true,
      proof: {
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
      },
      hedera: {
        hcsTransactionId: "0.0.999@1780822009.510446976",
      },
    };

    await store.markInProgress(key, proofDigest);
    await store.saveCompletedResult(key, proofDigest, response);

    await expect(store.getCompletedResult(key, proofDigest)).resolves.toEqual(response);
    await expect(store.markInProgress(key, proofDigest)).resolves.toBe(false);
  });

  it("persists HCS submission so token retry does not duplicate the HCS proof", async () => {
    const stateDir = await tempStateDir();
    const key = "idemp_0.0.123_hcs";
    const proofDigest = "digest-hcs";
    const hcs = {
      hcsTopicId: "0.0.456",
      hcsTransactionId: "0.0.999@1780822011.510446976",
    };

    const firstStore = createProofStateStore({ stateDir });
    await firstStore.markInProgress(key, proofDigest);
    await firstStore.saveHcsSubmitted(key, proofDigest, hcs);

    const secondStore = createProofStateStore({ stateDir });
    await expect(secondStore.getRecoverableHcs(key, proofDigest)).resolves.toEqual(hcs);
    await expect(secondStore.markInProgress(key, proofDigest)).resolves.toBe(true);
  });
});
