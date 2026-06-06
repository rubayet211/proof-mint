import { Client, PrivateKey, TopicCreateTransaction, TokenCreateTransaction, TokenType, TokenSupplyType } from "@hiero-ledger/sdk";
import "dotenv/config";

async function main() {
  const accountId = process.env.HEDERA_OPERATOR_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_OPERATOR_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!accountId || !privateKey) {
    console.error("Missing HEDERA_OPERATOR_ACCOUNT_ID or HEDERA_OPERATOR_PRIVATE_KEY in .env");
    process.exit(1);
  }

  const client = network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  const operatorKey = PrivateKey.fromStringECDSA(privateKey);
  client.setOperator(accountId, operatorKey);

  console.log("🚀 Setting up ProofMint Hedera Environment on", network);

  try {
    // 1. Create HCS Topic
    console.log("📝 Creating HCS Topic...");
    const topicTx = new TopicCreateTransaction()
      .setTopicMemo("ProofMint Achievement Proofs")
      .setAdminKey(operatorKey);
    const topicResponse = await topicTx.execute(client);
    const topicReceipt = await topicResponse.getReceipt(client);
    const topicId = topicReceipt.topicId;
    console.log(`✅ Topic Created! Add to .env: HEDERA_HCS_TOPIC_ID=${topicId?.toString()}`);

    // 2. Create HTS Token (Fungible fallback token for hackathon ease)
    console.log("🪙 Creating HTS Token...");
    const tokenTx = new TokenCreateTransaction()
      .setTokenName("ProofMint Proof")
      .setTokenSymbol("PROOF")
      .setTokenType(TokenType.FungibleCommon)
      .setDecimals(0)
      .setInitialSupply(1000000)
      .setSupplyType(TokenSupplyType.Infinite)
      .setTreasuryAccountId(accountId)
      .setSupplyKey(operatorKey)
      .setAdminKey(operatorKey);
    
    const tokenResponse = await tokenTx.execute(client);
    const tokenReceipt = await tokenResponse.getReceipt(client);
    const tokenId = tokenReceipt.tokenId;
    console.log(`✅ Token Created! Add to .env: HEDERA_PROOF_TOKEN_ID=${tokenId?.toString()}`);

    console.log("\nSetup complete! Ensure you add the printed IDs to your .env file.");
  } catch (error) {
    console.error("Setup failed:", error);
  } finally {
    client.close();
  }
}

main();
