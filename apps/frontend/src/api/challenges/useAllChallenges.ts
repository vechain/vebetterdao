import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"

import { ChallengeKind, ChallengeStatus, ChallengeType, ChallengeVisibility, SettlementMode } from "./types"

const abi = B3TRChallenges__factory.abi
const CHUNK_SIZE = 25

/**
 * Raw on-chain shape returned by `getChallenge`. Kept as `bigint` for token amounts
 * so aggregation can sum without precision loss; the dashboard formats with `formatEther`
 * only at render time.
 */
export interface RawChallenge {
  challengeId: number
  kind: ChallengeKind
  visibility: ChallengeVisibility
  challengeType: ChallengeType
  status: ChallengeStatus
  settlementMode: SettlementMode
  creator: string
  stakeAmount: bigint
  startRound: number
  endRound: number
  totalPrize: bigint
  participantCount: number
  invitedCount: number
  declinedCount: number
  winnersCount: number
  numWinners: number
  bestScore: bigint
  payoutsClaimed: number
}

interface RawTuple {
  challengeId: bigint
  kind: number
  visibility: number
  challengeType: number
  status: number
  settlementMode: number
  creator: string
  stakeAmount: bigint
  startRound: bigint
  endRound: bigint
  totalPrize: bigint
  participantCount: bigint
  invitedCount: bigint
  declinedCount: bigint
  winnersCount: bigint
  numWinners: bigint
  bestScore: bigint
  payoutsClaimed: bigint
}

/**
 * Reads every challenge on-chain via batched multicall. Mirrors the canonical
 * `packages/contracts/scripts/data/getChallengesStats.ts` so the admin dashboard
 * matches that script byte-for-byte. Includes private challenges (unlike the
 * public indexer endpoint) — we want ground truth here.
 */
export const useAllChallenges = () => {
  const thor = useThor()
  const address = getConfig().challengesContractAddress as `0x${string}`

  return useQuery({
    queryKey: ["challenges", "admin", "all", address],
    enabled: !!thor,
    staleTime: 60_000,
    queryFn: async (): Promise<RawChallenge[]> => {
      const [countResult] = (await executeMultipleClausesCall({
        thor: thor!,
        calls: [{ abi, address, functionName: "challengeCount", args: [] as const }],
      })) as [bigint]

      const total = Number(countResult)
      if (total === 0) return []

      const ids = Array.from({ length: total }, (_, i) => i + 1)
      const out: RawChallenge[] = []

      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const slice = ids.slice(i, i + CHUNK_SIZE)
        const calls = slice.map(id => ({
          abi,
          address,
          functionName: "getChallenge" as const,
          args: [BigInt(id)] as const,
        }))
        const results = (await executeMultipleClausesCall({ thor: thor!, calls })) as RawTuple[]

        for (const r of results) {
          out.push({
            challengeId: Number(r.challengeId),
            kind: Number(r.kind) as ChallengeKind,
            visibility: Number(r.visibility) as ChallengeVisibility,
            challengeType: Number(r.challengeType) as ChallengeType,
            status: Number(r.status) as ChallengeStatus,
            settlementMode: Number(r.settlementMode) as SettlementMode,
            creator: r.creator,
            stakeAmount: r.stakeAmount,
            startRound: Number(r.startRound),
            endRound: Number(r.endRound),
            totalPrize: r.totalPrize,
            participantCount: Number(r.participantCount),
            invitedCount: Number(r.invitedCount),
            declinedCount: Number(r.declinedCount),
            winnersCount: Number(r.winnersCount),
            numWinners: Number(r.numWinners),
            bestScore: r.bestScore,
            payoutsClaimed: Number(r.payoutsClaimed),
          })
        }
      }

      return out
    },
  })
}
