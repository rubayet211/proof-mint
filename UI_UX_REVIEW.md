# UI/UX Review

## Scores

```text
Visual Polish: 8/10
UX Clarity: 8/10
Mobile Responsiveness: 8/10
Accessibility: 7/10
Judge Demo Impact: 8/10
```

## Findings

- First impression is clear: “Pay once. Mint permanent proof.”
- The form, price, wallet gate, and success flow are direct enough for a judge to understand quickly.
- Demo presets now populate the form instead of showing placeholder alerts.
- Payment CTA clearly says `Pay 0.25 USDC & Mint Proof`.
- Mobile overflow in the wallet error state was found and fixed.
- Local browser smoke showed no console errors; one dev-only Lit warning remains from wallet internals.

## Strengths

1. Clear product promise.
2. Good visual hierarchy between hero, form, and process sidebar.
3. Disabled state makes wallet requirement obvious.
4. Icons improve scanability.
5. Success view/HashScan strategy is judge-friendly.

## Weaknesses

1. Missing WalletConnect env state is now compact but still technical.
2. Payment amount text is hardcoded in a few UI strings instead of fully env-driven.
3. No execution stepper for payment verified, settled, HCS submitted, HTS minted.
4. Accessibility is decent, but no full keyboard/passive screen reader audit was run.

## Must-Fix UI Issues Before Submission

1. Configure WalletConnect so judges see a real connect button, not missing-env text.
2. Record a live success screen with real HashScan links.
3. Replace README placeholders and any placeholder URLs visible in app/docs.

## Nice-To-Have Polish

1. Add live stepper during mint.
2. Add proof permalink/share page.
3. Make price display read from public config to avoid drift.
