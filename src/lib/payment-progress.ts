export type PaymentStep =
  | "requestingPayment"
  | "signingPayment"
  | "verifyingPayment"
  | "recordingProof"
  | "mintingToken"
  | "generatingProof";

export const paymentStepLabels: Record<PaymentStep, string> = {
  requestingPayment: "Processing payment via x402...",
  signingPayment: "Waiting for wallet approval...",
  verifyingPayment: "Verifying payment...",
  recordingProof: "Recording on Hedera...",
  mintingToken: "Minting proof token...",
  generatingProof: "Generating HashScan proof...",
};

export function getPaymentStepLabel(step: PaymentStep | null): string {
  return step ? paymentStepLabels[step] : "Pay & mint proof";
}
