"use client";

import { createContext, useContext } from "react";
import type { DAppConnector } from "@hashgraph/hedera-wallet-connect";
import type { DAppSigner } from "@hashgraph/hedera-wallet-connect";

export interface WalletState {
  accountId: string | null;
  isConnected: boolean;
  network: "testnet" | "mainnet";
  isConnecting: boolean;
  error: string | null;
  connector: DAppConnector | null;
  signer: DAppSigner | null;
}

export interface WalletContextValue extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("useWallet must be used within WalletProvider.");
  }

  return context;
}
