"use client";

import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, LogOut, Loader2, AlertCircle } from "lucide-react";

export function WalletConnector() {
  const { accountId, isConnected, network, isConnecting, error, connect, disconnect } = useWallet();

  if (error) {
    return (
      <div className="flex min-w-0 max-w-[220px] items-center gap-2 sm:max-w-md">
        <AlertCircle className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
        <span className="min-w-0 truncate text-xs text-destructive sm:text-sm" title={error}>
          {error}
        </span>
        <Button variant="outline" size="sm" onClick={connect}>
          Retry
        </Button>
      </div>
    );
  }

  if (isConnected && accountId) {
    return (
      <div className="flex max-w-full items-center gap-3 rounded-full border border-border bg-secondary/30 px-3 py-1.5">
        <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
          {network === "testnet" ? "Testnet" : "Mainnet"}
        </Badge>
        <span className="max-w-32 truncate font-mono text-sm font-medium sm:max-w-none">{accountId}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={disconnect} title="Disconnect">
          <LogOut className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connect} disabled={isConnecting} className="gap-2">
      {isConnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}
