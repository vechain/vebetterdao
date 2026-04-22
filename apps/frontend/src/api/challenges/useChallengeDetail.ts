import { useQuery } from "@tanstack/react-query"

import { useChallengesDataSource } from "./datasource/useChallengesDataSource"

export const getChallengeDetailQueryKey = (challengeId: string, viewerAddress?: string) =>
  ["challenges", "detail", challengeId, viewerAddress ?? "guest"] as const

interface UseChallengeDetailOptions {
  pollWhileMissing?: boolean
}

/**
 * Fetches a challenge detail via the active ChallengesDataSource.
 * Replaces the previous indexer-based `useChallenge` hook.
 */
export const useChallengeDetail = (
  challengeId: string,
  viewerAddress?: string,
  options?: UseChallengeDetailOptions,
) => {
  const { pollWhileMissing = false } = options ?? {}
  const parsedChallengeId = Number(challengeId)
  const isValidChallengeId = Number.isInteger(parsedChallengeId) && parsedChallengeId > 0
  const ds = useChallengesDataSource()

  const query = useQuery({
    queryKey: getChallengeDetailQueryKey(challengeId, viewerAddress),
    queryFn: () => ds!.getChallengeDetail(parsedChallengeId, viewerAddress),
    enabled: !!ds && isValidChallengeId,
    refetchInterval: q => (pollWhileMissing && q.state.data === null ? 2000 : false),
  })

  const isChallengeMissing = query.data === null && !query.isLoading && !pollWhileMissing

  return {
    data: query.data ?? undefined,
    isLoading: !isChallengeMissing && (query.isLoading || !ds || (pollWhileMissing && query.data === null)),
    isError: query.isError,
    error: query.error,
  }
}
