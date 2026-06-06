import { describe, expect, it, vi } from "vitest";

async function importFreshConfig() {
  vi.resetModules();
  return import("./config");
}

describe("x402 config", () => {
  it("converts default USDC display amount to atomic units", async () => {
    vi.stubEnv("X402_PAYMENT_ASSET", "USDC");
    vi.stubEnv("X402_PRICE_AMOUNT", "0.25");

    const { getAtomicPaymentAmount, getPaymentAssetId } = await importFreshConfig();

    expect(getAtomicPaymentAmount()).toBe("250000");
    expect(getPaymentAssetId()).toBe("0.0.429274");
  });

  it("converts HBAR display amount to tinybars", async () => {
    vi.stubEnv("X402_PAYMENT_ASSET", "HBAR");
    vi.stubEnv("X402_PRICE_AMOUNT", "0.25");

    const { getAtomicPaymentAmount, getPaymentAssetId } = await importFreshConfig();

    expect(getAtomicPaymentAmount()).toBe("25000000");
    expect(getPaymentAssetId()).toBe("0.0.0");
  });
});
