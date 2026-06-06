const HASHSCAN_BASE_URL = process.env.NEXT_PUBLIC_HASHSCAN_BASE_URL || "https://hashscan.io/testnet";

export function getAccountUrl(accountId: string): string {
  return `${HASHSCAN_BASE_URL}/account/${accountId}`;
}

export function getTransactionUrl(transactionId: string): string {
  // Hedera transaction IDs often use @ and .
  // E.g., 0.0.123@162541.123123 -> HashScan expects 0.0.123-162541-123123
  // But Hashscan also handles them if normalized. Let's return a safe encoded format.
  const normalizedTxId = transactionId.replace(/@/, "-").replace(/\./g, "-");
  return `${HASHSCAN_BASE_URL}/transaction/${normalizedTxId}`;
}

export function getTokenUrl(tokenId: string): string {
  return `${HASHSCAN_BASE_URL}/token/${tokenId}`;
}

export function getTopicUrl(topicId: string): string {
  return `${HASHSCAN_BASE_URL}/topic/${topicId}`;
}
