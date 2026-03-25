import { useQuery } from "@tanstack/react-query"
import { useCurrentAllocationsRoundId, useThor } from "@vechain/vechain-kit"

import { fetchChallengeDetail } from "./getChallenges"

export const getChallengeQueryKey = (challengeId: string, viewerAddress?: string) => [
  "challenges",
  "detail",
  challengeId,
  viewerAddress ?? "guest",
]

export const useChallenge = (challengeId: string, viewerAddress?: string) => {
  const thor = useThor()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  return useQuery({
    queryKey: getChallengeQueryKey(challengeId, viewerAddress),
    queryFn: () => fetchChallengeDetail(thor, Number(challengeId), Number(currentRoundId ?? 0), viewerAddress),
    enabled: !!thor && !!challengeId,
  })
}
