import { describe, expect, it } from "vitest";
import { getVisibleProofLinks } from "./proof-links";
import type { MintProofResponse } from "@/types";

describe("visible proof links", () => {
  it("includes HCS, token, payment, and account links when present", () => {
    const response: MintProofResponse = {
      success: true,
      hedera: {
        hcsTopicId: "0.0.456",
        hcsTransactionId: "0.0.999@1780822009.510446976",
        tokenId: "0.0.777",
        tokenTransactionId: "0.0.999@1780822010.510446976",
      },
      links: {
        hcsTransaction: "https://hashscan.io/testnet/transaction/hcs",
        token: "https://hashscan.io/testnet/token/0.0.777",
        paymentTransaction: "https://hashscan.io/testnet/transaction/payment",
        account: "https://hashscan.io/testnet/account/0.0.123",
      },
    };

    expect(getVisibleProofLinks(response).map((link) => link.label)).toEqual([
      "HCS Record",
      "HTS Token",
      "Payment",
      "Recipient Account",
    ]);
  });

  it("omits optional links that are not present", () => {
    expect(getVisibleProofLinks({ success: true })).toEqual([]);
  });
});
