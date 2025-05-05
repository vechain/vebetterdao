import { useState, useMemo, useCallback } from "react"
import { AllApps } from "@/api"

export function useAppsPagination(displayApps: AllApps[], noAppsInPage: number) {
  const [visibleAppsCount, setVisibleAppsCount] = useState(noAppsInPage)

  const displayAppsRestricted = useMemo(() => {
    return displayApps.slice(0, visibleAppsCount)
  }, [displayApps, visibleAppsCount])

  const hasMoreApps = useMemo(() => {
    return displayApps.length > visibleAppsCount
  }, [displayApps, visibleAppsCount])

  const handleLoadMore = useCallback(() => {
    setVisibleAppsCount(prev => prev + noAppsInPage)
  }, [noAppsInPage])

  const resetPagination = useCallback(() => {
    setVisibleAppsCount(noAppsInPage)
  }, [noAppsInPage])

  return {
    displayAppsRestricted,
    hasMoreApps,
    handleLoadMore,
    resetPagination,
  }
}
