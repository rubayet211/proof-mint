"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { AchievementForm } from "@/components/achievement-form";
import { PaymentButton } from "@/components/payment-button";
import { SuccessView } from "@/components/success-view";
import { useWallet } from "@/hooks/use-wallet";
import { WalletProvider } from "@/components/wallet-provider";
import { ProofSchemaInput } from "@/lib/validation/proof.schema";
import { MintProofResponse } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Zap, Database } from "lucide-react";

export default function Home() {
  return (
    <WalletProvider>
      <HomeContent />
    </WalletProvider>
  );
}

function HomeContent() {
  const { accountId, isConnected } = useWallet();
  const [formData, setFormData] = useState<ProofSchemaInput | null>(null);
  const [successResponse, setSuccessResponse] = useState<MintProofResponse | null>(null);

  const handleFormSubmit = (data: ProofSchemaInput) => {
    setFormData(data);
  };

  const handleReset = () => {
    setFormData(null);
    setSuccessResponse(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center p-4 sm:p-8 lg:p-12 relative overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/10 via-background to-background pointer-events-none -z-10" />
        
        {/* Hero Section */}
        {!successResponse && (
          <div className="max-w-3xl text-center space-y-4 mb-10 mt-6 sm:mt-10 animate-in slide-in-from-bottom-4 duration-500 fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Pay once. <span className="text-primary">Mint permanent proof.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create verifiable achievement proofs using x402 payments and Hedera Agent Kit. 
              Securely record your milestones on the Hedera Consensus Service.
            </p>
          </div>
        )}

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Action Card */}
          <div className={successResponse ? "lg:col-span-12 max-w-3xl mx-auto w-full" : "lg:col-span-7 w-full"}>
            {successResponse ? (
              <SuccessView response={successResponse} onReset={handleReset} />
            ) : (
              <Card className="border-border/50 shadow-lg shadow-black/5 dark:shadow-white/5 backdrop-blur-sm bg-card/95">
                <CardHeader>
                  <CardTitle>Mint Your Achievement</CardTitle>
                  <CardDescription>
                    Fill out the details below. A 0.25 USDC payment is required to execute the agent.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {!isConnected && (
                    <div className="bg-muted/50 rounded-lg p-6 text-center space-y-3 border border-dashed">
                      <p className="text-muted-foreground text-sm">Please connect your Hedera Testnet wallet to begin.</p>
                    </div>
                  )}
                  
                  <div className={!isConnected ? "opacity-50 pointer-events-none filter blur-[1px] transition-all" : ""}>
                    <AchievementForm 
                      payerAccountId={accountId} 
                      onSubmit={handleFormSubmit} 
                      isPending={!!formData} 
                    />
                  </div>

                  {formData && isConnected && (
                    <div className="pt-4 border-t animate-in fade-in slide-in-from-top-4">
                      <PaymentButton 
                        data={formData} 
                        onSuccess={setSuccessResponse} 
                        onReset={handleReset} 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Info Sidebar */}
          {!successResponse && (
            <div className="lg:col-span-5 space-y-6">
              <Card className="bg-secondary/20 border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">How it Works</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <div className="bg-primary/10 p-2 rounded-full h-fit">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">1. x402 Payment</h4>
                      <p className="text-xs text-muted-foreground mt-1">Approve a small payment via your wallet. Verified safely on the server by Blocky402.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-primary/10 p-2 rounded-full h-fit">
                      <Database className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">2. Agent Execution</h4>
                      <p className="text-xs text-muted-foreground mt-1">Our Hedera Agent Kit plugin submits your proof to the Hedera Consensus Service.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-primary/10 p-2 rounded-full h-fit">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">3. HTS Token Minted</h4>
                      <p className="text-xs text-muted-foreground mt-1">You receive an on-chain token representing your verifiable achievement.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
