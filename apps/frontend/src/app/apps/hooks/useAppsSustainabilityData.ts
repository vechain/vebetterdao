import { useAppActionLeaderboard } from "@/api/indexer/actions/useAppActionLeaderboard"
import { useMemo } from "react"

/**
 * Hook to fetch appId sorted by totalRewardAmount
 * @returns Map containing appId and their position in the sorted list
 */
export function useAppsSustainabilityData() {
  const querySearchData = {
    direction: "desc" as const,
    sortBy: "totalRewardAmount",
  }

  const { data, isLoading, error } = useAppActionLeaderboard(querySearchData)

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
