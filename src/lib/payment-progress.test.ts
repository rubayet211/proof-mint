import { describe, expect, it } from "vitest";
import { getPaymentStepLabel, paymentStepLabels } from "./payment-progress";

describe("payment progress labels", () => {
  it("includes the required x402 and Hedera execution stages", () => {
    expect(paymentStepLabels).toEqual({
      requestingPayment: "Processing payment via x402...",
      signingPayment: "Waiting for wallet approval...",
      verifyingPayment: "Verifying payment...",
      recordingProof: "Recording on Hedera...",
      mintingToken: "Minting proof token...",
      generatingProof: "Generating HashScan proof...",
    });
  });

  it("returns a fallback for idle state", () => {
    expect(getPaymentStepLabel(null)).toBe("Pay & mint proof");
  });
});
