export const x402Config = {
  facilitatorUrl: process.env.X402_FACILITATOR_URL || "https://api.testnet.blocky402.com",
  paymentAsset: process.env.X402_PAYMENT_ASSET || "USDC",
  priceAmount: process.env.X402_PRICE_AMOUNT || "0.25",
  payToAccountId: process.env.X402_PAY_TO_ACCOUNT_ID || "",
  usdcTokenId: process.env.X402_USDC_TOKEN_ID || "0.0.429274" // Testnet USDC
};

export const HEDERA_TESTNET_NETWORK = "hedera:testnet" as const;

export function getPaymentAssetId(): string {
  return x402Config.paymentAsset === "HBAR" ? "0.0.0" : x402Config.usdcTokenId;
}

export function getAtomicPaymentAmount(): string {
  if (x402Config.paymentAsset === "HBAR") {
    return decimalToAtomic(x402Config.priceAmount, 8);
  }

  return decimalToAtomic(x402Config.priceAmount, 6);
}

function decimalToAtomic(value: string, decimals: number): string {
  const [wholeRaw, fractionRaw = ""] = value.trim().split(".");
  const whole = wholeRaw || "0";
  const fraction = fractionRaw.padEnd(decimals, "0").slice(0, decimals);
  const atomic = BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(fraction || "0");
  return atomic.toString();
}
