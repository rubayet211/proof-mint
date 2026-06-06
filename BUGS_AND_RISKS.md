# Bugs And Risks

| ID | Severity | Area | Problem | Evidence | Impact | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| R-001 | HIGH | Demo | Live wallet/x402/Hedera end-to-end flow not verified in this environment. | No funded testnet env provided. | Judges may hit runtime config/funding issues. | Run and record one full demo before submission. |
| R-002 | HIGH | Submission | Hosted URL, public repo URL, demo video/X post, and feedback link are placeholders. | README placeholders. | Bounty submission incomplete. | Fill final links. |
| R-003 | HIGH | Idempotency | In-memory idempotency is not durable on Vercel/serverless. | `src/lib/idempotency.ts`. | Duplicate mints possible across instances/restarts. | Use Vercel KV/Redis/database. |
| R-004 | MEDIUM | Recovery | Paid-but-Hedera-failed path lacks persisted recovery state. | Route settles before HCS/HTS, then returns 500 on execution error. | User could pay and need manual support. | Persist payment settlement and resume proof execution. |
| R-005 | MEDIUM | HTS | Fungible proof token is less semantically strong than NFT proof receipt. | `mint_fungible_token_tool`. | Judges may expect unique proof asset. | Switch to NFT if Agent Kit/tool support permits. |
| R-006 | MEDIUM | Env | Wallet connect requires `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`. | Local smoke shows compact missing-env warning. | Demo cannot connect without setup. | Configure Vercel/local env. |
| R-007 | MEDIUM | Token setup | HTS mint requires configured token with operator supply key. | README/setup script. | Mint step fails if token missing/misconfigured. | Run `pnpm setup:hedera` and fund account. |
| R-008 | LOW | Console | Dev shows Lit dev-mode warning from wallet dependency. | Browser console warning. | Cosmetic in dev. | Ignore for production or verify prod console. |
| R-009 | LOW | Testing | Tests cover helpers/payment gate, not live wallet. | 12 Vitest tests only. | Integration regressions possible. | Add Playwright/E2E with mocks and manual live demo script. |
| R-010 | NICE-TO-HAVE | Product | No durable proof permalink. | Success-only result. | Less shareable. | Add `/proof/[id]` backed by storage. |
