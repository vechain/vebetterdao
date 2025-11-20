import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { AllocationAlertCard } from "./AllocationAlertCard"

interface VotingAlertsProps {
  hasVoted: boolean
  hasVotedLoading: boolean
  selectedAppIds: Set<string>
  hasEnoughVotesAtSnapshot: boolean
  threshold?: string
}

export const VotingAlerts = ({
  hasVoted,
  hasVotedLoading,
  selectedAppIds,
  hasEnoughVotesAtSnapshot,
  threshold,
}: VotingAlertsProps) => {
  const { t } = useTranslation()

  const shouldShowInsufficientPowerAlert = useMemo(
    () => !hasVotedLoading && !hasVoted && selectedAppIds && selectedAppIds.size > 0 && !hasEnoughVotesAtSnapshot,
    [hasVotedLoading, hasVoted, selectedAppIds, hasEnoughVotesAtSnapshot],
  )

  return (
    <>
      {hasVoted && (
        <AllocationAlertCard
          status="info"
          message={t("You've already voted this round. Wait for the next round to vote again.")}
        />
      )}
      {shouldShowInsufficientPowerAlert && (
        <AllocationAlertCard
          status="error"
          title={t("Not enough voting power to vote")}
          message={t("At least {{threshold}} voting power is needed to participate. Power up your balance!", {
            threshold: threshold ?? "1",
          })}
        />
      )}
    </>
  )
}
