import { getConfig } from "@repo/config"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { useCallback, useMemo, useState } from "react"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

import { guestViewerReads, RawChallengeView, toChallengeView } from "./buildChallengeView"
import { selectEndedChallenges } from "./endedChallenges"
import { fetchMaxParticipants } from "./fetchMaxParticipants"
import { ChallengeStatus, ChallengeView, ChallengeVisibility, PaginatedChallengeSection } from "./types"
import { CHALLENGES_PAGE_SIZE } from "./useChallengeSections"

const abi = B3TRChallenges__factory.abi

/** Challenges per multicall batch — each one costs 2 clauses (`getChallenge` + `getChallengeStatus`). */
const CHUNK_SIZE = 25

export const getEndedChallengesQueryKey = (contractAddress: string) =>
  ["challenges", "ended", contractAddress.toLowerCase()] as const

/**
 * Ended quests of one visibility, read straight from the contract. Public quests and private
 * duels get their own row, so each call passes the `visibility` it renders; omitting it returns
 * both. Every call shares one cached query — the visibility split happens client-side.
 *
 * The indexer's wallet-scoped History filter only returns quests the viewer was involved in, so a
 * quest that ran without them was visible nowhere once it left the live carousels. There are ~100
 * quests in total, so a batched scan of `challengeCount` ids is cheap: one `challengeCount` call
 * plus `ceil(count / CHUNK_SIZE)` parallel multicalls, cached for a minute and paginated
 * client-side. The contract scan is also what makes private quests reachable — the indexer's
 * public `GET /b3tr/challenges` endpoint only ever returns public ones.
 *
 * Cards render read-only (no viewer reads, no claim-event scan): the viewer's own past quests,
 * including anything still claimable, stay in the wallet-scoped History tab.
 */
export const useEndedChallenges = (visibility?: ChallengeVisibility): PaginatedChallengeSection => {
  const thor = useThor()
  const queryClient = useQueryClient()
  const contractAddress = getConfig().challengesContractAddress
  const { data: currentRoundRaw } = useCurrentAllocationsRoundId()
  const currentRound = currentRoundRaw !== undefined ? Number(currentRoundRaw) : undefined
  const [page, setPage] = useState(0)

  const query = useQuery({
    queryKey: getEndedChallengesQueryKey(contractAddress),
    enabled: !!thor && currentRound !== undefined,
    staleTime: 60_000,
    queryFn: async (): Promise<ChallengeView[]> => {
      const address = contractAddress as `0x${string}`

      const [countRaw] = (await executeMultipleClausesCall({
        thor: thor!,
        calls: [{ abi, address, functionName: "challengeCount", args: [] as const }],
      })) as [bigint]

      const total = Number(countRaw ?? 0n)
      if (total === 0) return []

      const maxParticipants = await fetchMaxParticipants(thor!, contractAddress, queryClient)

      const chunks: number[][] = []
      for (let start = 1; start <= total; start += CHUNK_SIZE) {
        chunks.push(Array.from({ length: Math.min(CHUNK_SIZE, total - start + 1) }, (_, i) => start + i))
      }

      const chunkResults = await Promise.all(
        chunks.map(
          ids =>
            executeMultipleClausesCall({
              thor: thor!,
              calls: ids.flatMap(id => {
                const idBig = BigInt(id)
                return [
                  { abi, address, functionName: "getChallenge" as const, args: [idBig] as const },
                  { abi, address, functionName: "getChallengeStatus" as const, args: [idBig] as const },
                ]
              }),
            }) as Promise<unknown[]>,
        ),
      )

      return chunkResults.flatMap(results =>
        Array.from({ length: results.length / 2 }, (_, i) =>
          toChallengeView({
            raw: results[i * 2] as RawChallengeView,
            status: Number(results[i * 2 + 1] as number | bigint) as ChallengeStatus,
            // `createdAt` only exists on the `ChallengeCreated` event; cards don't render it and
            // the detail page reads it itself.
            createdAt: 0,
            currentRound: currentRound!,
            maxParticipants,
            claimed: null,
            viewerReads: guestViewerReads,
          }),
        ),
      )
    },
  })

  // Re-filtered against the live round rather than the round at fetch time, so a quest whose
  // window closes mid-cache still lands here.
  const ended = useMemo(
    () => (currentRound === undefined ? [] : selectEndedChallenges(query.data ?? [], currentRound, visibility)),
    [query.data, currentRound, visibility],
  )

  const items = useMemo(() => ended.slice(0, (page + 1) * CHALLENGES_PAGE_SIZE), [ended, page])

  const fetchNextPage = useCallback(async () => setPage(current => current + 1), [])

  return {
    items,
    // Covers the window where the query is still disabled waiting on the current round.
    isLoading: !query.isError && query.data === undefined,
    isFetchingNextPage: false,
    hasNextPage: items.length < ended.length,
    fetchNextPage,
  }
}
