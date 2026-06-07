import {
  AccountId,
  AccountInfoQuery,
  Client,
  PrivateKey,
  TokenAssociateTransaction,
  TokenId,
} from "@hiero-ledger/sdk";
import "dotenv/config";

async function main() {
  const paymentAsset = process.env.X402_PAYMENT_ASSET || "USDC";
  if (paymentAsset === "HBAR") {
    console.log("X402_PAYMENT_ASSET=HBAR does not require token association.");
    return;
  }

  const operatorAccountId = process.env.HEDERA_OPERATOR_ACCOUNT_ID;
  const operatorPrivateKey = process.env.HEDERA_OPERATOR_PRIVATE_KEY;
  const payToAccountId = process.env.X402_PAY_TO_ACCOUNT_ID || operatorAccountId;
  const tokenId = process.env.X402_USDC_TOKEN_ID || "0.0.429274";
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!operatorAccountId || !operatorPrivateKey || !payToAccountId) {
    throw new Error("Missing HEDERA_OPERATOR_ACCOUNT_ID, HEDERA_OPERATOR_PRIVATE_KEY, or X402_PAY_TO_ACCOUNT_ID.");
  }

  if (payToAccountId !== operatorAccountId) {
    throw new Error(
      "This helper can only associate the configured token when X402_PAY_TO_ACCOUNT_ID matches HEDERA_OPERATOR_ACCOUNT_ID."
    );
  }

  const client = network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
  const privateKey = PrivateKey.fromStringECDSA(operatorPrivateKey);
  client.setOperator(AccountId.fromString(operatorAccountId), privateKey);

  try {
    const account = AccountId.fromString(payToAccountId);
    const token = TokenId.fromString(tokenId);
    const info = await new AccountInfoQuery().setAccountId(account).execute(client);

    if (info.tokenRelationships?.get(token)) {
      console.log(`${payToAccountId} is already associated with ${tokenId}.`);
      return;
    }

    const response = await new TokenAssociateTransaction()
      .setAccountId(account)
      .setTokenIds([token])
      .execute(client);
    const receipt = await response.getReceipt(client);
    console.log(`Associated ${payToAccountId} with ${tokenId}: ${receipt.status.toString()}`);
  } finally {
    client.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
