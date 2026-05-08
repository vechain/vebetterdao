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

/**
 * Positional layout of the `ChallengeView` struct returned by `getChallenge`.
 * `executeMultipleClausesCall` from `vechain-kit` returns `result.plain` from the
 * VeChain SDK, which for struct returns is **not guaranteed to expose named keys**
 * — accessing `r.startRound` may yield `undefined` depending on ABI/decoder. We
 * read by index to be robust. Order MUST match `ChallengeTypes.ChallengeView` in
 * `packages/contracts/contracts/challenges/libraries/ChallengeTypes.sol`.
 */
const IDX = {
  challengeId: 0,
  kind: 1,
  visibility: 2,
  challengeType: 3,
  status: 4,
  settlementMode: 5,
  creator: 6,
  stakeAmount: 7,
  startRound: 8,
  endRound: 9,
  duration: 10,
  threshold: 11,
  numWinners: 12,
  winnersClaimed: 13,
  prizePerWinner: 14,
  allApps: 15,
  totalPrize: 16,
  participantCount: 17,
  invitedCount: 18,
  declinedCount: 19,
  selectedAppsCount: 20,
  winnersCount: 21,
  bestScore: 22,
  bestCount: 23,
  payoutsClaimed: 24,
} as const

// Read either by named key (if SDK exposes them) or by positional index — whichever
// is defined. Casts via `unknown` because the runtime shape is not statically known.
const pick = <T>(r: unknown, key: keyof typeof IDX): T => {
  const obj = r as Record<string, unknown>
  const named = obj[key]
  if (named !== undefined) return named as T
  return (obj[IDX[key]] as T) ?? (Array.isArray(r) ? (r[IDX[key]] as T) : (undefined as T))
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
      let didDebugLog = false

      for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
        const slice = ids.slice(i, i + CHUNK_SIZE)
        const calls = slice.map(id => ({
          abi,
          address,
          functionName: "getChallenge" as const,
          args: [BigInt(id)] as const,
        }))
        const results = (await executeMultipleClausesCall({ thor: thor!, calls })) as unknown[]

        if (!didDebugLog && results[0] !== undefined) {
          // eslint-disable-next-line no-console
          console.log("[admin/quests] first raw getChallenge result:", results[0])
          didDebugLog = true
        }

        for (const r of results) {
          out.push({
            challengeId: Number(pick<bigint>(r, "challengeId")),
            kind: Number(pick<bigint | number>(r, "kind")) as ChallengeKind,
            visibility: Number(pick<bigint | number>(r, "visibility")) as ChallengeVisibility,
            challengeType: Number(pick<bigint | number>(r, "challengeType")) as ChallengeType,
            status: Number(pick<bigint | number>(r, "status")) as ChallengeStatus,
            settlementMode: Number(pick<bigint | number>(r, "settlementMode")) as SettlementMode,
            creator: pick<string>(r, "creator"),
            stakeAmount: pick<bigint>(r, "stakeAmount"),
            startRound: Number(pick<bigint>(r, "startRound")),
            endRound: Number(pick<bigint>(r, "endRound")),
            totalPrize: pick<bigint>(r, "totalPrize"),
            participantCount: Number(pick<bigint>(r, "participantCount")),
            invitedCount: Number(pick<bigint>(r, "invitedCount")),
            declinedCount: Number(pick<bigint>(r, "declinedCount")),
            winnersCount: Number(pick<bigint>(r, "winnersCount")),
            numWinners: Number(pick<bigint>(r, "numWinners")),
            bestScore: pick<bigint>(r, "bestScore"),
            payoutsClaimed: Number(pick<bigint>(r, "payoutsClaimed")),
          })
        }
      }

      return out
    },
  })
}
