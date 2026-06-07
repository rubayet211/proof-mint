import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { MintProofResponse, PaymentResult, ProofRecord } from "@/types";

type ProofStateStatus = "in_progress" | "payment_settled" | "hcs_submitted" | "completed" | "failed";

interface ProofStateRecord {
  key: string;
  proofDigest: string;
  status: ProofStateStatus;
  payment?: PaymentResult;
  proof?: ProofRecord;
  hcs?: { hcsTransactionId: string; hcsTopicId: string };
  response?: MintProofResponse;
  error?: string;
  updatedAt: string;
}

interface ProofStateStoreData {
  records: Record<string, ProofStateRecord>;
}

export interface ProofStateBackend {
  read(): Promise<ProofStateStoreData>;
  write(data: ProofStateStoreData): Promise<void>;
}

export interface ProofStateStore {
  getCompletedResult(key: string, proofDigest: string): Promise<MintProofResponse | null>;
  getRecoverablePayment(key: string, proofDigest: string): Promise<PaymentResult | null>;
  getRecoverableProof(key: string, proofDigest: string): Promise<ProofRecord | null>;
  getRecoverableHcs(key: string, proofDigest: string): Promise<{ hcsTransactionId: string; hcsTopicId: string } | null>;
  markInProgress(key: string, proofDigest: string): Promise<boolean>;
  savePaymentSettled(key: string, proofDigest: string, payment: PaymentResult): Promise<void>;
  saveProofPrepared(key: string, proofDigest: string, proof: ProofRecord): Promise<void>;
  saveHcsSubmitted(
    key: string,
    proofDigest: string,
    hcs: { hcsTransactionId: string; hcsTopicId: string }
  ): Promise<void>;
  saveCompletedResult(key: string, proofDigest: string, response: MintProofResponse): Promise<void>;
  saveExecutionFailure(key: string, proofDigest: string, message: string): Promise<void>;
  clearInProgress(key: string, proofDigest: string): Promise<void>;
}

export function createFileProofStateBackend(stateDir: string): ProofStateBackend {
  const stateFile = join(stateDir, "proof-state.json");

  return {
    async read() {
      try {
        return JSON.parse(await readFile(stateFile, "utf8")) as ProofStateStoreData;
      } catch {
        return { records: {} };
      }
    },

    async write(data) {
      await mkdir(stateDir, { recursive: true });
      await writeFile(stateFile, JSON.stringify(data, null, 2), "utf8");
    },
  };
}

export function createUpstashRedisBackend(options: {
  url: string;
  token: string;
  key?: string;
  fetcher?: typeof fetch;
}): ProofStateBackend {
  const baseUrl = options.url.replace(/\/$/, "");
  const key = options.key || "proofmint:proof-state";
  const fetcher = options.fetcher || fetch;

  async function request(path: string, init?: RequestInit) {
    const response = await fetcher(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${options.token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Proof state Redis request failed: ${response.status}`);
    }

    return response.json() as Promise<{ result: string | null }>;
  }

  return {
    async read() {
      const data = await request(`/get/${encodeURIComponent(key)}`);
      if (!data.result) return { records: {} };
      return JSON.parse(data.result) as ProofStateStoreData;
    },

    async write(data) {
      await request(`/set/${encodeURIComponent(key)}`, {
        method: "POST",
        body: JSON.stringify(JSON.stringify(data)),
      });
    },
  };
}

function createDefaultProofStateBackend(options?: { stateDir?: string; backend?: ProofStateBackend }): ProofStateBackend {
  if (options?.backend) return options.backend;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    return createUpstashRedisBackend({
      url: upstashUrl,
      token: upstashToken,
      key: process.env.PROOFMINT_STATE_KEY,
    });
  }

  const stateDir = options?.stateDir || process.env.PROOFMINT_STATE_DIR || join(tmpdir(), "proofmint-hedera");
  return createFileProofStateBackend(stateDir);
}

export function createProofStateStore(options?: { stateDir?: string; backend?: ProofStateBackend }): ProofStateStore {
  const backend = createDefaultProofStateBackend(options);
  let queue = Promise.resolve();

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
      const record = (await backend.read()).records[key];
      return matches(record, proofDigest) && record.status === "completed" ? record.response || null : null;
    },

    async getRecoverablePayment(key, proofDigest) {
      const record = (await backend.read()).records[key];
      return matches(record, proofDigest) && record.payment && record.status !== "completed" ? record.payment : null;
    },

    async getRecoverableProof(key, proofDigest) {
      const record = (await backend.read()).records[key];
      return matches(record, proofDigest) && record.proof && record.status !== "completed" ? record.proof : null;
    },

    async getRecoverableHcs(key, proofDigest) {
      const record = (await backend.read()).records[key];
      return matches(record, proofDigest) && record.hcs && record.status !== "completed" ? record.hcs : null;
    },

    markInProgress(key, proofDigest) {
      return withLock(async () => {
        const data = await backend.read();
        const current = data.records[key];

        if (matches(current, proofDigest) && (current.status === "in_progress" || current.status === "completed")) {
          return false;
        }

        data.records[key] = {
          key,
          proofDigest,
          status: "in_progress",
          payment: matches(current, proofDigest) ? current.payment : undefined,
          proof: matches(current, proofDigest) ? current.proof : undefined,
          hcs: matches(current, proofDigest) ? current.hcs : undefined,
          updatedAt: new Date().toISOString(),
        };
        await backend.write(data);
        return true;
      });
    },

    savePaymentSettled(key, proofDigest, payment) {
      return withLock(async () => {
        const data = await backend.read();
        const current = data.records[key];
        data.records[key] = {
          key,
          proofDigest,
          status: "payment_settled",
          payment,
          proof: matches(current, proofDigest) ? current.proof : undefined,
          hcs: matches(current, proofDigest) ? current.hcs : undefined,
          updatedAt: new Date().toISOString(),
        };
        await backend.write(data);
      });
    },

    saveProofPrepared(key, proofDigest, proof) {
      return withLock(async () => {
        const data = await backend.read();
        const current = data.records[key];
        data.records[key] = {
          key,
          proofDigest,
          status: matches(current, proofDigest) ? current.status : "in_progress",
          payment: matches(current, proofDigest) ? current.payment : undefined,
          proof,
          hcs: matches(current, proofDigest) ? current.hcs : undefined,
          updatedAt: new Date().toISOString(),
        };
        await backend.write(data);
      });
    },

    saveHcsSubmitted(key, proofDigest, hcs) {
      return withLock(async () => {
        const data = await backend.read();
        const current = data.records[key];
        data.records[key] = {
          key,
          proofDigest,
          status: "hcs_submitted",
          payment: matches(current, proofDigest) ? current.payment : undefined,
          proof: matches(current, proofDigest) ? current.proof : undefined,
          hcs,
          updatedAt: new Date().toISOString(),
        };
        await backend.write(data);
      });
    },

    saveCompletedResult(key, proofDigest, response) {
      return withLock(async () => {
        const data = await backend.read();
        data.records[key] = {
          key,
          proofDigest,
          status: "completed",
          payment: response.payment,
          proof: response.proof,
          hcs: response.hedera?.hcsTransactionId && response.hedera.hcsTopicId
            ? {
                hcsTransactionId: response.hedera.hcsTransactionId,
                hcsTopicId: response.hedera.hcsTopicId,
              }
            : undefined,
          response,
          updatedAt: new Date().toISOString(),
        };
        await backend.write(data);
      });
    },

    saveExecutionFailure(key, proofDigest, message) {
      return withLock(async () => {
        const data = await backend.read();
        const current = data.records[key];
        data.records[key] = {
          key,
          proofDigest,
          status: "failed",
          payment: matches(current, proofDigest) ? current.payment : undefined,
          proof: matches(current, proofDigest) ? current.proof : undefined,
          hcs: matches(current, proofDigest) ? current.hcs : undefined,
          error: message,
          updatedAt: new Date().toISOString(),
        };
        await backend.write(data);
      });
    },

    clearInProgress(key, proofDigest) {
      return withLock(async () => {
        const data = await backend.read();
        const current = data.records[key];
        if (matches(current, proofDigest) && current.status === "in_progress") {
          delete data.records[key];
          await backend.write(data);
        }
      });
    },
  };
}

export const proofStateStore = createProofStateStore();
