import { describe, expect, it } from "vitest";
import { requireHederaTestnet } from "./network";

describe("requireHederaTestnet", () => {
  it("allows only Hedera testnet", () => {
    expect(requireHederaTestnet(undefined)).toBe("testnet");
    expect(requireHederaTestnet("testnet")).toBe("testnet");
    expect(() => requireHederaTestnet("mainnet")).toThrow("ProofMint is locked to Hedera testnet");
  });
});
