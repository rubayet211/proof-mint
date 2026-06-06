import { runProofMintAgentTool } from "./agent-kit";
import { ProofRecord } from "@/types";

export async function submitProofMessage(proof: ProofRecord): Promise<{ hcsTransactionId: string; hcsTopicId: string }> {
  const topicId = process.env.HEDERA_HCS_TOPIC_ID;

  if (!topicId) {
    throw new Error("Missing HEDERA_HCS_TOPIC_ID in environment variables.");
  }

  // Submit the JSON proof to HCS
  const messageBody = JSON.stringify(proof);

  const result = await runProofMintAgentTool<{
    raw?: { status?: string; transactionId?: string };
    humanMessage?: string;
  }>("submit_topic_message_tool", {
    topicId,
    message: messageBody,
    transactionMemo: `ProofMint ${proof.proofId}`,
  });

  if (result.raw?.status !== "SUCCESS" || !result.raw.transactionId) {
    throw new Error(result.humanMessage || "HCS submission failed through Hedera Agent Kit.");
  }

  return {
    hcsTransactionId: result.raw.transactionId,
    hcsTopicId: topicId,
  };
}
