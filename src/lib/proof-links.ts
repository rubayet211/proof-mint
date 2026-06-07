import type { MintProofResponse } from "@/types";

export interface VisibleProofLink {
  label: string;
  url: string;
  copyValue?: string;
}

export function getVisibleProofLinks(response: MintProofResponse): VisibleProofLink[] {
  const links: VisibleProofLink[] = [];

  if (response.links?.hcsTransaction) {
    links.push({
      label: "HCS Record",
      url: response.links.hcsTransaction,
      copyValue: response.hedera?.hcsTransactionId,
    });
  }

  if (response.links?.token) {
    links.push({
      label: "HTS Token",
      url: response.links.token,
      copyValue: response.hedera?.tokenId,
    });
  }

  if (response.links?.paymentTransaction) {
    links.push({
      label: "Payment",
      url: response.links.paymentTransaction,
      copyValue: response.payment?.transactionId,
    });
  }

  if (response.links?.account) {
    links.push({
      label: "Recipient Account",
      url: response.links.account,
      copyValue: response.proof?.recipientAccountId,
    });
  }

  return links;
}
