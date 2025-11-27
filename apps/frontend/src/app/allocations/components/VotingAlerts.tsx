import { useContext, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useVotingThreshold } from "@/api/contracts/governance/hooks/useVotingThreshold"

import { AllocationAlertCard } from "./AllocationAlertCard"
import { AllocationTabsContext, MAX_SELECTED_APPS } from "./tabs/AllocationTabsProvider"

/**
 * VotingAlerts component that displays alerts based on voting state.
 * Uses AllocationTabsContext to get all required state.
 */
export const VotingAlerts = () => {
  const context = useContext(AllocationTabsContext)
  if (!context) throw new Error("VotingAlerts must be used within AllocationTabsProvider")

  const {
    hasVoted,
    hasVotedLoading,
    selectedAppIds,
    hasEnoughVotesAtSnapshot,
    isAutoVotingEnabled,
    isAutoVotingEnabledInCurrentRound,
  } = context

  const { t } = useTranslation()
  const { data: threshold } = useVotingThreshold()
  const isAtSelectionLimit = selectedAppIds.size >= MAX_SELECTED_APPS

  const shouldShowInsufficientPowerAlert = useMemo(
    () => !hasVotedLoading && !hasVoted && selectedAppIds && selectedAppIds.size > 0 && !hasEnoughVotesAtSnapshot,
    [hasVotedLoading, hasVoted, selectedAppIds, hasEnoughVotesAtSnapshot],
  )

  // Determine which auto-voting message to show
  const autoVotingMessage = useMemo((): string | null => {
    if (isAutoVotingEnabledInCurrentRound && isAutoVotingEnabled) {
      return t("Auto-voting active. Your vote and rewards will be handled automatically.")
    }
    if (isAutoVotingEnabledInCurrentRound && !isAutoVotingEnabled) {
      return t("Auto-voting active this round. It will be disabled for future rounds.")
    }
    if (!isAutoVotingEnabledInCurrentRound && isAutoVotingEnabled) {
      return t("Auto-voting enabled. It will start from next round onwards.")
    }
    return null
  }, [isAutoVotingEnabledInCurrentRound, isAutoVotingEnabled, t])

  return (
    <>
      {autoVotingMessage && <AllocationAlertCard status="info" message={autoVotingMessage} />}
      {shouldShowInsufficientPowerAlert && (
        <AllocationAlertCard
          status="error"
          title={t("Not enough voting power to vote")}
          message={t("At least {{threshold}} voting power is needed to participate. Power up your balance!", {
            threshold: threshold ?? "1",
          })}
        />
      )}
      {isAtSelectionLimit && (
        <AllocationAlertCard
          status="info"
          message={t("Maximum {{count}} apps can be selected per vote.", { count: MAX_SELECTED_APPS })}
        />
      )}
    </>
  )
}
