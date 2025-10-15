import { useState, useCallback } from "react"

import { AllApps } from "../../../api/contracts/xApps/getXApps"

export function useAppsSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const filterAppsBySearch = useCallback(
    (apps: AllApps[]) => {
      if (!searchQuery.trim()) {
        return apps
      }
      const query = searchQuery.toLowerCase()
      return apps.filter(app => app.name.toLowerCase().includes(query))
    },
    [searchQuery],
  )
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
  }, [])
  const clearSearch = useCallback(() => {
    setSearchQuery("")
  }, [])
  return {
    searchQuery,
    setSearchQuery,
    handleSearchChange,
    filterAppsBySearch,
    clearSearch,
  }
}
