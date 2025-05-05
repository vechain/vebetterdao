import { useMemo, useState, useCallback, useEffect } from "react"
import { XApp, UnendorsedApp } from "@/api"
import { useTranslation } from "react-i18next"
import { sortByCreationDate, sortAlphabetically, sortByRewards, sortByImpact } from "../utils/sortingFunctions"
import { useAppsSustainabilityData } from "./useAppsSustainabilityData"

export type SortOption = "newest" | "rewards" | "impact" | "alphabetical" | "default"
export const DEFAULT_SORT_OPTION: SortOption = "default"

export type SortedAppsWithStatus = {
  [key in SortOption]: {
    currentActiveApps: XApp[]
    newApps: UnendorsedApp[]
    gracePeriodApps: UnendorsedApp[]
    endorsementLostApps: UnendorsedApp[]
  }
}

export interface SortOptionProps {
  id: SortOption
  label: string
  description: string
}

export function useAppsSorting(
  currentActiveApps: XApp[],
  newApps: UnendorsedApp[],
  gracePeriodApps: UnendorsedApp[],
  endorsementLostApps: UnendorsedApp[],
) {
  const { t } = useTranslation()
  const [sortOption, setSortOption] = useState<SortOption>(DEFAULT_SORT_OPTION)
  const [isSorting, setIsSorting] = useState(false)
  const [isSorted, setIsSorted] = useState(false)
  const [pendingSortOption, setPendingSortOption] = useState<SortOption | null>(null)

  const allApps = useMemo(() => {
    return [...currentActiveApps, ...newApps, ...gracePeriodApps, ...endorsementLostApps]
  }, [currentActiveApps, newApps, gracePeriodApps, endorsementLostApps])

  const { rewardsMap, impactMap, isLoading: isRewardsLoading } = useAppsSustainabilityData(allApps)

  // Sort options configuration
  const sortOptions = useMemo<SortOptionProps[]>(
    () => [
      {
        id: "newest",
        label: t("Newest"),
        description: t("Most recently created apps"),
      },
      {
        id: "alphabetical",
        label: t("Alphabetical"),
        description: t("A to Z by app name"),
      },
      {
        id: "rewards",
        label: t("Rewards"),
        description: t("Highest rewards first"),
      },
      {
        id: "impact",
        label: t("Impact"),
        description: t("Highest impact first"),
      },
    ],
    [t],
  )

  // Create sorted collections
  const sortedApps = useMemo<SortedAppsWithStatus>(() => {
    return {
      newest: {
        currentActiveApps: sortByCreationDate(currentActiveApps) as XApp[],
        newApps: sortByCreationDate(newApps) as UnendorsedApp[],
        gracePeriodApps: sortByCreationDate(gracePeriodApps) as UnendorsedApp[],
        endorsementLostApps: sortByCreationDate(endorsementLostApps) as UnendorsedApp[],
      },
      alphabetical: {
        currentActiveApps: sortAlphabetically(currentActiveApps) as XApp[],
        newApps: sortAlphabetically(newApps) as UnendorsedApp[],
        gracePeriodApps: sortAlphabetically(gracePeriodApps) as UnendorsedApp[],
        endorsementLostApps: sortAlphabetically(endorsementLostApps) as UnendorsedApp[],
      },
      rewards: {
        currentActiveApps: sortByRewards(currentActiveApps, rewardsMap) as XApp[],
        newApps: sortByRewards(newApps, rewardsMap) as UnendorsedApp[],
        gracePeriodApps: sortByRewards(gracePeriodApps, rewardsMap) as UnendorsedApp[],
        endorsementLostApps: sortByRewards(endorsementLostApps, rewardsMap) as UnendorsedApp[],
      },
      impact: {
        currentActiveApps: sortByImpact(currentActiveApps, impactMap) as XApp[],
        newApps: sortByImpact(newApps, impactMap) as UnendorsedApp[],
        gracePeriodApps: sortByImpact(gracePeriodApps, impactMap) as UnendorsedApp[],
        endorsementLostApps: sortByImpact(endorsementLostApps, impactMap) as UnendorsedApp[],
      },
      default: {
        currentActiveApps: [...currentActiveApps],
        newApps: [...newApps],
        gracePeriodApps: [...gracePeriodApps],
        endorsementLostApps: [...endorsementLostApps],
      },
    }
  }, [currentActiveApps, newApps, gracePeriodApps, endorsementLostApps, rewardsMap, impactMap])

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
      // Only proceed if we're not waiting for rewards data for rewards/impact sort
      const isWaitingForRewardsData =
        isRewardsLoading && (pendingSortOption === "rewards" || pendingSortOption === "impact")

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

  // Determine if we're in a loading state
  const isLoadingState = isSorting || (isRewardsLoading && (sortOption === "rewards" || sortOption === "impact"))

  return {
    sortOption,
    sortOptions,
    sortedApps,
    isSorting: isLoadingState,
    onSortChange,
    isSorted,
  }
}
