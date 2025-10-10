import { useMemo, useState, useCallback, useEffect } from "react"

import {
  FILTER_ENDORSEMENT_LOST,
  FILTER_GRACE_PERIOD,
  FILTER_NEW_APPS,
  SortOption,
  FILTER_ACTIVE_APPS,
} from "@/types/appDetails"

import { XApp, UnendorsedApp, AllApps } from "../../../api/contracts/xApps/getXApps"
import { sortByCreationDate, sortAlphabetically, sortByRewards } from "../utils/sortingFunctions"

import { useAppsSustainabilityData } from "./useAppsSustainabilityData"

export const DEFAULT_SORT_OPTION: SortOption = "default"

export type SortedAppsWithStatus = Record<
  SortOption,
  {
    currentActiveApps: XApp[]
    newApps: AllApps[]
    gracePeriodApps: UnendorsedApp[]
    endorsementLostApps: UnendorsedApp[]
  }
>

export function useAppsSorting(
  currentActiveApps: XApp[],
  newApps: AllApps[],
  gracePeriodApps: UnendorsedApp[],
  endorsementLostApps: UnendorsedApp[],
) {
  const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT_OPTION)
  const [isSorting, setIsSorting] = useState(false)
  const [isSorted, setIsSorted] = useState(false)
  const [pendingSortOption, setPendingSortOption] = useState<SortOption | null>(null)

  const { allAppsSortedByRewards, isLoading: isRewardsLoading } = useAppsSustainabilityData()

  // Create sorted collections
  const sortedApps = useMemo<SortedAppsWithStatus>(() => {
    return {
      newest: {
        currentActiveApps: sortByCreationDate(currentActiveApps) as XApp[],
        newApps: sortByCreationDate(newApps) as AllApps[],
        gracePeriodApps: sortByCreationDate(gracePeriodApps) as UnendorsedApp[],
        endorsementLostApps: sortByCreationDate(endorsementLostApps) as UnendorsedApp[],
      },
      alphabetical: {
        currentActiveApps: sortAlphabetically(currentActiveApps) as XApp[],
        newApps: sortAlphabetically(newApps) as AllApps[],
        gracePeriodApps: sortAlphabetically(gracePeriodApps) as UnendorsedApp[],
        endorsementLostApps: sortAlphabetically(endorsementLostApps) as UnendorsedApp[],
      },
      rewards: {
        currentActiveApps: sortByRewards(currentActiveApps, allAppsSortedByRewards) as XApp[],
        newApps: sortByRewards(newApps, allAppsSortedByRewards) as AllApps[],
        gracePeriodApps: sortByRewards(gracePeriodApps, allAppsSortedByRewards) as UnendorsedApp[],
        endorsementLostApps: sortByRewards(endorsementLostApps, allAppsSortedByRewards) as UnendorsedApp[],
      },
      default: {
        currentActiveApps: [...currentActiveApps],
        newApps: [...newApps],
        gracePeriodApps: [...gracePeriodApps],
        endorsementLostApps: [...endorsementLostApps],
      },
    }
  }, [currentActiveApps, newApps, gracePeriodApps, endorsementLostApps, allAppsSortedByRewards])

  const appWithStatusCounts = {
    [FILTER_ACTIVE_APPS]: sortedApps[sortOption].currentActiveApps.length,
    [FILTER_NEW_APPS]: sortedApps[sortOption].newApps.length,
    [FILTER_GRACE_PERIOD]: sortedApps[sortOption].gracePeriodApps.length,
    [FILTER_ENDORSEMENT_LOST]: sortedApps[sortOption].endorsementLostApps.length,
  }

  const onSortChange = useCallback(
    (option: SortOption) => {
      setIsSorting(true)

      // Resetting the sort option if double clicking on the same sorting option
      if (option === sortOption) {
        setPendingSortOption(DEFAULT_SORT_OPTION)
        setIsSorted(false)
      } else {
        setPendingSortOption(option)
        setIsSorted(true)
      }
    },
    [sortOption],
  )

  // Effect to handle the actual sort change
  useEffect(() => {
    if (pendingSortOption !== null && isSorting) {
      const isWaitingForRewardsData = isRewardsLoading && pendingSortOption === "rewards"

      if (!isWaitingForRewardsData) {
        const animationFrame = requestAnimationFrame(() => {
          setSortOption(pendingSortOption)
          setPendingSortOption(null)
          setIsSorting(false)
        })

        return () => cancelAnimationFrame(animationFrame)
      }
    }
  }, [pendingSortOption, isSorting, isRewardsLoading])

  const isLoadingState = isSorting || (isRewardsLoading && sortOption === "rewards")

  return {
    sortOption,
    sortedApps,
    isSorting: isLoadingState,
    appWithStatusCounts,
    onSortChange,
    isSorted,
  }
}
