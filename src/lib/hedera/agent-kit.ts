import { Client, PrivateKey } from "@hiero-ledger/sdk";
import { AgentMode, HederaAgentAPI, ToolDiscovery, type Context } from "@hashgraph/hedera-agent-kit";
import { 
  coreConsensusPlugin, 
  coreTokenPlugin 
} from "@hashgraph/hedera-agent-kit/plugins";
import { requireHederaTestnet } from "./network";

let clientInstance: Client | null = null;
let agentInstance: HederaAgentAPI | null = null;

export function getHederaClient(): Client {
  if (clientInstance) return clientInstance;

  requireHederaTestnet(process.env.HEDERA_NETWORK);
  const accountId = process.env.HEDERA_OPERATOR_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_OPERATOR_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error("Missing Hedera operator credentials in environment variables.");
  }

  const client = Client.forTestnet();
  
  client.setOperator(
    accountId,
    PrivateKey.fromStringECDSA(privateKey)
  );

  clientInstance = client;
  return clientInstance;
}

export function getProofMintAgent(): HederaAgentAPI {
  if (agentInstance) return agentInstance;

  const client = getHederaClient();
  const context: Context = {
    accountId: process.env.HEDERA_OPERATOR_ACCOUNT_ID,
    mode: AgentMode.AUTONOMOUS,
  };
  const discovery = new ToolDiscovery([coreConsensusPlugin, coreTokenPlugin]);
  const tools = discovery.getAllTools(context);

  agentInstance = new HederaAgentAPI(client, context, tools);
  return agentInstance;
}

export async function runProofMintAgentTool<T = unknown>(method: string, arg: unknown): Promise<T> {
  const output = await getProofMintAgent().run(method, arg);
  return JSON.parse(output) as T;
}
