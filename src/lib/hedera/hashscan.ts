const HASHSCAN_BASE_URL = process.env.NEXT_PUBLIC_HASHSCAN_BASE_URL || "https://hashscan.io/testnet";

export function getAccountUrl(accountId: string): string {
  return `${HASHSCAN_BASE_URL}/account/${accountId}`;
}

export function getTransactionUrl(transactionId: string): string {
  const normalizedTxId = normalizeTransactionIdForHashScan(transactionId);
  return `${HASHSCAN_BASE_URL}/transaction/${normalizedTxId}`;
}

export function normalizeTransactionIdForHashScan(transactionId: string): string {
  const trimmed = transactionId.trim();
  const sdkTransactionId = trimmed.match(/^(\d+\.\d+\.\d+)@(\d+)\.(\d+)$/);
  if (sdkTransactionId) {
    return `${sdkTransactionId[1]}-${sdkTransactionId[2]}-${sdkTransactionId[3]}`;
  }

  return encodeURIComponent(trimmed);
}

export function getTokenUrl(tokenId: string): string {
  return `${HASHSCAN_BASE_URL}/token/${tokenId}`;
}

export function getTopicUrl(topicId: string): string {
  return `${HASHSCAN_BASE_URL}/topic/${topicId}`;
}
