import { useCallback, useMemo, useState } from "react"

export interface AllocationData {
  appId: string
  percentage: number
  displayValue: string
}

export const useConfirmVoteModal = (appIds: string[]) => {
  /**
   * Helper: Distributes a percentage equally among target app IDs
   * Ensures the total distributed equals exactly the input percentage
   */
  const distributeEqually = useCallback(
    (targetAppIds: string[], totalPercentage: number, resultMap: Map<string, number>) => {
      if (targetAppIds.length === 0) return

      const basePercentage = Math.floor((totalPercentage / targetAppIds.length) * 100) / 100
      let distributed = 0

      // Assign base percentage to each app
      targetAppIds.forEach(id => {
        resultMap.set(id, basePercentage)
        distributed += basePercentage
      })

      // Add remainder to last app to reach exact total
      const remainder = parseFloat((totalPercentage - distributed).toFixed(2))
      if (remainder !== 0) {
        const lastAppId = targetAppIds[targetAppIds.length - 1]!
        resultMap.set(lastAppId, parseFloat((basePercentage + remainder).toFixed(2)))
      }
    },
    [],
  )

  /**
   * Helper: Creates initial equal distribution across all apps
   */
  const getEqualDistribution = useCallback(() => {
    const map = new Map<string, number>()
    if (appIds.length === 0) return map
    distributeEqually(appIds, 100, map)
    return map
  }, [appIds, distributeEqually])

  // State: allocations map and locked apps set
  const [allocations, setAllocations] = useState<Map<string, number>>(() => getEqualDistribution())
  const [lockedApps, setLockedApps] = useState<Set<string>>(new Set())

  /**
   * Updates allocation for an app and rebalances unlocked apps
   * Strategy: Lock the changed app, distribute remaining % among unlocked apps
   */
  const setAllocation = useCallback(
    (appId: string, percentage: number) => {
      setAllocations(prev => {
        const next = new Map(prev)

        // Step 1: Set the value for this app (no clamping)
        next.set(appId, percentage)

        // Step 2: Lock this app (prevents it from being auto-rebalanced later)
        setLockedApps(prevLocked => new Set(prevLocked).add(appId))

        // Step 3: Calculate total of all locked apps
        // Note: Using stale lockedApps is intentional - we exclude current app and add it separately
        let totalLocked = 0
        lockedApps.forEach(lockedId => {
          if (lockedId !== appId) {
            totalLocked += prev.get(lockedId) ?? 0
          }
        })
        totalLocked += percentage

        // Step 4: Distribute remaining % to unlocked apps only
        // Clamp remaining to 0 minimum to prevent negative percentages in unlocked apps
        const remaining = Math.max(0, 100 - totalLocked)
        const unlockedAppIds = appIds.filter(id => id !== appId && !lockedApps.has(id))

        if (unlockedAppIds.length > 0) {
          distributeEqually(unlockedAppIds, remaining, next)
        }

        return next
      })
    },
    [appIds, lockedApps, distributeEqually],
  )

  /**
   * Resets all allocations to equal distribution and clears locks
   */
  const setEqualAllocations = useCallback(() => {
    setAllocations(getEqualDistribution())
    setLockedApps(new Set())
  }, [getEqualDistribution])

  /**
   * Calculates total percentage across all allocations
   */
  const getTotalPercentage = useCallback(() => {
    let total = 0
    allocations.forEach(value => {
      total += value
    })
    return parseFloat(total.toFixed(2))
  }, [allocations])

  /**
   * Validates that allocations sum to 100% and all are non-negative
   */
  const isValid = useMemo(() => {
    const total = getTotalPercentage()
    if (total !== 100) return false

    // Only check for negative values (no upper limit check needed)
    for (const [, percentage] of allocations) {
      if (percentage < 0) return false
    }

    return true
  }, [getTotalPercentage, allocations])

  return {
    allocations,
    setAllocation,
    setEqualAllocations,
    getTotalPercentage,
    isValid,
  }
}
