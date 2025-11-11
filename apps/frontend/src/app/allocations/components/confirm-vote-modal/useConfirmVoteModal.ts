import { useCallback, useState } from "react"

export interface AllocationData {
  appId: string
  percentage: number
  displayValue: string
}

export const useConfirmVoteModal = (appIds: string[]) => {
  // Helper function to calculate equal distribution that sums to exactly 100%
  const getEqualDistribution = useCallback(() => {
    if (appIds.length === 0) return new Map<string, number>()

    const map = new Map<string, number>()
    const basePercentage = Math.floor((100 / appIds.length) * 100) / 100
    let total = 0

    // Assign base percentage to all apps
    appIds.forEach(id => {
      map.set(id, basePercentage)
      total += basePercentage
    })

    // Add the remainder to the last app to ensure total is exactly 100%
    const remainder = parseFloat((100 - total).toFixed(2))
    if (remainder > 0 && appIds.length > 0) {
      const lastAppId = appIds[appIds.length - 1]
      if (lastAppId) {
        const finalPercentage = parseFloat((basePercentage + remainder).toFixed(2))
        map.set(lastAppId, finalPercentage)
      }
    }

    return map
  }, [appIds])

  // Initialize allocations with equal distribution
  const [allocations, setAllocations] = useState<Map<string, number>>(() => getEqualDistribution())

  const setAllocation = useCallback((appId: string, percentage: number) => {
    setAllocations(prev => {
      const next = new Map(prev)
      next.set(appId, percentage)
      return next
    })
  }, [])

  const setEqualAllocations = useCallback(() => {
    setAllocations(getEqualDistribution())
  }, [getEqualDistribution])

  const getTotalPercentage = useCallback(() => {
    let total = 0
    allocations.forEach(value => {
      total += value
    })
    return Math.round(total * 100) / 100
  }, [allocations])

  const isValid = useCallback(() => {
    const total = getTotalPercentage()
    // Allow voting if total is between 0 and 100 (inclusive)
    return total > 0 && total <= 100
  }, [getTotalPercentage])

  return {
    allocations,
    setAllocation,
    setEqualAllocations,
    getTotalPercentage,
    isValid,
  }
}
