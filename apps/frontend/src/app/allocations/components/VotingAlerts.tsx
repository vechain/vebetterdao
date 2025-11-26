import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { AllocationAlertCard } from "./AllocationAlertCard"
import { MAX_SELECTED_APPS } from "./tabs/AllocationTabsProvider"

interface VotingAlertsProps {
  hasVoted: boolean
  hasVotedLoading: boolean
  selectedAppIds: Set<string>
  hasEnoughVotesAtSnapshot: boolean
  threshold?: string
  isAtSelectionLimit?: boolean
  isAutoVotingEnabled?: boolean
  isAutoVotingEnabledInCurrentRound?: boolean
}

export const VotingAlerts = ({
  hasVoted,
  hasVotedLoading,
  selectedAppIds,
  hasEnoughVotesAtSnapshot,
  threshold,
  isAtSelectionLimit = false,
  isAutoVotingEnabled = false,
  isAutoVotingEnabledInCurrentRound = false,
}: VotingAlertsProps) => {
  const { t } = useTranslation()

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
