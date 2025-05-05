import { useState, useMemo } from "react"
import { AllApps } from "@/api"
import { SortedAppsWithStatus, SortOption } from "./useAppsSorting"

export const FILTER_ACTIVE_APPS = "Active apps"
export const FILTER_NEW_APPS = "New apps"
export const FILTER_GRACE_PERIOD = "In grace period"
export const FILTER_ENDORSEMENT_LOST = "Endorsement lost"

export function useAppsFilteringByStatus(sortedApp: SortedAppsWithStatus, sortOption: SortOption, searchQuery: string) {
  const [filter, setFilter] = useState(FILTER_ACTIVE_APPS)

  const filteredApps = useMemo(() => {
    let apps: AllApps[] = []

    switch (filter) {
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

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      return apps.filter(app => app.name.toLowerCase().includes(query))
    }

    return apps
  }, [filter, sortedApp, sortOption, searchQuery])

  return {
    filter,
    setFilter,
    filteredApps,
    filterOptions: [FILTER_ACTIVE_APPS, FILTER_NEW_APPS, FILTER_GRACE_PERIOD, FILTER_ENDORSEMENT_LOST],
  }
}
