import { getConfig } from "@repo/config"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useChallengesDeployBlock } from "@/hooks/useChallengesDeployBlock"

import { buildChallengeDetail } from "./buildChallengeDetail"
import { fetchMaxParticipants } from "./fetchMaxParticipants"

export const getChallengeDetailQueryKey = (challengeId: string, viewerAddress?: string) =>
  ["challenges", "detail", challengeId, viewerAddress ?? "guest"] as const

interface UseChallengeDetailOptions {
  pollWhileMissing?: boolean
}

/**
 * Fetches a challenge detail directly from on-chain state (contract multicall
 * + claim event scans). Kept event-based — the indexer `/b3tr/challenges/{id}`
 * endpoint exists but freshness after a tx is not guaranteed.
 */
export const useChallengeDetail = (
  challengeId: string,
  viewerAddress?: string,
  options?: UseChallengeDetailOptions,
) => {
  const { pollWhileMissing = false } = options ?? {}
  const parsedChallengeId = Number(challengeId)
  const isValidChallengeId = Number.isInteger(parsedChallengeId) && parsedChallengeId > 0

  const thor = useThor()
  const queryClient = useQueryClient()
  const fromBlock = useChallengesDeployBlock()
  const { data: currentRoundRaw } = useCurrentAllocationsRoundId()
  const contractAddress = getConfig().challengesContractAddress
  const currentRound = currentRoundRaw !== undefined ? Number(currentRoundRaw) : undefined

  const enabled = !!thor && currentRound !== undefined && isValidChallengeId

  const query = useQuery({
    queryKey: getChallengeDetailQueryKey(challengeId, viewerAddress),
    queryFn: async () => {
      const maxParticipants = await fetchMaxParticipants(thor!, contractAddress, queryClient)
      return buildChallengeDetail({
        thor: thor!,
        queryClient,
        contractAddress,
        fromBlock,
        challengeId: parsedChallengeId,
        viewer: viewerAddress,
        currentRound: currentRound!,
        maxParticipants,
      })
    },
    enabled,
    refetchInterval: q => (pollWhileMissing && q.state.data === null ? 2000 : false),
  })

  const isChallengeMissing = query.data === null && !query.isLoading && !pollWhileMissing

  return {
    data: query.data ?? undefined,
    isLoading: !isChallengeMissing && (query.isLoading || !enabled || (pollWhileMissing && query.data === null)),
    isError: query.isError,
    error: query.error,
  }
}
