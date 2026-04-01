# Challenges Test Matrix

Derived from [spec.md](spec.md). Each scenario is classified by risk and primary verification layer.

**Layer legend:**
- `contract` — Hardhat unit test (deterministic, fast)
- `playwright` — browser e2e against local chain + frontend

## Lifecycle

| # | Scenario | Layer | Risk | Preconditions | Expected outcome | Covered |
|---|----------|-------|------|---------------|------------------|---------|
| L1 | Create public challenge | contract | high | round 1 active, creator has B3TR | challenge created, creator auto-joined, B3TR escrowed | yes |
| L2 | Create sponsored challenge | contract | high | round 1 active, creator has B3TR | challenge created, creator NOT joined, prize escrowed | yes |
| L3 | Create private challenge with invitees | contract | medium | round 1 active | invitees set, non-invited cannot join | partial |
| L4 | Reject startRound <= currentRound | contract | medium | round 2 active | revert InvalidStartRound | yes |
| L5 | Reject endRound < startRound | contract | medium | round 1 active | revert InvalidEndRound | yes |
| L6 | Reject > 5 selected apps | contract | low | round 1 active | revert MaxSelectedAppsExceeded | yes |
| L7 | Empty appIds treated as all apps | contract | medium | round 1 active | challenge.allApps == true | yes |
| L8 | Join challenge (non-creator) | contract | high | pending challenge exists | participantCount increases, B3TR escrowed | yes |
| L9 | Join after declining (private) | contract | medium | invitee declined | invitee re-joins successfully | yes |
| L10 | Reject join when participant cap reached | contract | medium | cap reached | revert MaxParticipantsExceeded | yes |
| L11 | Creator counts toward cap | contract | medium | cap - 1 others joined | next join reverts | yes |
| L12 | Leave challenge before start | contract | medium | user joined, challenge pending | user removed, stake refunded | implicit |
| L13 | Cancel challenge (creator) | contract | high | challenge pending | status Cancelled, refunds available | yes |
| L14 | Add invites while pending | contract | low | challenge pending, private | new invitees added | implicit |
| L15 | Reject actions after challenge starts | contract | medium | challenge active | revert on cancel/addInvites | implicit |

## Settlement & Payout

| # | Scenario | Layer | Risk | Preconditions | Expected outcome | Covered |
|---|----------|-------|------|---------------|------------------|---------|
| S1 | Batch finalization with tied winners | contract | high | 3 participants, 2 tied at top | TopWinners, prize split evenly, remainder to last | yes |
| S2 | Threshold split (SplitAboveThreshold) | contract | high | sponsored, threshold set, some qualify | QualifiedSplit, prize split among qualified | partial |
| S3 | Nobody meets threshold (sponsored) | contract | high | all below threshold | CreatorRefund, sponsor gets prize back | yes |
| S4 | TopAboveThreshold with one qualifier | contract | medium | one above threshold | TopWinners, winner takes all | yes |
| S5 | Invalid challenge (< 2 participants) | contract | high | only creator joined at endRound | Invalid status, creator refund | yes |
| S6 | Invalid sponsored challenge (0 participants) | contract | medium | no joins at endRound | Invalid status, sponsor refund | implicit |
| S7 | Claim payout (winner) | contract | high | challenge finalized | B3TR transferred to winner | yes |
| S8 | Claim refund (cancelled) | contract | high | challenge cancelled | each participant gets stake back | yes |
| S9 | Double claim prevention | contract | high | already claimed | revert NothingToClaim | yes |

## Frontend Integration (Playwright candidates)

| # | Scenario | Layer | Risk | Preconditions | Expected outcome |
|---|----------|-------|------|---------------|------------------|
| E1 | Create challenge via modal | playwright | high | wallet connected, has B3TR | modal opens, form submits, challenge appears in list, detail page shows correct data |
| E2 | Join public challenge and verify detail | playwright | high | public challenge exists | Join CTA visible, after join: participant count updated, "Participating" badge shown |
| E3 | Private invite flow: accept or decline | playwright | medium | private challenge, viewer invited | invitation banner visible, accept/decline CTAs work, status updates |
| E4 | Cancel challenge and claim refund | playwright | medium | viewer is creator, challenge pending | Cancel CTA works, status becomes Cancelled, Claim refund CTA appears and works |
| E5 | View finalized challenge outcome | playwright | medium | finalized challenge exists | detail page shows winner, payout info, Claim payout CTA if winner |

## Running e2e tests

Run a single spec (recommended during iteration):

```bash
yarn workspace @repo/e2e e2e -- tests/challenges/hub.spec.ts
```

Run all challenges specs:

```bash
yarn workspace @repo/e2e e2e -- tests/challenges/
```

Skip web server startup if already running:

```bash
B3TR_E2E_SKIP_WEB_SERVER=true yarn workspace @repo/e2e e2e -- tests/challenges/hub.spec.ts
```

Headless mode (CI):

```bash
yarn workspace @repo/e2e e2e:headless -- tests/challenges/
```

## Not in scope for first iteration

- Lambda finalization flow (tested in lambda unit tests)
- Multi-round time progression in browser (requires chain manipulation)
- Sponsored threshold configuration edge cases (covered in contract tests)
- VeBetterPassport V5 round-tracking counters (covered in dedicated contract tests)
