"use client";

import { WalletConnector } from "./wallet-connector";
import { Badge } from "@/components/ui/badge";
import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full">
      <div className="container flex h-16 max-w-screen-xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 shrink-0 items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight hidden sm:inline-block">ProofMint Hedera</span>
            <span className="font-bold text-xl tracking-tight sm:hidden">PMH</span>
          </Link>
          <Badge variant="outline" className="hidden sm:inline-flex bg-primary/10 text-primary border-primary/20">
            Hedera Testnet
          </Badge>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
          <a
            href="https://github.com/rubayet211/proof-mint"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex"
            aria-label="Open GitHub repository"
          >
            <Button variant="ghost" size="icon" type="button">
              <GitBranch className="h-5 w-5" />
            </Button>
          </a>
          <WalletConnector />
        </div>
      </div>
    </nav>
  );
}
