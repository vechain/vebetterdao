import { useQuery } from "@tanstack/react-query"
import { useCurrentAllocationsRoundId, useThor } from "@vechain/vechain-kit"

import { fetchAllChallenges, filterByTab } from "./getChallenges"
import { ChallengeTab } from "./types"

export const getChallengesQueryKey = (tab: ChallengeTab, viewerAddress?: string) => [
  "challenges",
  "list",
  tab,
  viewerAddress ?? "guest",
]

export const useChallenges = (tab: ChallengeTab, viewerAddress?: string) => {
  const thor = useThor()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const currentRound = Number(currentRoundId ?? 0)
  return useQuery({
    queryKey: getChallengesQueryKey(tab, viewerAddress),
    queryFn: async () => {
      const all = await fetchAllChallenges(thor, currentRound, viewerAddress)
      return filterByTab(all, tab)
    },
    enabled: !!thor,
  })
}
