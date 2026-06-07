import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { MintProofResponse, PaymentResult } from "@/types";

type ProofStateStatus = "in_progress" | "payment_settled" | "hcs_submitted" | "completed" | "failed";

interface ProofStateRecord {
  key: string;
  proofDigest: string;
  status: ProofStateStatus;
  payment?: PaymentResult;
  hcs?: { hcsTransactionId: string; hcsTopicId: string };
  response?: MintProofResponse;
  error?: string;
  updatedAt: string;
}

interface ProofStateStoreData {
  records: Record<string, ProofStateRecord>;
}

export interface ProofStateStore {
  getCompletedResult(key: string, proofDigest: string): Promise<MintProofResponse | null>;
  getRecoverablePayment(key: string, proofDigest: string): Promise<PaymentResult | null>;
  getRecoverableHcs(key: string, proofDigest: string): Promise<{ hcsTransactionId: string; hcsTopicId: string } | null>;
  markInProgress(key: string, proofDigest: string): Promise<boolean>;
  savePaymentSettled(key: string, proofDigest: string, payment: PaymentResult): Promise<void>;
  saveHcsSubmitted(
    key: string,
    proofDigest: string,
    hcs: { hcsTransactionId: string; hcsTopicId: string }
  ): Promise<void>;
  saveCompletedResult(key: string, proofDigest: string, response: MintProofResponse): Promise<void>;
  saveExecutionFailure(key: string, proofDigest: string, message: string): Promise<void>;
  clearInProgress(key: string, proofDigest: string): Promise<void>;
}

export function createProofStateStore(options?: { stateDir?: string }): ProofStateStore {
  const stateDir = options?.stateDir || process.env.PROOFMINT_STATE_DIR || join(tmpdir(), "proofmint-hedera");
  const stateFile = join(stateDir, "proof-state.json");
  let queue = Promise.resolve();

  async function readData(): Promise<ProofStateStoreData> {
    try {
      return JSON.parse(await readFile(stateFile, "utf8")) as ProofStateStoreData;
    } catch {
      return { records: {} };
    }
  }

  async function writeData(data: ProofStateStoreData): Promise<void> {
    await mkdir(stateDir, { recursive: true });
    await writeFile(stateFile, JSON.stringify(data, null, 2), "utf8");
  }

  function withLock<T>(operation: () => Promise<T>): Promise<T> {
    const next = queue.then(operation, operation);
    queue = next.then(
      () => undefined,
      () => undefined
    );
    return next;
  }

  function matches(record: ProofStateRecord | undefined, proofDigest: string): record is ProofStateRecord {
    return Boolean(record && record.proofDigest === proofDigest);
  }

  return {
    async getCompletedResult(key, proofDigest) {
      const record = (await readData()).records[key];
      return matches(record, proofDigest) && record.status === "completed" ? record.response || null : null;
    },

    async getRecoverablePayment(key, proofDigest) {
      const record = (await readData()).records[key];
      return matches(record, proofDigest) && record.payment && record.status !== "completed" ? record.payment : null;
    },

    async getRecoverableHcs(key, proofDigest) {
      const record = (await readData()).records[key];
      return matches(record, proofDigest) && record.hcs && record.status !== "completed" ? record.hcs : null;
    },

    markInProgress(key, proofDigest) {
      return withLock(async () => {
        const data = await readData();
        const current = data.records[key];

        if (matches(current, proofDigest) && (current.status === "in_progress" || current.status === "completed")) {
          return false;
        }

        data.records[key] = {
          key,
          proofDigest,
          status: "in_progress",
          payment: matches(current, proofDigest) ? current.payment : undefined,
          hcs: matches(current, proofDigest) ? current.hcs : undefined,
          updatedAt: new Date().toISOString(),
        };
        await writeData(data);
        return true;
      });
    },

    savePaymentSettled(key, proofDigest, payment) {
      return withLock(async () => {
        const data = await readData();
        data.records[key] = {
          key,
          proofDigest,
          status: "payment_settled",
          payment,
          hcs: matches(data.records[key], proofDigest) ? data.records[key].hcs : undefined,
          updatedAt: new Date().toISOString(),
        };
        await writeData(data);
      });
    },

    saveHcsSubmitted(key, proofDigest, hcs) {
      return withLock(async () => {
        const data = await readData();
        const current = data.records[key];
        data.records[key] = {
          key,
          proofDigest,
          status: "hcs_submitted",
          payment: matches(current, proofDigest) ? current.payment : undefined,
          hcs,
          updatedAt: new Date().toISOString(),
        };
        await writeData(data);
      });
    },

    saveCompletedResult(key, proofDigest, response) {
      return withLock(async () => {
        const data = await readData();
        data.records[key] = {
          key,
          proofDigest,
          status: "completed",
          payment: response.payment,
          hcs: response.hedera?.hcsTransactionId && response.hedera.hcsTopicId
            ? {
                hcsTransactionId: response.hedera.hcsTransactionId,
                hcsTopicId: response.hedera.hcsTopicId,
              }
            : undefined,
          response,
          updatedAt: new Date().toISOString(),
        };
        await writeData(data);
      });
    },

    saveExecutionFailure(key, proofDigest, message) {
      return withLock(async () => {
        const data = await readData();
        const current = data.records[key];
        data.records[key] = {
          key,
          proofDigest,
          status: "failed",
          payment: matches(current, proofDigest) ? current.payment : undefined,
          hcs: matches(current, proofDigest) ? current.hcs : undefined,
          error: message,
          updatedAt: new Date().toISOString(),
        };
        await writeData(data);
      });
    },

    clearInProgress(key, proofDigest) {
      return withLock(async () => {
        const data = await readData();
        const current = data.records[key];
        if (matches(current, proofDigest) && current.status === "in_progress") {
          delete data.records[key];
          await writeData(data);
        }
      });
    },
  };
}

export const proofStateStore = createProofStateStore();
