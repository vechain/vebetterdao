import { useState, useMemo } from "react"

import {
  FILTER_ACTIVE_APPS,
  FILTER_NEW_APPS,
  FILTER_GRACE_PERIOD,
  FILTER_ENDORSEMENT_LOST,
  SortOption,
} from "@/types/appDetails"

import { AllApps } from "../../../api/contracts/xApps/getXApps"
import { useXAppsCategories } from "../../../api/contracts/xApps/hooks/useXAppsCategories"

import { SortedAppsWithStatus } from "./useAppsSorting"

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

  // Search across ALL apps regardless of status filter
  const searchedApps = useMemo(() => {
    if (!searchQuery.trim()) return null

    const query = searchQuery.toLowerCase()
    const { currentActiveApps, newApps, gracePeriodApps, endorsementLostApps } = sortedApp[sortOption]

    // Combine all apps and filter by search query
    const allApps = [...currentActiveApps, ...newApps, ...gracePeriodApps, ...endorsementLostApps]

    // Remove duplicates by id (some apps might appear in multiple categories)
    const uniqueApps = allApps.filter((app, index, self) => self.findIndex(a => a.id === app.id) === index)

    return uniqueApps.filter(app => app.name.toLowerCase().includes(query))
  }, [sortedApp, sortOption, searchQuery])

  const filteredAppsByStatus = useMemo(() => {
    // If there's a search query, return search results across all apps
    if (searchedApps !== null) {
      return searchedApps
    }

    // Otherwise, filter by status as before
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

    return apps
  }, [statusFilter, sortedApp, sortOption, searchedApps])

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
