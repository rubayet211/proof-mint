import { MintProofResponse } from "@/types";

// In-memory store for idempotency (suitable for MVP/Hackathon)
// For production, replace with Redis / Vercel KV.
const idempotencyStore = new Map<string, MintProofResponse>();
const inProgressStore = new Set<string>();

export function getIdempotencyKey(payerAccountId: string, title: string, clientRequestId?: string): string {
  // Use clientRequestId if provided, otherwise deterministically hash
  if (clientRequestId) {
    return `idemp_${payerAccountId}_${clientRequestId}`;
  }
  // Fallback to deterministic hashing
  const normalizedTitle = title.trim().toLowerCase();
  return `idemp_${payerAccountId}_${normalizedTitle}`;
}

export async function getExistingResult(key: string): Promise<MintProofResponse | null> {
  return idempotencyStore.get(key) || null;
}

export async function saveCompletedResult(key: string, result: MintProofResponse): Promise<void> {
  idempotencyStore.set(key, result);
  inProgressStore.delete(key);
}

export async function markInProgress(key: string): Promise<boolean> {
  if (inProgressStore.has(key)) {
    return false; // Already in progress
  }
  inProgressStore.add(key);
  return true;
}

export async function clearInProgress(key: string): Promise<void> {
  inProgressStore.delete(key);
}
