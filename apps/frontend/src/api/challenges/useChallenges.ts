import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

import { fetchAllChallenges, filterByTab } from "./getChallenges"
import { ChallengeTab } from "./types"

export const getChallengesQueryKey = (tab: ChallengeTab, currentRoundId?: string, viewerAddress?: string) => [
  "challenges",
  "list",
  tab,
  currentRoundId ?? "unknown",
  viewerAddress ?? "guest",
]

export const useChallenges = (tab: ChallengeTab, viewerAddress?: string) => {
  const thor = useThor()
  const { data: currentRoundId, isLoading: isCurrentRoundLoading } = useCurrentAllocationsRoundId()

  const query = useQuery({
    queryKey: getChallengesQueryKey(tab, currentRoundId, viewerAddress),
    queryFn: () => fetchAllChallenges(thor, Number(currentRoundId), viewerAddress).then(all => filterByTab(all, tab)),
    enabled: !!thor && currentRoundId !== undefined,
  })

  return {
    ...query,
    isLoading: isCurrentRoundLoading || query.isLoading,
  }
}
