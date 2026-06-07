import { AccountId, Client, TransactionId, type Transaction } from "@hiero-ledger/sdk";
import type { PaymentRequired } from "@x402/core/types";
import { HEDERA_TESTNET_CAIP2 } from "@x402/hedera";
import type { DAppSigner } from "@hashgraph/hedera-wallet-connect";
import { describe, expect, it } from "vitest";
import { createWalletPaymentHeaders } from "./client";

const payerAccountId = "0.0.1111";
const feePayerAccountId = "0.0.2222";

function createPaymentRequired(): PaymentRequired {
  return {
    x402Version: 2,
    error: "Payment required",
    resource: {
      url: "http://localhost:3000/api/mint-proof",
      description: "Mint a ProofMint Hedera proof",
      mimeType: "application/json",
      serviceName: "ProofMint Hedera",
    },
    accepts: [
      {
        scheme: "exact",
        network: HEDERA_TESTNET_CAIP2,
        amount: "250000",
        asset: "0.0.429274",
        payTo: "0.0.3333",
        maxTimeoutSeconds: 120,
        extra: {
          feePayer: feePayerAccountId,
        },
      },
    ],
  };
}

function createFakeWalletSigner(): DAppSigner {
  return {
    getAccountId: () => AccountId.fromString(payerAccountId),
    populateTransaction: async <T extends Transaction>(transaction: T): Promise<T> =>
      transaction.setTransactionId(TransactionId.generate(AccountId.fromString(payerAccountId))),
    signTransaction: async <T extends Transaction>(transaction: T): Promise<T> => {
      transaction.freezeWith(Client.forTestnet());
      return transaction;
    },
  } as DAppSigner;
}

describe("createWalletPaymentHeaders", () => {
  it("does not repopulate a facilitator transaction ID before wallet signing", async () => {
    await expect(
      createWalletPaymentHeaders(createPaymentRequired(), createFakeWalletSigner(), payerAccountId)
    ).resolves.toHaveProperty("PAYMENT-SIGNATURE");
  });
});
