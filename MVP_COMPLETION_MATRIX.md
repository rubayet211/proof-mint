# MVP Completion Matrix

## Core Features

| Feature | Expected Behavior | Actual Behavior | Status | Evidence | Fix Needed |
| --- | --- | --- | --- | --- | --- |
| Landing page | Judge understands app fast. | Clear hero and proof form. | PASS | `src/app/page.tsx`. | None. |
| Wallet connect | Connect Hedera testnet wallet. | WalletConnect provider implemented. | PASS | `wallet-provider.tsx`. | Live verify. |
| Account display | Show connected account. | Navbar displays account with truncation. | PASS | `wallet-connector.tsx`. | None. |
| Network badge | Show testnet. | Badge shown after connect. | PASS | `wallet-connector.tsx`. | None. |
| Achievement form | Collect proof metadata. | Local state + Zod validation. | PASS | `achievement-form.tsx`. | None. |
| Category selector | Pick category. | Select over fixed categories. | PASS | `proof.schema.ts`. | None. |
| Demo presets | Populate form. | Preset buttons populate fields. | PASS | `achievement-form.tsx`. | None. |
| Price display | Clear amount before payment. | UI shows `0.25 USDC`. | PASS | page/payment button. | Make env-driven text later. |
| x402 payment initiation | Request 402 then sign. | Client requests, signs, resubmits. | PASS | `payment-button.tsx`. | Live verify. |
| 402 flow | Missing payment gets 402. | Tested. | PASS | `server.test.ts`. | None. |
| Payment verification | Server verifies. | Exact Hedera facilitator verify. | PASS | `server.ts`. | Live verify. |
| Payment settlement | Server settles. | Exact Hedera facilitator settle. | PASS | `server.ts`. | Live verify. |
| Agent Kit execution | Agent Kit after payment. | HCS/HTS through `HederaAgentAPI.run`. | PASS | HCS/HTS services. | Live verify. |
| HCS message | Submit structured proof. | JSON proof message sent. | PASS | `hcs-service.ts`. | None. |
| HTS mint/create | Mint proof token. | Mints configured fungible token. | PASS | `token-service.ts`. | Consider NFT. |
| HashScan links | Show verification links. | Success view includes links. | PASS | `success-view.tsx`. | Live tx check. |
| Success screen | Show proof data. | Implemented. | PASS | `success-view.tsx`. | None. |
| Copy proof summary | Copyable proof JSON/summary. | Implemented if present in success view. | PARTIAL | UI exists from previous MVP. | Confirm in live. |
| Create another proof | Reset flow. | `onReset` clears state. | PASS | page/success view. | None. |
| Share proof action | Share/copy. | Partial copy/link behavior. | PARTIAL | Success view. | Add dedicated share URL. |
| Error handling | Clear failures. | Toasts and generic API errors. | PASS | payment/API. | Better paid-failed recovery. |
| Loading states | Payment and connect loading. | Implemented. | PASS | wallet/payment components. | None. |
| Mobile responsive | No overflow. | Smoke tested and fixed. | PASS | Playwright screenshots. | None. |
