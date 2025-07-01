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
  const [categoryFilters, setCategoryFilters] = useState<string[]>([])

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
    return filteredAppsByStatus.filter(app => {
      const appsCats = appCategories?.[app.id] || []
      return appsCats.some(cat => categoryFilters.includes(cat))
    })
  }, [filteredAppsByStatus, appCategories, categoryFilters])

  const filteredApps = useMemo(() => {
    if (categoryFilters.length == 0) return filteredAppsByStatus
    return filteredAppsByCategory
  }, [filteredAppsByStatus, filteredAppsByCategory, categoryFilters])

  const toggleCategoryFilter = (categoryId: string) => {
    setCategoryFilters(prev => {
      if (prev.includes(categoryId)) {
        // Remove the category if it's already in the filters
        return prev.filter(id => id !== categoryId)
      } else {
        return [...prev, categoryId]
      }
    })
  }

  return {
    statusFilter,
    setStatusFilter,
    categoryFilters, // Array of selected categories
    setCategoryFilters,
    toggleCategoryFilter,
    filteredApps,
    statusFilterOptions: [FILTER_ACTIVE_APPS, FILTER_NEW_APPS, FILTER_GRACE_PERIOD, FILTER_ENDORSEMENT_LOST],
  }
}
