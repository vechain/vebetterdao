import { Button, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useContext, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useVotingThreshold } from "@/api/contracts/governance/hooks/useVotingThreshold"
import { useGetNavigatorAtTimepoint } from "@/api/contracts/navigatorRegistry/hooks/useGetNavigatorAtTimepoint"
import { useAllocationRoundSnapshot } from "@/api/contracts/xAllocations/hooks/useAllocationRoundSnapshot"

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
    roundId,
    hasVoted,
    hasVotedLoading,
    selectedAppIds,
    hasEnoughVotesAtSnapshot,
    isCanVoteLoading,
    isAutoVotingEnabled,
    isAutoVotingEnabledInCurrentRound,
    isDelegatedToNavigator,
  } = context

  const { account } = useWallet()
  const { t } = useTranslation()
  const router = useRouter()
  const { data: threshold } = useVotingThreshold()
  const { data: roundSnapshotBlock } = useAllocationRoundSnapshot(roundId)
  // Resolve the navigator that holds the user's voting power for this round, so the link points
  // to the navigator actually voting on their behalf (relevant when delegation is exiting/changing).
  const { data: snapshotNavigatorAddress } = useGetNavigatorAtTimepoint(account?.address, roundSnapshotBlock)
  const isAtSelectionLimit = selectedAppIds.size >= MAX_SELECTED_APPS

  const shouldShowInsufficientPowerAlert = useMemo(
    () => !hasVotedLoading && !isCanVoteLoading && !hasVoted && !hasEnoughVotesAtSnapshot,
    [hasVotedLoading, isCanVoteLoading, hasVoted, hasEnoughVotesAtSnapshot],
  )

  // Determine which auto-voting message to show
  const autoVotingMessage = useMemo((): string | null => {
    if (isAutoVotingEnabledInCurrentRound && isAutoVotingEnabled) {
      return t("Auto-voting is active. Your vote and rewards will be handled automatically.")
    }
    if (isAutoVotingEnabledInCurrentRound && !isAutoVotingEnabled) {
      return t("Auto-voting is disabled. It takes effect from the next round.")
    }
    if (!isAutoVotingEnabledInCurrentRound && isAutoVotingEnabled) {
      return t("Auto-voting is enabled. It takes effect from the next round.")
    }
    return null
  }, [isAutoVotingEnabledInCurrentRound, isAutoVotingEnabled, t])

  if (!account?.address) return null

  if (isDelegatedToNavigator) {
    return (
      <AllocationAlertCard
        status="info"
        message={
          <VStack alignItems="flex-start" gap="2" w="full">
            <Text textStyle="sm" fontWeight="medium" color="status.info.strong">
              {t("You have delegated to a navigator. Your navigator votes and claims rewards on your behalf.")}
            </Text>
            {snapshotNavigatorAddress && (
              <Button
                size="xs"
                variant="secondary"
                onClick={() => router.push(`/navigators/${snapshotNavigatorAddress}`)}>
                {t("View navigator")}
              </Button>
            )}
          </VStack>
        }
      />
    )
  }

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
