import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

import { fetchChallengeDetail } from "./getChallenges"

export const getChallengeQueryKey = (challengeId: string, currentRoundId?: string, viewerAddress?: string) => [
  "challenges",
  "detail",
  challengeId,
  currentRoundId ?? "unknown",
  viewerAddress ?? "guest",
]

export const useChallenge = (challengeId: string, viewerAddress?: string) => {
  const thor = useThor()
  const { data: currentRoundId, isLoading: isCurrentRoundLoading } = useCurrentAllocationsRoundId()

  const query = useQuery({
    queryKey: getChallengeQueryKey(challengeId, currentRoundId, viewerAddress),
    queryFn: () => fetchChallengeDetail(thor, Number(challengeId), Number(currentRoundId), viewerAddress),
    enabled: !!thor && !!challengeId && currentRoundId !== undefined,
  })

  return {
    ...query,
    isLoading: isCurrentRoundLoading || query.isLoading,
  }
}
