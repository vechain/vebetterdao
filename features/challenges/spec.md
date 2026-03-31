---
name: B3TR Challenges
overview: Challenges feature implemented with the upgradeable `B3TRChallenges` contract, `VeBetterPassport` V5 upgrade for per-round counters, scheduled `finalizeChallenges` lambda, and `Challenges` frontend connected directly on-chain via `useQuery`, event logs, and wallet transactions.
todos:
  - id: design-contract-shape
    content: Defined the `B3TRChallenges` API with ERC-7201 storage, enums/statuses, events, and read models
    status: completed
  - id: implement-challenge-logic
    content: Implemented create/join/leave/decline/addInvites/cancel with B3TR escrow for `Stake` and `Sponsored`
    status: completed
  - id: implement-batched-settlement
    content: Implemented `syncChallenge`, `finalizeChallengeBatch`, pull-based payout claims, and refunds
    status: completed
  - id: wire-deployment-config
    content: Integrated deploy wiring, fixtures, config, and admin contract list for `B3TRChallenges`
    status: completed
  - id: add-tests-and-ci
    content: Added contract tests, Passport V5 round tracking, and CI shard `shard9a` for `B3TRChallenges`
    status: completed
  - id: add-frontend-challenges
    content: Added the `Challenges` frontend section with routes/tabs, detail page, invitation banner, and real action flows
    status: completed
  - id: add-finalize-challenges-lambda
    content: Added the scheduled `finalizeChallenges` lambda with terraform, scheduler, and deploy workflow
    status: completed
isProject: false
---

# B3TR Challenges

## Implemented Scope

- New upgradeable contract `B3TRChallenges.sol` with `ChallengeCoreLogic`, `ChallengeSettlementLogic`, `ChallengeStorageTypes`, `ChallengeTypes` libraries and `IChallenges` interface.
- `VeBetterPassport` upgraded to V5 with new per-round counters used by challenge finalization.
- New `Challenges` frontend section with dedicated routes, tabs, list/detail pages, invitation banner, create flow, and user actions.
- New scheduled `finalizeChallenges` lambda with terraform and dedicated deploy workflow.

## Contracts

- The implemented types are `Stake` and `Sponsored`:
  - `Stake`: the creator deposits the initial stake, is automatically added to participants, and each join increases `totalPrize`.
  - `Sponsored`: the creator funds the prize but does not participate.
- The implemented visibilities are `Public` and `Private`.
- The implemented statuses are `Pending`, `Active`, `Finalizing`, `Finalized`, `Cancelled`, `Invalid`.
- The implemented threshold modes are `None`, `SplitAboveThreshold`, `TopAboveThreshold`.
- Applied configuration:
  - `startRound` must be > the current round; `0` means next round.
  - maximum challenge duration: `4` rounds.
  - maximum selectable apps: `5`.
  - maximum participants: `100` total.
  - in `Stake`, the creator counts toward the cap, so only `99` additional participants can join.
  - `appIds = []` means `all apps`.
  - private challenges can only be joined by `invitationEligible` wallets.
  - the creator can only add invites and cancel while the challenge is `Pending`.
- Exposed APIs/read models:
  - `getChallenge`
  - `getChallengeStatus`
  - `getChallengeParticipants`
  - `getChallengeInvited`
  - `getChallengeDeclined`
  - `getChallengeSelectedApps`
  - `getParticipantStatus`
  - `isInvitationEligible`
  - `getParticipantActions`
- Implemented lifecycle/actions:
  - `createChallenge`
  - `addInvites`
  - `joinChallenge`
  - `leaveChallenge`
  - `declineChallenge`
  - `cancelChallenge`
  - `syncChallenge`
- An invitee can decline and later re-enter via `joinChallenge` until the challenge starts.
- Emitted events:
  - `ChallengeCreated`
  - `ChallengeInviteAdded`
  - `ChallengeJoined`
  - `ChallengeLeft`
  - `ChallengeDeclined`
  - `ChallengeCancelled`
  - `ChallengeActivated`
  - `ChallengeInvalidated`
  - `ChallengeFinalizationAdvanced`
  - `ChallengeFinalized`
  - `ChallengePayoutClaimed`
  - `ChallengeRefundClaimed`
- Effective validity rule:
  - `Stake` requires at least `2` total participants, including the creator.
  - `Sponsored` requires at least `1` participant.

## Settlement and Payout

- Finalization is permissionless and batch-based via `finalizeChallengeBatch(challengeId, batchSize)`.
- The on-chain cursor used is `nextFinalizeIndex`; status moves `Active -> Finalizing -> Finalized`.
- Actions are read from `VeBetterPassport`:
  - `userRoundActionCount()` when the challenge covers all apps.
  - `userRoundActionCountApp()` when the challenge has a list of apps.
- Implemented settlement modes:
  - `TopWinners` for challenges without a threshold or `TopAboveThreshold` with at least one qualified participant.
  - `QualifiedSplit` for `SplitAboveThreshold` with at least one qualified participant.
  - `CreatorRefund` when nobody qualifies in a threshold-based `Sponsored` challenge.
- Payouts and refunds are pull-based:
  - `claimChallengePayout`
  - `claimChallengeRefund`
- Effective refunds:
  - cancelled or invalid `Stake` challenge: refund the stake to each `Joined` participant.
  - cancelled or invalid `Sponsored` challenge: refund the prize to the creator.
- Payout calculation assigns any remainder to the last claim, so `totalPrize` is fully distributed with no leftovers.

## VeBetterPassport V5

- The feature required a `VeBetterPassport` V4 -> V5 upgrade, not just challenge-side wiring.
- Added and tested per-round counters:
  - `userRoundActionCount`
  - `userRoundActionCountApp`
  - `userRoundAppCount`
  - `appRoundActionCount`
  - `registerActionForRound`
- Added:
  - deprecated V4 contract for upgrade tests
  - script `vebetter-passport-v5.ts`
  - dedicated tests `round-tracking.test.ts`
  - updates to upgrade tests and Passport libraries

## Frontend

- The `Challenges` section was added to the navbar, footer, metadata, and admin contracts view.
- Implemented routes:
  - `/challenges` with redirect to `/challenges/all`
  - `/challenges/all`
  - `/challenges/mine`
  - `/challenges/invited`
  - `/challenges/public`
  - `/challenges/[challengeId]`
- The frontend does not use static mocks: it reads live on-chain data with `useQuery`, `useThor`, multicall, and filters on `ChallengeCreated`, `ChallengePayoutClaimed`, and `ChallengeRefundClaimed` events.
- Implemented queries/hooks:
  - `useChallenges`
  - `useChallenge`
  - `useChallengeActions`
  - `useChallengeParticipantActions`
- Implemented UX:
  - create stake challenge
  - create sponsored challenge
  - public/private visibility
  - selection of up to `5` apps or `all apps`
  - participant counters show the current count against the challenge cap
  - threshold configuration for sponsored challenges
  - accept/join, leave, decline, cancel, add invites, claim payout, claim refund, finalize
  - pending invitations banner
  - detail page with status badge, wallet list, selected apps, invited wallets, and actions leaderboard
- CTA state is derived client-side from challenge status, viewer status, invitation eligibility, whether claim/refund was already executed, and available B3TR balance.
- There is no dependency on an external indexer in this repo: lists and details are reconstructed from logs + on-chain calls.

## Lambda and Infra

- Added the lambda `packages/lambda/src/finalizeChallenges/lambda.ts`.
- The lambda:
  - reads the current round from `XAllocationVoting`
  - looks for challenges with `endRound == currentRound - 1` by filtering `ChallengeCreated`
  - finalizes in a retry loop until `Finalized` or until the `MAX_BATCHES_PER_CHALLENGE` cap is reached
  - skips `Cancelled`, `Invalid`, or already `Finalized` challenges
  - uses the existing distributor wallet
  - supports custom `dryRun` and `batchSize`
  - sends Slack notifications for successes and partial failures
- Added infra:
  - dedicated terraform under `terraform/finalize-challenges`
  - scheduler EventBridge
  - workflow `.github/workflows/finalize-challenges-lambda-deploy.yml`
- Configured scheduling:
  - dev/testnet: 10 minutes after `start-emissions-round`
  - prod/mainnet: 10 minutes after `start-emissions-round`
- If `challengesContractAddress` is `0x0`, the lambda exits in skip mode without breaking the flow.

## Repo Integration

- Deploy and fixtures aligned in `deployAll.ts` and `test/helpers/deploy.ts`.
- Added `challengesContractAddress` in `@repo/config` and in the local config generator.
- Added deployment check and contract visibility in the admin section.
- Remote addresses in `testnet`, `testnet-staging`, and `mainnet` remain `0x0` until the actual deployment is performed; local wiring is already present.

## Verification

- Contract tests added in `packages/contracts/test/challenges/B3TRChallenges.test.ts` for:
  - create / join / leave / decline / cancel
  - start/end round validation
  - `max 5 apps` limit and `appIds = []` as `all apps`
  - participant cap enforcement for `Sponsored` and `Stake`
  - invalid challenge and refunds
  - batch settlement
  - tie split
  - threshold-based sponsored challenges on `all apps` and `selected apps`
- Passport round-tracking tests added in `packages/contracts/test/vebetterpassport/round-tracking.test.ts`.
- New CI shard `shard9a` registered in `.github/workflows/unit-tests.yml` and `packages/contracts/test/README.md`.
- Lambda tests added in `packages/lambda/test/finalizeChallenges.test.ts` for config skip, no-ended-round case, and basic dry-run.
- In this branch, no dedicated CI step was added for lambda tests in the main unit-test workflow.
