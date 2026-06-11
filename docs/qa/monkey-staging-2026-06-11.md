# Monkey test — staging (testnet) — 2026-06-11

Persona-driven chaos test of `https://staging.testnet.governance.vebetterdao.org/`
(build `staging-v.3.37.2`). Authenticated as the e2e test wallet `wearetesters.vet`.

## Method

- **Browser**: headless Chromium (Playwright) under `xvfb` on a remote VM.
- **Login**: real VeWorld extension connection, automated by reusing the repo e2e
  harness (`packages/e2e`) + the throwaway test mnemonic. Only the VeWorld
  identification cert was completed (`wallet-connected`); no transactions were signed.
- **Iterations**: 70 cycles, rotating 7 personas (hurried mobile, confused newcomer,
  power user, double-clicker, accessibility, edge-case tinkerer, desktop explorer).
- **Guardrails**: never clicked destructive / state-changing / signing controls
  (vote, delegate, stake, claim, submit, convert, approve, sign, transfer, endorse,
  disconnect, …). 0 wallet-signing popups were triggered.
- A prior 70-cycle unauthenticated pass was also run.

## Findings (adversarially validated)

| # | Severity | Area | Symptom | Verdict |
|---|----------|------|---------|---------|
| 1 | Low | `/allocations` | React **#418** hydration mismatch (server/client text) on load (reproduced x2) | **Confirmed** (auth-independent) |
| 2 | Low–Med | App-wide | `Error fetching proposal IPFS metadata for ipfs://bafkrei…b3ep: Failed to fetch` logged on many pages | **Confirmed symptom; environmental root cause** |
| 3 | — | `/profile` reload → `/error` | "Authentication failed — Something went wrong while connecting your account" dead-end | **Unconfirmed — suspected test artifact** |
| 4 | — | App-wide | `Failed to fetch` to `testnet.vechain.org` (DBA estimate, avatar, `.vet` text records) | **Likely environmental** (public node flakiness) |
| 5 | — | `/leaderboard` | 404 | **False positive** (no index route; URL synthesized by the test) |
| 6 | Low | indexer | 404s for `…/navigators/<addr>` and `…/history?eventName=…` | Low / likely expected (no testnet data) |

### Notes

- **#1 (React #418)**: hydration text mismatch on `/allocations`. Real but cosmetic;
  worth a ticket. Independent of auth, reproduced twice.
- **#2 (IPFS)**: CID `bafkreib7mc7l4osqsc6gvt5wyusefccrais525saxv3vwnolwllowwp3ep`
  returns HTTP 500 on `ipfs.io` and `dweb.link` — the content is not retrievable from
  the IPFS network, not just the app gateway. Root cause is data/pinning, but the app
  spams console errors app-wide; it should degrade gracefully (fallback + no error
  spam) for unresolvable proposal metadata.
- **#3 (`/error`)**: `/profile` rendered fully before reload (balances, tabs). After
  reload it landed on the `next-auth` "Authentication failed" page and got stuck
  (only CTA: "Go back and retry"). Most likely because the automated login completed
  only the VeWorld cert, **not** the backend SIWE session (an extra signature the
  guardrails block), so reload's auth check failed. A fully-logged-in user persists the
  next-auth cookie and probably would not hit this. **Cannot confirm as a user-facing
  bug** without a full backend-auth session. UX heads-up regardless: the error page is a
  dead-end.
- **#4**: intermittent `Failed to fetch` against the public `testnet.vechain.org` node
  from the headless VM; not reproducible enough to attribute to app code.

## Blockers (need action)

- **Slack delivery**: cannot post to `#b3tr-lambda` from this cloud VM. Slack MCP needs
  interactive auth (desktop-only), there is no Slack token in env, and the lambda's
  `slack_app_token` lives in AWS Secrets Manager with no AWS creds present. To enable
  posting, add a Slack bot token as a Cloud Agent secret (or provide AWS creds).
- **Live browser view**: not possible — the browser runs headless on a remote VM with no
  display channel. Recordings/screenshots are provided instead.
