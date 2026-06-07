import { runProofMintAgentTool } from "./agent-kit";
import { ProofRecord } from "@/types";

export async function mintProofToken(proof: ProofRecord): Promise<{ tokenId?: string; tokenSerial?: string; tokenTransactionId?: string }> {
  const tokenId = process.env.HEDERA_PROOF_TOKEN_ID;

  if (!tokenId) {
    throw new Error("Missing HEDERA_PROOF_TOKEN_ID in environment variables.");
  }

  try {
    const mintResult = await runProofMintAgentTool<{
      raw?: { status?: string; transactionId?: string; tokenId?: string };
      humanMessage?: string;
    }>("mint_fungible_token_tool", {
      tokenId,
      amount: 1,
      transactionMemo: `ProofMint ${proof.proofId}`,
    });

    if (mintResult.raw?.status !== "SUCCESS") {
      throw new Error(mintResult.humanMessage || "Token mint failed through Hedera Agent Kit.");
    }

    return {
      tokenId: tokenId,
      tokenTransactionId: mintResult.raw?.transactionId
    };
  } catch (error) {
    console.error("HTS Error:", error);
    throw error;
  }
}
