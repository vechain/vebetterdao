import { ChallengeKind, ChallengeStatus, ChallengeType, ChallengeVisibility, SettlementMode } from "./types"
import { RawChallenge } from "./useAllChallenges"

export interface CountByKey<K extends number> {
  byKey: Map<K, number>
  total: number
}

export interface ChallengesAggregate {
  total: number
  byStatus: Map<ChallengeStatus, number>
  byKind: Map<ChallengeKind, number>
  byType: Map<ChallengeType, number>
  byVisibility: Map<ChallengeVisibility, number>
  bySettlement: Map<SettlementMode, number>
  totalPrizeByStatus: Map<ChallengeStatus, bigint>
  totalPrize: bigint
  sumParticipants: number
  sumInvited: number
  sumDeclined: number
  topCreators: { address: string; count: number }[]
  rounds: number[]
}

const inc = <K>(map: Map<K, number>, key: K) => map.set(key, (map.get(key) ?? 0) + 1)
const addBig = <K>(map: Map<K, bigint>, key: K, delta: bigint) => map.set(key, (map.get(key) ?? 0n) + delta)

/**
 * Pure aggregator — mirrors the reduce loop in
 * `packages/contracts/scripts/data/getChallengesStats.ts`. Filtering by round
 * is applied here (not at fetch time) so the same in-memory dataset can drive
 * both the per-round view and the all-rounds view without re-fetching.
 */
export const aggregateChallenges = (
  challenges: RawChallenge[],
  filter?: { activeInRound?: number },
): ChallengesAggregate => {
  // "Active in round R" = the challenge's [startRound, endRound] window contains R.
  // This matches the natural mental model of the round selector ("what was running
  // during round R") rather than only matching challenges that happen to end on R.
  const filtered =
    filter?.activeInRound !== undefined
      ? challenges.filter(c => c.startRound <= filter.activeInRound! && c.endRound >= filter.activeInRound!)
      : challenges

  const byStatus = new Map<ChallengeStatus, number>()
  const byKind = new Map<ChallengeKind, number>()
  const byType = new Map<ChallengeType, number>()
  const byVisibility = new Map<ChallengeVisibility, number>()
  const bySettlement = new Map<SettlementMode, number>()
  const totalPrizeByStatus = new Map<ChallengeStatus, bigint>()
  const creatorCounts = new Map<string, number>()

  let sumParticipants = 0
  let sumInvited = 0
  let sumDeclined = 0
  let totalPrize = 0n

  for (const c of filtered) {
    inc(byStatus, c.status)
    inc(byKind, c.kind)
    inc(byType, c.challengeType)
    inc(byVisibility, c.visibility)
    inc(bySettlement, c.settlementMode)
    addBig(totalPrizeByStatus, c.status, c.totalPrize)

    sumParticipants += c.participantCount
    sumInvited += c.invitedCount
    sumDeclined += c.declinedCount
    totalPrize += c.totalPrize

    const addr = c.creator.toLowerCase()
    creatorCounts.set(addr, (creatorCounts.get(addr) ?? 0) + 1)
  }

  const topCreators = [...creatorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([address, count]) => ({ address, count }))

  // Rounds list always reflects the unfiltered dataset so the round selector
  // shows every round that has ever had a challenge.
  const rounds = [...new Set(challenges.map(c => c.endRound))].sort((a, b) => b - a)

  return {
    total: filtered.length,
    byStatus,
    byKind,
    byType,
    byVisibility,
    bySettlement,
    totalPrizeByStatus,
    totalPrize,
    sumParticipants,
    sumInvited,
    sumDeclined,
    topCreators,
    rounds,
  }
}
