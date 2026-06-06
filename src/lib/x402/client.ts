"use client";

import { x402Client, x402HTTPClient } from "@x402/core/client";
import type { PaymentRequired, PaymentRequirements } from "@x402/core/types";
import { ExactHederaScheme } from "@x402/hedera/exact/client";
import { HBAR_ASSET_ID, HEDERA_TESTNET_CAIP2 } from "@x402/hedera";
import { AccountId, Hbar, TokenId, TransactionId, TransferTransaction } from "@hiero-ledger/sdk";
import {
  transactionToBase64String,
  type DAppSigner,
} from "@hashgraph/hedera-wallet-connect";

export async function createWalletPaymentHeaders(
  paymentRequired: PaymentRequired,
  signer: DAppSigner,
  payerAccountId: string
): Promise<Record<string, string>> {
  const clientSigner = {
    accountId: payerAccountId,
    createPartiallySignedTransferTransaction: (requirements: PaymentRequirements) =>
      createPartiallySignedTransferTransaction(requirements, signer, payerAccountId),
  };

  const client = new x402Client().register(HEDERA_TESTNET_CAIP2, new ExactHederaScheme(clientSigner));
  const httpClient = new x402HTTPClient(client);
  const payload = await httpClient.createPaymentPayload(paymentRequired);
  return httpClient.encodePaymentSignatureHeader(payload);
}

async function createPartiallySignedTransferTransaction(
  requirements: PaymentRequirements,
  signer: DAppSigner,
  payerAccountId: string
): Promise<string> {
  if (requirements.network !== HEDERA_TESTNET_CAIP2) {
    throw new Error("ProofMint only supports Hedera testnet payments.");
  }

  const feePayer = requirements.extra?.feePayer;
  if (typeof feePayer !== "string") {
    throw new Error("Payment requirement is missing facilitator fee payer.");
  }

  const payer = AccountId.fromString(payerAccountId);
  const payTo = AccountId.fromString(requirements.payTo);
  const amount = BigInt(requirements.amount);
  const transaction = new TransferTransaction().setTransactionId(TransactionId.generate(AccountId.fromString(feePayer)));

  if (requirements.asset === HBAR_ASSET_ID) {
    transaction.addHbarTransfer(payer, Hbar.fromTinybars((-amount).toString()));
    transaction.addHbarTransfer(payTo, Hbar.fromTinybars(amount.toString()));
  } else {
    const tokenId = TokenId.fromString(requirements.asset);
    transaction.addTokenTransfer(tokenId, payer, -amount);
    transaction.addTokenTransfer(tokenId, payTo, amount);
  }

  const populated = await signer.populateTransaction(transaction);
  const signed = await signer.signTransaction(populated);
  return transactionToBase64String(signed);
}
