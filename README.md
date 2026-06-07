# ProofMint Hedera

> Pay with x402. Mint verifiable Hedera proof.

ProofMint Hedera is a payment-triggered proof minting app for the Hedera AI Agent Bounty Week 3 x402 track. A user connects a Hedera testnet wallet, enters an achievement, approves an x402 Hedera payment, and the server immediately verifies payment before running Hedera Agent Kit actions.

The paid execution records a structured proof on Hedera Consensus Service and mints an HTS proof token. The success screen returns HashScan links for the HCS record, HTS token, payment transaction, and recipient account.

## Bounty Fit

| Requirement | Implementation |
| --- | --- |
| Hosted UI | Next.js App Router UI with wallet, form, payment, progress, and success proof views. |
| Hedera wallet | `@hashgraph/hedera-wallet-connect` on Hedera testnet. |
| x402 payment | `@x402/core` and `@x402/hedera` exact Hedera payment challenge/sign/verify/settle flow. |
| Hedera Agent Kit | `HederaAgentAPI` with consensus and token plugins. |
| Payment -> execution | `/api/mint-proof` executes HCS/HTS only after verified x402 settlement. |
| Paid retry recovery | Settled payment, exact proof record, and HCS checkpoint are persisted before later steps. |
| On-chain proof | HCS proof message plus HTS proof token. |
| Judge links | Success UI shows HashScan links for HCS, token, payment, and account. |

## User Flow

1. Connect a Hedera testnet wallet.
2. Fill the achievement form or use a preset.
3. Submit proof details.
4. Server returns x402 `402 Payment Required`.
5. Wallet signs the exact Hedera payment.
6. Server verifies and settles the payment.
7. Server persists the settled payment and exact proof record.
8. Server submits the proof to HCS through Hedera Agent Kit.
9. Server mints the HTS proof token through Hedera Agent Kit.
10. App shows proof metadata and HashScan links.

## Architecture

```text
src/app/page.tsx                 UI shell and flow state
src/app/api/mint-proof/route.ts  Payment gate plus Hedera execution API
src/components/                  Wallet, form, payment, success, and UI components
src/lib/x402/                    Client and server x402 helpers
src/lib/hedera/                  Agent Kit, HCS, HTS, network, and HashScan helpers
src/lib/proof-state.ts           Retry-safe proof state store with file or Upstash Redis backend
src/lib/rate-limit.ts            API rate limiter
src/lib/payment-progress.ts      Payment/execution progress labels
src/lib/proof-links.ts           Success view link model
src/lib/validation/              Zod proof validation
scripts/setup-hedera.ts          Testnet HCS topic and HTS token provisioning
scripts/associate-x402-token.ts  Testnet USDC association helper
```

## Tech Stack

- Next.js `16.2.7` App Router
- React `19.2.4`
- Tailwind CSS v4 and shadcn-style UI components
- `@hashgraph/hedera-agent-kit`
- `@hashgraph/hedera-wallet-connect`
- `@x402/core` and `@x402/hedera`
- `@hiero-ledger/sdk`
- Zod, TypeScript strict mode, Vitest

## Local Setup

```bash
pnpm install
cp .env.example .env
```

Fill `.env` with funded Hedera testnet credentials, WalletConnect project ID, x402 receiver account, and HCS/HTS resource IDs.

Create the HCS topic and HTS proof token:

```bash
pnpm setup:hedera
```

Copy the printed `HEDERA_HCS_TOPIC_ID` and `HEDERA_PROOF_TOKEN_ID` into `.env`.

If using USDC payments, ensure the receiving account is associated with the testnet USDC token:

```bash
pnpm setup:x402-token
```

Run the app:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required Environment Variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Public app URL. |
| `NEXT_PUBLIC_HEDERA_NETWORK` | Must be `testnet`. |
| `NEXT_PUBLIC_HASHSCAN_BASE_URL` | HashScan base URL, normally `https://hashscan.io/testnet`. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID for browser wallet connection. |
| `HEDERA_NETWORK` | Server Hedera network. Must be `testnet`; app rejects other values. |
| `HEDERA_OPERATOR_ACCOUNT_ID` | Server operator account for Agent Kit actions and x402 fee payer. |
| `HEDERA_OPERATOR_PRIVATE_KEY` | Server-only operator private key. Never expose with `NEXT_PUBLIC_`. |
| `HEDERA_HCS_TOPIC_ID` | HCS topic used for proof messages. |
| `HEDERA_PROOF_TOKEN_ID` | HTS token minted for proof receipts. |
| `X402_PAYMENT_ASSET` | `USDC` or `HBAR`; default is `USDC`. |
| `X402_PRICE_AMOUNT` | Payment amount; default is `0.25`. |
| `X402_PAY_TO_ACCOUNT_ID` | Account receiving x402 payment. |
| `X402_USDC_TOKEN_ID` | Hedera testnet USDC token ID. |
| `UPSTASH_REDIS_REST_URL` | Optional shared Redis REST URL for hosted proof state. |
| `UPSTASH_REDIS_REST_TOKEN` | Optional shared Redis REST token for hosted proof state. |
| `PROOFMINT_STATE_KEY` | Redis key for proof state. |
| `PROOFMINT_STATE_DIR` | Local file state directory when Redis is not configured. |
| `MINT_PROOF_RATE_LIMIT_MAX` | Max proof attempts per IP/account window. |
| `MINT_PROOF_RATE_LIMIT_WINDOW_MS` | Rate-limit window in milliseconds. |

## Payment and Execution Model

The first `POST /api/mint-proof` validates the proof payload and returns HTTP 402 with `PAYMENT-REQUIRED`.

The client signs the exact Hedera x402 transfer through the connected wallet and resubmits with `PAYMENT-SIGNATURE`.

The server then:

1. Verifies proof digest matches the payment challenge.
2. Verifies and settles the x402 payment.
3. Persists settled payment state.
4. Persists the exact `ProofRecord` before HCS.
5. Submits the proof JSON to HCS.
6. Persists the HCS checkpoint.
7. Mints the HTS proof token.
8. Returns HashScan links.

If payment settles but HCS/HTS fails, retry uses the persisted payment and proof record instead of charging the user again. If HCS already succeeded, retry does not submit a duplicate HCS message.

## State Storage

For local development, proof state is stored in `PROOFMINT_STATE_DIR` or a temp fallback.

For hosted/serverless demos, set:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
PROOFMINT_STATE_KEY=proofmint:proof-state
```

This gives all app instances access to the same settled payment, proof record, HCS checkpoint, and completed response state.

## Safety Model

- Testnet-only runtime and setup scripts.
- Server-side private key only.
- No frontend private key input.
- x402 payment is bound to the canonical proof digest.
- Hedera execution is blocked until payment verification and settlement succeed.
- Paid retry state prevents duplicate charges after execution failure.
- HCS checkpoint prevents duplicate HCS submissions after token mint failure.
- HTS mint is required; failure returns an error instead of pretending the proof token minted.
- Basic API rate limiting reduces accidental or abusive repeated attempts.

## Full Flow Test Checklist

Before submission, run one funded testnet proof and save:

| Proof Item | Link |
| --- | --- |
| Live app | Add hosted URL |
| Payment transaction | Add HashScan payment transaction URL |
| HCS transaction | Add HashScan HCS transaction URL |
| HTS token | Add HashScan token URL |
| Recipient account | Add HashScan account URL |

## Verification

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Current local verification target:

- ESLint clean
- TypeScript clean
- Vitest coverage for validation, proof digest, x402 challenge, state recovery, rate limiting, progress labels, proof links, HashScan helpers, testnet lock, and HTS config failure
- Next production build

## Known Limitations

- Live wallet approval and real x402 settlement require a funded Hedera testnet wallet and cannot be automated without user approval.
- The proof token is currently fungible. A non-fungible credential receipt would be stronger for production.
- Rate limiting is process-local; use infrastructure-level throttling for production.
- Upstash proof state stores one JSON document. For high traffic, split records into per-idempotency keys.

## License

Apache-2.0. See [LICENSE](./LICENSE).
