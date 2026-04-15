import { useQuery } from "@tanstack/react-query"

import { fetchChallengeDetail } from "./indexerChallenges"

export const getChallengeQueryKey = (challengeId: string, viewerAddress?: string) => [
  "challenges",
  "detail",
  challengeId,
  viewerAddress ?? "guest",
]

export const useChallenge = (challengeId: string, viewerAddress?: string) => {
  return useQuery({
    queryKey: getChallengeQueryKey(challengeId, viewerAddress),
    queryFn: () => fetchChallengeDetail(Number(challengeId), viewerAddress),
    enabled: !!challengeId,
  })
}
