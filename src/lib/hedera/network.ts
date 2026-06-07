export function requireHederaTestnet(network: string | undefined): "testnet" {
  const selected = network || "testnet";

  if (selected !== "testnet") {
    throw new Error("ProofMint is locked to Hedera testnet.");
  }

  return "testnet";
}
