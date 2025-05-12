import { useState, useEffect } from "react"
import { XApp, UnendorsedApp } from "@/api"
import { getSustainabilityAppOverview } from "@/api/indexer/sustainability/useSustainabilityAppOverview"

type AllApps = XApp | UnendorsedApp

/**
 * Hook to fetch rewards data for a list of apps
 * @param apps Array of apps to fetch rewards data for
 * @returns Object containing rewards map
 */
export function useAppsSustainabilityData(apps: AllApps[]) {
  const [rewardsMap, setRewardsMap] = useState<Map<string, number>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!apps.length) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    const newRewardsMap = new Map<string, number>()

    let completedRequests = 0

    const checkAllComplete = () => {
      if (completedRequests === apps.length) {
        setRewardsMap(newRewardsMap)
        setIsLoading(false)
      }
    }

    // Fetch data for each app
    apps.forEach(app => {
      getSustainabilityAppOverview({
        appId: app.id,
        direction: "desc",
        page: 0,
        size: 1,
      })
        .then(data => {
          // Store the rewards data
          newRewardsMap.set(app.id, data.data?.[0]?.totalRewardAmount || 0)
        })
        .catch(error => {
          console.error(`Error fetching data for app ${app.id}:`, error)
          // Set default values on error
          newRewardsMap.set(app.id, 0)
        })
        .finally(() => {
          completedRequests++
          checkAllComplete()
        })
    })

    if (apps.length === 0) {
      setIsLoading(false)
    }

    return () => {}
  }, [apps])

  return {
    rewardsMap,
    isLoading,
  }
}
