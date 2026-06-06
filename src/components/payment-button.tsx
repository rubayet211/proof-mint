"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { ProofSchemaInput } from "@/lib/validation/proof.schema";
import { MintProofResponse } from "@/types";
import { useWallet } from "@/hooks/use-wallet";
import { createWalletPaymentHeaders } from "@/lib/x402/client";

interface PaymentButtonProps {
  data: ProofSchemaInput | null;
  onSuccess: (res: MintProofResponse) => void;
  onReset: () => void;
}

export function PaymentButton({ data, onSuccess }: PaymentButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { signer, accountId } = useWallet();

  const handlePaymentAndMint = async () => {
    if (!data) return;
    if (!signer || !accountId) {
      toast.error("Connect a Hedera testnet wallet before paying.");
      return;
    }

    setIsProcessing(true);

    try {
      const initialReq = await fetch("/api/mint-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (initialReq.status !== 402) {
        const body: MintProofResponse = await initialReq.json();
        if (initialReq.ok && body.success) {
          onSuccess(body);
          return;
        }
        throw new Error(body.message || body.error || "Payment challenge failed.");
      }

      const paymentRequired = await initialReq.json();
      const requirement = paymentRequired.accepts?.[0];
      const displayAmount = requirement?.extra?.displayAmount || "0.25";
      const displayAsset = requirement?.extra?.displayAsset || "USDC";

      toast.info(`Approve ${displayAmount} ${displayAsset} in your wallet.`);
      const paymentHeaders = await createWalletPaymentHeaders(paymentRequired, signer, accountId);

      toast.success("Payment signed. Settling and executing Hedera Agent Kit actions...");

      const finalReq = await fetch("/api/mint-proof", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...paymentHeaders,
        },
        body: JSON.stringify(data),
      });

      const finalData: MintProofResponse = await finalReq.json();

      if (finalReq.ok && finalData.success) {
        onSuccess(finalData);
      } else {
        throw new Error(finalData.message || finalData.error || "Payment settled but proof execution failed.");
      }
    } catch (error: unknown) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!data) return null;

  return (
    <Button
      onClick={handlePaymentAndMint}
      disabled={isProcessing}
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6"
    >
      {isProcessing ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Paying, settling, and minting...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-5 w-5" />
          Pay 0.25 USDC & Mint Proof
        </>
      )}
    </Button>
  );
}
