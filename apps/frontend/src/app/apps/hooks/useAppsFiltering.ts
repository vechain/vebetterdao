import { useState, useMemo } from "react"
import { AllApps, useXAppsCategories } from "@/api"
import { SortedAppsWithStatus } from "./useAppsSorting"
import {
  FILTER_ACTIVE_APPS,
  FILTER_NEW_APPS,
  FILTER_GRACE_PERIOD,
  FILTER_ENDORSEMENT_LOST,
  SortOption,
} from "@/types/appDetails"

/**
 * Hook for filtering apps by status, category, and search query
 * @param sortedApp Sorted app collections
 * @param sortOption Current sort option
 * @param searchQuery Search query string
 * @returns Filtered apps by status and category if selected
 */
export function useAppsFiltering(sortedApp: SortedAppsWithStatus, sortOption: SortOption, searchQuery: string) {
  const [statusFilter, setStatusFilter] = useState(FILTER_ACTIVE_APPS)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const { data: appCategories } = useXAppsCategories()

  const filteredAppsByStatus = useMemo(() => {
    let apps: AllApps[] = []
    switch (statusFilter) {
      case FILTER_ACTIVE_APPS:
        apps = sortedApp[sortOption].currentActiveApps
        break
      case FILTER_NEW_APPS:
        apps = sortedApp[sortOption].newApps
        break
      case FILTER_GRACE_PERIOD:
        apps = sortedApp[sortOption].gracePeriodApps
        break
      case FILTER_ENDORSEMENT_LOST:
        apps = sortedApp[sortOption].endorsementLostApps
        break
      default:
        apps = sortedApp[sortOption].currentActiveApps
    }

    // In case of search query change, filter again
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return apps.filter(app => app.name.toLowerCase().includes(query))
    }

    return apps
  }, [statusFilter, sortedApp, sortOption, searchQuery])

  const filteredAppsByCategory = useMemo(() => {
    if (!categoryFilter) return []

    return filteredAppsByStatus.filter(app => appCategories?.[app.id]?.includes(categoryFilter))
  }, [filteredAppsByStatus, appCategories, categoryFilter])

  const filteredApps = useMemo(() => {
    if (!categoryFilter || !filteredAppsByCategory) return filteredAppsByStatus
    return filteredAppsByCategory
  }, [filteredAppsByStatus, filteredAppsByCategory, categoryFilter])

  const toggleCategoryFilter = (categoryId: string) => {
    if (categoryFilter === categoryId) {
      // If the same category is clicked again, clear the filter
      setCategoryFilter(null)
    } else {
      setCategoryFilter(categoryId)
    }
  }

  return {
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    toggleCategoryFilter,
    filteredApps,
    statusFilterOptions: [FILTER_ACTIVE_APPS, FILTER_NEW_APPS, FILTER_GRACE_PERIOD, FILTER_ENDORSEMENT_LOST],
  }
}
