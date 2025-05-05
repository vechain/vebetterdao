import { useState, useEffect } from "react"
import { XApp, UnendorsedApp } from "@/api"
import { getSustainabilityAppOverview } from "@/api/indexer/sustainability/useSustainabilityAppOverview"

type AllApps = XApp | UnendorsedApp

/**
 * Calculate the total impact by summing all impact metrics
 * @param totalImpact The impact object from the API response
 * @returns The sum of all impact metrics
 */
function calculateTotalImpact(totalImpact?: Record<string, number | undefined>): number {
  if (!totalImpact) return 0

  // Sum all numeric values in the totalImpact object
  return Object.values(totalImpact)
    .filter((value): value is number => typeof value === "number")
    .reduce((sum, value) => sum + value, 0)
}

/**
 * Hook to fetch rewards data for a list of apps
 * @param apps Array of apps to fetch rewards data for
 * @returns Object containing rewards and impact maps
 */
export function useAppsSustainabilityData(apps: AllApps[]) {
  const [rewardsMap, setRewardsMap] = useState<Map<string, number>>(new Map())
  const [impactMap, setImpactMap] = useState<Map<string, number>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data for all apps
  useEffect(() => {
    if (!apps.length) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    // Create new maps to store the data
    const newRewardsMap = new Map<string, number>()
    const newImpactMap = new Map<string, number>()

    // Track how many requests have completed
    let completedRequests = 0

    // Function to check if all requests are complete
    const checkAllComplete = () => {
      if (completedRequests === apps.length) {
        setRewardsMap(newRewardsMap)
        setImpactMap(newImpactMap)
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

          // Calculate and store the total impact
          const totalImpactValue = calculateTotalImpact(data.data?.[0]?.totalImpact)
          console.log({ totalImpactValue, app })
          newImpactMap.set(app.id, totalImpactValue)
        })
        .catch(error => {
          console.error(`Error fetching data for app ${app.id}:`, error)
          // Set default values on error
          newRewardsMap.set(app.id, 0)
          newImpactMap.set(app.id, 0)
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
    impactMap,
    isLoading,
  }
}
