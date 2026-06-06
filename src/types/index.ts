export type ProofCategory =
  | "Training"
  | "Education"
  | "Work"
  | "Sports"
  | "Other";

export interface ProofFormInput {
  title: string;
  description?: string;
  category: ProofCategory;
  payerAccountId: string;
  recipientAccountId?: string;
  issuerName?: string;
}

export interface ProofRecord {
  proofId: string;
  title: string;
  description?: string;
  category: ProofCategory;
  payerAccountId: string;
  recipientAccountId: string;
  issuerName: string;
  createdAt: string;
  paymentReference?: string;
  proofDigest?: string;
  app: "ProofMint Hedera";
  network: "testnet";
  schemaVersion: "1.0";
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  settlementId?: string;
  amount?: string;
  asset?: "HBAR" | "USDC";
  payer?: string;
  network?: string;
}

export interface HederaExecutionResult {
  hcsTopicId?: string;
  hcsTransactionId: string;
  tokenId?: string;
  tokenSerial?: string;
  tokenTransactionId?: string;
}

export interface MintProofResponse {
  success: boolean;
  proof?: ProofRecord;
  payment?: PaymentResult;
  hedera?: HederaExecutionResult;
  links?: {
    hcsTransaction?: string;
    token?: string;
    paymentTransaction?: string;
    account?: string;
  };
  message?: string;
  error?: string;
}
