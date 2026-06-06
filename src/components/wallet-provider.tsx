"use client";

import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  DAppConnector,
  HederaJsonRpcMethod,
  HederaSessionEvent,
  HederaChainId,
  type DAppSigner,
} from "@hashgraph/hedera-wallet-connect";
import { LedgerId } from "@hiero-ledger/sdk";
import { WalletContext, WalletState } from "@/hooks/use-wallet";

const initialWallet: WalletState = {
  accountId: null,
  isConnected: false,
  network: "testnet",
  isConnecting: false,
  error: null,
  connector: null,
  signer: null,
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>(initialWallet);

  useEffect(() => {
    let active = true;

    async function initWalletConnect() {
      try {
        const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
        if (!projectId) {
          throw new Error("Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID to enable wallet connection.");
        }

        const connector = new DAppConnector(
          {
            name: "ProofMint Hedera",
            description: "Pay once via x402 and mint a verifiable Hedera proof.",
            url: window.location.origin,
            icons: ["https://walletconnect.com/walletconnect-logo.png"],
          },
          LedgerId.TESTNET,
          projectId,
          [
            HederaJsonRpcMethod.SignTransaction,
            HederaJsonRpcMethod.ExecuteTransaction,
            HederaJsonRpcMethod.SignMessage,
          ],
          [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
          [HederaChainId.Testnet],
          "error"
        );

        await connector.init();
        if (!active) return;

        const signer = connector.signers[0] ?? null;
        setWallet((prev) => ({
          ...prev,
          connector,
          signer,
          accountId: signer?.getAccountId().toString() ?? null,
          isConnected: Boolean(signer),
          error: null,
        }));
      } catch (err: unknown) {
        if (!active) return;
        setWallet((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : "WalletConnect initialization failed.",
        }));
      }
    }

    initWalletConnect();

    return () => {
      active = false;
    };
  }, []);

  const connect = useCallback(async () => {
    if (!wallet.connector) {
      setWallet((prev) => ({ ...prev, error: "Wallet connector is not initialized." }));
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      await wallet.connector.openModal();
      const signer = wallet.connector.signers[0] ?? null;
      if (!signer) {
        throw new Error("No Hedera account returned by wallet.");
      }

      setWallet((prev) => ({
        ...prev,
        signer: signer as DAppSigner,
        accountId: signer.getAccountId().toString(),
        isConnected: true,
        isConnecting: false,
        error: null,
      }));
    } catch (err: unknown) {
      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: err instanceof Error ? err.message : "Failed to connect wallet.",
      }));
    }
  }, [wallet.connector]);

  const disconnect = useCallback(async () => {
    if (wallet.connector) {
      try {
        await wallet.connector.disconnectAll();
      } catch {
        // Some wallets throw when no active pairing remains; local state still clears.
      }
    }

    setWallet((prev) => ({
      ...prev,
      accountId: null,
      signer: null,
      isConnected: false,
      error: null,
    }));
  }, [wallet.connector]);

  const value = useMemo(
    () => ({ ...wallet, connect, disconnect }),
    [wallet, connect, disconnect]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
