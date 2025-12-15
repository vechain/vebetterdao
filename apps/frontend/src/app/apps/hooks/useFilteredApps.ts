import { useCallback, useMemo } from "react"

import { useAppActionLeaderboard } from "@/api/indexer/actions/useAppActionLeaderboard"
import { AppStatusFilter, useAppsFilters } from "@/store/useAppsFilters"
import { SortOption } from "@/types/appDetails"
import dayjs from "@/utils/dayjsConfig"

import { AllApps, UnendorsedApp, XApp } from "../../../api/contracts/xApps/getXApps"
import { useXAppsCategories } from "../../../api/contracts/xApps/hooks/useXAppsCategories"

type AppsCollection = {
  currentActiveApps: XApp[]
  newApps: (UnendorsedApp | XApp)[]
  gracePeriodApps: UnendorsedApp[]
  endorsementLostApps: UnendorsedApp[]
}

const addUniqueApps = (target: AllApps[], appsToAdd: AllApps[], seenIds: Set<string>) => {
  for (const app of appsToAdd) {
    if (seenIds.has(app.id)) continue
    seenIds.add(app.id)
    target.push(app)
  }
}

/**
 * Hook for filtering and sorting apps
 * Following the same pattern as useFilteredProposals
 */
export const useFilteredApps = ({
  currentActiveApps,
  newApps,
  gracePeriodApps,
  endorsementLostApps,
}: AppsCollection) => {
  const { statusFilter, categoryFilters, sortOption } = useAppsFilters()
  const { data: appCategories } = useXAppsCategories()

  const { data: rewardsData, isLoading: isRewardsLoading } = useAppActionLeaderboard({
    direction: "DESC",
    sortBy: "totalRewardAmount",
  })

  const rewardsPositionMap = useMemo(() => {
    if (!rewardsData?.pages[0]) return new Map<string, number>()
    const appIds = rewardsData.pages[0].data || []
    return new Map(appIds.map((item, index) => [item.appId, index]))
  }, [rewardsData])

  const { searchApps, allExceptEndorsementLost } = useMemo(() => {
    const seenIds = new Set<string>()

    const allExceptEndorsementLost: AllApps[] = []
    addUniqueApps(allExceptEndorsementLost, currentActiveApps, seenIds)
    addUniqueApps(allExceptEndorsementLost, newApps, seenIds)
    addUniqueApps(allExceptEndorsementLost, gracePeriodApps, seenIds)

    const searchApps = [...allExceptEndorsementLost]
    addUniqueApps(searchApps, endorsementLostApps, seenIds)

    return { searchApps, allExceptEndorsementLost }
  }, [currentActiveApps, newApps, gracePeriodApps, endorsementLostApps])

  // Status counts for filter badges
  const statusCounts = useMemo(
    () => ({
      [AppStatusFilter.All]: allExceptEndorsementLost.length,
      [AppStatusFilter.Active]: currentActiveApps.length,
      [AppStatusFilter.New]: newApps.length,
      [AppStatusFilter.GracePeriod]: gracePeriodApps.length,
      [AppStatusFilter.EndorsementLost]: endorsementLostApps.length,
    }),
    [currentActiveApps, newApps, gracePeriodApps, endorsementLostApps, allExceptEndorsementLost],
  )

  // Sorting function
  const sortApps = useCallback(
    (appsToSort: AllApps[], option: SortOption): AllApps[] => {
      if (option === "default") return appsToSort

      return [...appsToSort].sort((a, b) => {
        switch (option) {
          case "alphabetical":
            return a.name.localeCompare(b.name)
          case "newest":
            return dayjs(b.createdAtTimestamp).diff(dayjs(a.createdAtTimestamp))
          case "rewards": {
            const posA = rewardsPositionMap.get(a.id) ?? Number.MAX_SAFE_INTEGER
            const posB = rewardsPositionMap.get(b.id) ?? Number.MAX_SAFE_INTEGER
            return posA - posB
          }
          default:
            return 0
        }
      })
    },
    [rewardsPositionMap],
  )

  // Main filtering logic
  const filteredApps = useMemo(() => {
    // Step 1: Filter by status
    let baseApps: AllApps[]
    switch (statusFilter) {
      case AppStatusFilter.All:
        baseApps = allExceptEndorsementLost
        break
      case AppStatusFilter.Active:
        baseApps = currentActiveApps
        break
      case AppStatusFilter.New:
        baseApps = newApps
        break
      case AppStatusFilter.GracePeriod:
        baseApps = gracePeriodApps
        break
      case AppStatusFilter.EndorsementLost:
        baseApps = endorsementLostApps
        break
      default:
        baseApps = allExceptEndorsementLost
    }

    // Step 2: Apply category filter if any categories are selected
    let result = baseApps
    if (categoryFilters.length > 0) {
      result = baseApps.filter(app => {
        const appCats = appCategories?.[app.id] || []
        return appCats.some(cat => categoryFilters.includes(cat))
      })
    }

    // Step 3: Apply sorting
    return sortApps(result, sortOption)
  }, [
    statusFilter,
    categoryFilters,
    sortOption,
    currentActiveApps,
    newApps,
    gracePeriodApps,
    endorsementLostApps,
    appCategories,
    sortApps,
    allExceptEndorsementLost,
  ])

  return {
    filteredApps,
    searchApps,
    statusCounts,
    isLoading: isRewardsLoading && sortOption === "rewards",
  }
}
