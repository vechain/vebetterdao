import { useMemo } from "react"

import { useAppActionLeaderboard } from "@/api/indexer/actions/useAppActionLeaderboard"

/**
 * Hook to fetch appId sorted by totalRewardAmount
 * @returns Map containing appId and their position in the sorted list
 */
export function useAppsSustainabilityData() {
  const { data, isLoading, error } = useAppActionLeaderboard({ direction: "DESC", sortBy: "totalRewardAmount" })
  const allAppsSortedByRewards = useMemo(() => {
    if (!data?.pages[0]) return new Map()
    const appIds = data.pages[0].data || []
    return new Map(appIds.map((item, index) => [item.appId, index]))
  }, [data])
  return {
    allAppsSortedByRewards,
    isLoading,
    error,
  }
}
