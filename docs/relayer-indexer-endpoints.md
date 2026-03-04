# Relayer Dashboard — Indexer Endpoints Specification

This document describes the API endpoints an indexer should expose to support the Relayer Dashboard and future relayer/auto-voting features. The dashboard currently uses a static JSON report produced by the analytics script; these endpoints would allow live data, per-relayer stats, and richer queries.

## Context

- **Contracts**: `XAllocationVoting`, `VoterRewards`, `RelayerRewardsPool`, `AutoVotingLogic` (library).
- **Events**: `AutoVotingToggled`, `AllocationAutoVoteCast`, `RelayerFeeTaken`.
- **Rounds**: Governed by `roundSnapshot(roundId)` and `roundDeadline(roundId)`.

## Recommended Endpoints

### Aggregates

| Method | Path | Description |
|--------|------|-------------|
| GET | `/auto-voting/stats` | Aggregate stats: total unique auto-voting users (ever or in a range), adoption curve, optional totals for relayers and rewards. |
| GET | `/rounds/:roundId/auto-voting` | Per-round auto-voting breakdown: auto-vote user count at snapshot, voted count, claimed count, expected/completed actions, relayer count, VTHO/rewards (aligned with script’s `RoundAnalytics`). |
| GET | `/rounds/:roundId/relayer-fees` | Per-round relayer fee/reward breakdown (e.g. from `RelayerFeeTaken` or `RelayerRewardsPool`). |

### Relayers

| Method | Path | Description |
|--------|------|-------------|
| GET | `/relayers` | List relayer addresses with optional filters (e.g. active in round range). Response: list of `{ address, roundsOperated?, totalRewardsClaimed?, totalVthoSpent? }`. |
| GET | `/relayers/:address` | Single relayer: rewards claimed (total and per round), VTHO spent (voting + claiming), rounds operated, claimable rewards (rounds where `RelayerRewardsPool.isRewardClaimable(roundId)` and relayer has share). |

### Events (optional)

For debugging or custom analytics:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/events/auto-voting-toggled` | `AutoVotingToggled` with filters: `roundId`, `blockFrom`, `blockTo`, `account`. |
| GET | `/events/allocation-auto-vote-cast` | `AllocationAutoVoteCast` with filters: `roundId`, `voter`, `blockFrom`, `blockTo`. |
| GET | `/events/relayer-fee-taken` | `RelayerFeeTaken` with filters: `cycle` (roundId), `voter`, relayer (tx sender), `blockFrom`, `blockTo`. |

## How to Achieve (High Level)

1. **Event ingestion**  
   Index `AutoVotingToggled`, `AllocationAutoVoteCast`, `RelayerFeeTaken` by block range and round boundaries (`roundSnapshot` / `roundDeadline`).

2. **Round boundaries**  
   Use `XAllocationVoting.roundSnapshot(roundId)` and `roundDeadline(roundId)` to define the block range for each round; all round-scoped queries should use these boundaries.

3. **Deduplication**  
   Auto-voting “users” and “voted” counts should be unique addresses (e.g. deduplicate by `account` / `voter` per round).

4. **Relayer identity**  
   Relayer = transaction sender for `AllocationAutoVoteCast` and for claims that emit `RelayerFeeTaken`. Aggregate per sender for “relayer stats”.

5. **Pagination**  
   List endpoints (`/relayers`, event lists) should support `limit`/`offset` or cursor-based pagination; event APIs often have a 1000-item limit per request.

6. **Claimable rewards**  
   For “claimable” state, either call `RelayerRewardsPool.isRewardClaimable(roundId)` when building the index or mirror the contract’s rule (e.g. round ended and distribution done).

## Dashboard Usage

- **Today**: Dashboard reads `report.json` (script output). No indexer required.
- **With indexer**:  
  - Replace report fetch with `GET /rounds/:roundId/auto-voting` (and optionally `/auto-voting/stats`) for the main table and stats.  
  - “My Relayer” tab: use `GET /relayers/:address` for total rewards claimed, total VTHO spent, and claimable rewards.

## Reference: Script Data Shape

The analytics script output (`RoundAnalytics`) includes:

- `roundId`, `autoVotingUsersCount`, `votedForCount`, `rewardsClaimedCount`
- `totalRelayerRewards`, `estimatedRelayerRewards`, `numRelayers`
- `vthoSpentOnVoting`, `vthoSpentOnClaiming`, `vthoSpentTotal`
- `expectedActions`, `completedActions`, `reducedUsersCount`, `missedUsersCount`, `allActionsOk`, `actionStatus`, `isRoundEnded`

Any indexer round endpoint should be able to serve equivalent fields so the dashboard can switch from static JSON to the indexer without changing the UI contract.
