# ProofMint Hedera

> Pay once. Mint permanent proof.

ProofMint Hedera is a payment-triggered proof minting MVP for the Hedera AI Agent Bounty Week 3 x402 track. A user connects a Hedera testnet wallet, enters an achievement, approves an x402 payment, and only then the server executes Hedera Agent Kit actions to record the proof on HCS and mint a proof token through HTS.

## Bounty Fit

| Requirement | Implementation |
| --- | --- |
| Hedera Agent Kit | Server initializes `HederaAgentAPI` from `@hashgraph/hedera-agent-kit` and runs consensus/token tools. |
| x402 payment gate | `/api/mint-proof` returns HTTP 402 with `PAYMENT-REQUIRED` when payment is missing. |
| Paid action | The client signs an x402 v2 exact Hedera payment and resubmits with `PAYMENT-SIGNATURE`. |
| Wallet integration | Uses `@hashgraph/hedera-wallet-connect` on Hedera testnet. |
| Human approval | Wallet approval is required before payment headers are generated. |
| On-chain proof | Server submits structured JSON to HCS and mints one HTS proof token when configured. |
| Judge links | Success view returns HashScan links for HCS, payment, token, and account. |

## User Flow

1. Connect a Hedera testnet wallet.
2. Fill the achievement form or use a preset.
3. Review the visible `0.25 USDC` price.
4. Submit the proof request.
5. Server returns x402 `402 Payment Required`.
6. Wallet signs the exact Hedera payment.
7. Server verifies and settles the payment.
8. Server executes Hedera Agent Kit tools.
9. App shows proof metadata and HashScan links.

## Architecture

```text
src/app/page.tsx                 UI shell and flow state
src/components/                  Wallet, form, payment, success, and UI components
src/app/api/mint-proof/route.ts  Payment gate plus Hedera execution API
src/lib/x402/                   Client and server x402 helpers
src/lib/hedera/                 Agent Kit, HCS, HTS, and HashScan helpers
src/lib/validation/             Zod proof validation
src/lib/idempotency.ts          Demo in-memory duplicate request guard
scripts/setup-hedera.ts         HCS topic and HTS token provisioning helper
```

## Tech Stack

- Next.js `16.2.7` App Router
- React `19.2.4`
- Tailwind CSS v4 and shadcn-style UI components
- `@hashgraph/hedera-agent-kit`
- `@hashgraph/hedera-wallet-connect`
- `@x402/core` and `@x402/hedera`
- Zod, TypeScript strict mode, Vitest

## Local Setup

```bash
pnpm install
cp .env.example .env
```

Fill `.env` with funded Hedera testnet credentials, WalletConnect project ID, x402 receiver account, and the HCS/HTS resource IDs.

```bash
pnpm setup:hedera
```

Copy the printed `HEDERA_HCS_TOPIC_ID` and `HEDERA_PROOF_TOKEN_ID` into `.env`.

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required Environment Variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public app URL. |
| `NEXT_PUBLIC_HEDERA_NETWORK` | Should be `testnet` for bounty demo. |
| `NEXT_PUBLIC_HASHSCAN_BASE_URL` | HashScan base URL, normally `https://hashscan.io/testnet`. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID for browser wallet connection. |
| `HEDERA_NETWORK` | Server Hedera network, expected `testnet`. |
| `HEDERA_OPERATOR_ACCOUNT_ID` | Server operator account for Agent Kit actions and x402 fee payer. |
| `HEDERA_OPERATOR_PRIVATE_KEY` | Server-only operator private key. Never expose with `NEXT_PUBLIC_`. |
| `HEDERA_HCS_TOPIC_ID` | HCS topic used for proof messages. |
| `HEDERA_PROOF_TOKEN_ID` | HTS token minted for proof receipts. |
| `X402_PAYMENT_ASSET` | `USDC` or `HBAR`; default is `USDC`. |
| `X402_PRICE_AMOUNT` | Visible payment amount; default is `0.25`. |
| `X402_PAY_TO_ACCOUNT_ID` | Account receiving x402 payment. |
| `X402_USDC_TOKEN_ID` | Hedera testnet USDC token ID. |

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Deployment

The app is deployable to Vercel as a standard Next.js App Router project. Configure all non-public environment variables only in Vercel server-side environment settings. Use funded Hedera testnet accounts and keep `NEXT_PUBLIC_HEDERA_NETWORK=testnet`.

## Safety Model

- Testnet-only MVP.
- Server-side private key only.
- No frontend private key input.
- Fixed visible payment amount.
- x402 payment is bound to a proof digest so a payment for one proof cannot be reused for a different proof payload.
- In-memory idempotency prevents fast duplicate minting in local/demo runtime.

## Known Limitations

- The final wallet/x402/on-chain flow requires funded testnet accounts and live wallet approval; automated tests cover the payment gate and payload construction but do not perform live settlement.
- Idempotency is in-memory. A production deployment should use Redis, Vercel KV, or a database.
- HTS minting requires a pre-created token with the operator as supply key.
- The hosted demo URL and AI Studio feedback link must be filled before final bounty submission.

## Submission Placeholders

- Live demo: TODO
- Public GitHub repo: TODO
- Demo video or X post: TODO
- AI Studio feedback: TODO
