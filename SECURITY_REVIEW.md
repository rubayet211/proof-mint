# Security Review

## x402 Status

```text
REAL BUT FRAGILE
```

The mocked client payment path has been replaced with x402 v2 exact Hedera payment construction and server verification/settlement. It is still classified as fragile because live wallet/facilitator settlement was not verified here and because recovery/idempotency are demo-grade.

## Hedera Status

```text
MOSTLY COMPLETE
```

Agent Kit v4 is used for HCS and HTS execution. HCS proof messages include payment and digest data. HTS mints a configured fungible proof token.

## Wallet Status

```text
WORKING MVP
```

WalletConnect setup is real and testnet-only. No private key is requested in the browser. Live connection still requires a WalletConnect project ID and compatible Hedera wallet.

## Issues

| ID | Severity | Issue | Evidence | Impact | Recommended Fix |
| --- | --- | --- | --- | --- | --- |
| S-001 | HIGH | Live payment/on-chain flow not verified. | No funded env in this audit. | Unknown runtime failures could remain. | Run live demo and keep tx links. |
| S-002 | HIGH | In-memory idempotency. | `src/lib/idempotency.ts`. | Duplicate mints after restart/multiple instances. | Use durable KV/database with unique key. |
| S-003 | MEDIUM | Paid-but-Hedera-failed recovery is weak. | Settlement happens before HCS/HTS. | User may pay and see failure. | Persist settlement and retry agent execution. |
| S-004 | MEDIUM | No rate limiting. | API route has no limiter. | Abuse can drain operator testnet funds. | Add IP/account/request rate limits. |
| S-005 | MEDIUM | User-generated proof text appears in UI. | Proof title/description rendered. | React escapes by default, but long content can hurt UX. | Keep length limits; add E2E overflow tests. |
| S-006 | LOW | Testnet operator private key must be protected. | `.env.example` documents server key. | Misconfigured `NEXT_PUBLIC_` secret would expose funds. | Keep exact env names and deployment checks. |

## Safety Positives

- No frontend private key handling.
- Testnet is enforced in Hedera helpers.
- Fixed visible payment amount.
- Payment requirements include payee, amount, asset, fee payer, and proof digest.
- API does not execute Hedera actions before verified payment.
- Generic 500 response avoids leaking raw server errors to users.
