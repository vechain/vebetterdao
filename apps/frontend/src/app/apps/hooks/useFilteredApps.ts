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

/**
 * Hook for filtering and sorting apps
 * Following the same pattern as useFilteredProposals
 */
export const useFilteredApps = (apps: AppsCollection) => {
  const { statusFilter, categoryFilters, sortOption } = useAppsFilters()
  const { data: appCategories } = useXAppsCategories()

  // Fetch rewards data for sorting
  const { data: rewardsData, isLoading: isRewardsLoading } = useAppActionLeaderboard({
    direction: "DESC",
    sortBy: "totalRewardAmount",
  })

  const rewardsPositionMap = useMemo(() => {
    if (!rewardsData?.pages[0]) return new Map<string, number>()
    const appIds = rewardsData.pages[0].data || []
    return new Map(appIds.map((item, index) => [item.appId, index]))
  }, [rewardsData])

  // Combine all apps for global search
  const allApps = useMemo(() => {
    const combined = [...apps.currentActiveApps, ...apps.newApps, ...apps.gracePeriodApps, ...apps.endorsementLostApps]
    // Remove duplicates by id
    return combined.filter((app, index, self) => self.findIndex(a => a.id === app.id) === index)
  }, [apps])

  // All apps except endorsement lost (for "All" filter)
  const allExceptEndorsementLost = useMemo(() => {
    const combined = [...apps.currentActiveApps, ...apps.newApps, ...apps.gracePeriodApps]
    // Remove duplicates by id
    return combined.filter((app, index, self) => self.findIndex(a => a.id === app.id) === index)
  }, [apps])

  // Status counts for filter badges
  const statusCounts = useMemo(
    () => ({
      [AppStatusFilter.All]: allExceptEndorsementLost.length,
      [AppStatusFilter.Active]: apps.currentActiveApps.length,
      [AppStatusFilter.New]: apps.newApps.length,
      [AppStatusFilter.GracePeriod]: apps.gracePeriodApps.length,
      [AppStatusFilter.EndorsementLost]: apps.endorsementLostApps.length,
    }),
    [apps, allExceptEndorsementLost],
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
        baseApps = apps.currentActiveApps
        break
      case AppStatusFilter.New:
        baseApps = apps.newApps
        break
      case AppStatusFilter.GracePeriod:
        baseApps = apps.gracePeriodApps
        break
      case AppStatusFilter.EndorsementLost:
        baseApps = apps.endorsementLostApps
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
  }, [statusFilter, categoryFilters, sortOption, apps, appCategories, sortApps, allExceptEndorsementLost])

  return {
    filteredApps,
    allApps,
    statusCounts,
    isLoading: isRewardsLoading && sortOption === "rewards",
  }
}
