import { describe, expect, it } from "vitest";
import { getAccountUrl, getTokenUrl, getTopicUrl, getTransactionUrl } from "./hashscan";

describe("HashScan URL helpers", () => {
  it("builds testnet account, token, and topic URLs", () => {
    expect(getAccountUrl("0.0.12345")).toBe("https://hashscan.io/testnet/account/0.0.12345");
    expect(getTokenUrl("0.0.45678")).toBe("https://hashscan.io/testnet/token/0.0.45678");
    expect(getTopicUrl("0.0.98765")).toBe("https://hashscan.io/testnet/topic/0.0.98765");
  });

  it("normalizes Hedera transaction IDs for HashScan", () => {
    expect(getTransactionUrl("0.0.12345@1710000000.123456789")).toBe(
      "https://hashscan.io/testnet/transaction/0-0-12345-1710000000-123456789"
    );
  });
});
