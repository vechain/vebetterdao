import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

import { fetchAllChallenges, groupChallenges } from "./getChallenges"
import { GroupedChallenges } from "./types"

const EMPTY: GroupedChallenges = { activeParticipating: [], pendingInvites: [], publicJoinable: [], past: [] }

export const getChallengesHubQueryKey = (currentRoundId?: string, viewerAddress?: string) => [
  "challenges",
  "hub",
  currentRoundId ?? "unknown",
  viewerAddress ?? "guest",
]

export const useChallengesHub = (viewerAddress?: string) => {
  const thor = useThor()
  const { data: currentRoundId, isLoading: isCurrentRoundLoading } = useCurrentAllocationsRoundId()

  const query = useQuery({
    queryKey: getChallengesHubQueryKey(currentRoundId, viewerAddress),
    queryFn: () => fetchAllChallenges(thor, Number(currentRoundId), viewerAddress),
    enabled: !!thor && currentRoundId !== undefined,
  })

  const grouped = useMemo(() => (query.data ? groupChallenges(query.data) : EMPTY), [query.data])

  return {
    ...query,
    data: grouped,
    allChallenges: query.data ?? [],
    isLoading: isCurrentRoundLoading || query.isLoading,
  }
}
