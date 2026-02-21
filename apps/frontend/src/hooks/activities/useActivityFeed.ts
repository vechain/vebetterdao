import { useMemo } from "react"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"

import { ActivityItem } from "./types"
import { useAppActivities } from "./useAppActivities"
import { useCurrentRoundProposalActivities } from "./useCurrentRoundProposalActivities"
import { useEmissionsActivities } from "./useEmissionsActivities"
import { useGmUpgradeActivities } from "./useGmUpgradeActivities"
import { useGrantActivities } from "./useGrantActivities"
import { usePreviousRoundProposalActivities } from "./usePreviousRoundProposalActivities"
import { useRoundActivities } from "./useRoundActivities"

export const useActivityFeed = (selectedRoundId?: string): { data: ActivityItem[]; isLoading: boolean } => {
  const { data: fetchedRoundId, isLoading: isRoundIdLoading } = useCurrentAllocationsRoundId()

  const currentRoundId = selectedRoundId ?? fetchedRoundId?.toString()
  const previousRoundId = currentRoundId && Number(currentRoundId) > 1 ? String(Number(currentRoundId) - 1) : undefined

  const { data: prevProposals, isLoading: isPrevProposalsLoading } = usePreviousRoundProposalActivities(previousRoundId)
  const { data: currProposals, isLoading: isCurrProposalsLoading } = useCurrentRoundProposalActivities(currentRoundId)
  const { data: grants, isLoading: isGrantsLoading } = useGrantActivities(currentRoundId)
  const { data: apps, isLoading: isAppsLoading } = useAppActivities(currentRoundId)
  const { data: gmUpgrades, isLoading: isGmUpgradesLoading } = useGmUpgradeActivities(currentRoundId)
  const { data: rounds, isLoading: isRoundsLoading } = useRoundActivities(previousRoundId)
  const { data: emissions, isLoading: isEmissionsLoading } = useEmissionsActivities(currentRoundId, previousRoundId)

  const data = useMemo(() => {
    return [...prevProposals, ...currProposals, ...grants, ...apps, ...gmUpgrades, ...rounds, ...emissions].sort(
      (a, b) => b.date - a.date,
    )
  }, [prevProposals, currProposals, grants, apps, gmUpgrades, rounds, emissions])

  const isLoading =
    isRoundIdLoading ||
    isPrevProposalsLoading ||
    isCurrProposalsLoading ||
    isGrantsLoading ||
    isAppsLoading ||
    isGmUpgradesLoading ||
    isRoundsLoading ||
    isEmissionsLoading

  return { data, isLoading }
}
