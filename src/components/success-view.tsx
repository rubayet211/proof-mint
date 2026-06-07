"use client";

import { MintProofResponse } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ExternalLink, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { getVisibleProofLinks } from "@/lib/proof-links";

export function SuccessView({ response, onReset }: { response: MintProofResponse, onReset: () => void }) {
  const { proof, hedera, links } = response;
  const visibleLinks = getVisibleProofLinks(response);

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${description} copied to clipboard`);
  };

  const shareProof = () => {
    const text = `I just minted a verifiable achievement proof: "${proof?.title}" on Hedera Testnet via @ProofMintAgent! 🚀\n\nVerify it here: ${links?.hcsTransaction}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
  };

  if (!proof) return null;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
        <div className="bg-green-500/20 p-3 rounded-full">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Proof Minted Successfully!</h2>
        <p className="text-muted-foreground max-w-md">
          Your achievement has been recorded on the Hedera Consensus Service{hedera?.tokenId ? " and an HTS proof token has been minted." : "."}
        </p>
      </div>

      <Card className="border-green-500/30 bg-green-500/5">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{proof.title}</CardTitle>
              <CardDescription className="mt-1">{proof.description || "No description provided."}</CardDescription>
            </div>
            <Badge variant="outline" className="bg-background">
              {proof.category}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Issuer</p>
              <p className="font-medium">{proof.issuerName}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Date</p>
              <p className="font-medium">{new Date(proof.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Payer Account</p>
              <p className="font-medium font-mono">{proof.payerAccountId}</p>
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Recipient Account</p>
              <p className="font-medium font-mono">{proof.recipientAccountId}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 bg-card/50 border-t p-4 rounded-b-xl">
          {visibleLinks.map((link) => (
            <div key={link.label} className="flex items-center justify-between w-full gap-3">
              <span className="text-sm font-medium">{link.label}</span>
              <div className="flex gap-2">
                {link.copyValue && (
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(link.copyValue || "", link.label)}>
                  <Copy className="h-3 w-3 mr-1" /> Copy ID
                </Button>
                )}
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  <Button variant="default" size="sm">
                    HashScan <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </a>
              </div>
            </div>
          ))}
        </CardFooter>
      </Card>

      <div className="flex justify-center gap-4 pt-4">
        <Button variant="outline" onClick={onReset}>
          Create Another Proof
        </Button>
        <Button onClick={shareProof} className="bg-blue-500 hover:bg-blue-600 text-white">
          <Share2 className="h-4 w-4 mr-2" /> Share on X
        </Button>
      </div>
    </div>
  );
}
