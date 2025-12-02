import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { useHasVotedInRound } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useUserVotingPreferences } from "@/api/contracts/xAllocations/hooks/useUserVotingPreferences"
import { getAutoVotingState } from "@/hooks/useAutoVotingState"
import { useCastAllocationVotes } from "@/hooks/useCastAllocationVotes"
import { useEnableAutoVotingAndVote } from "@/hooks/useEnableAutoVoting"
import { useUpdateVotingPreferences } from "@/hooks/useUpdateVotingPreferences"
import { distributeVotingPowerEqually, percentagesToWeiWithExactSum } from "@/utils/MathUtils/MathUtils"

import { VotingWeightDisplay } from "../../../VotingWeightDisplay"

interface UseAllocationVotingProps {
  roundId: string
  isAutoVotingEnabled?: boolean
  isAutoVotingEnabledOnChain?: boolean
  isAutoVotingEnabledInCurrentRound?: boolean
  onSuccess?: () => void
}

/**
 * Custom hook to manage allocation voting flow with dynamic transaction modal UI
 * Handles:
 * - Vote confirmation logic with dynamic UI
 * - Direct transaction submission with custom UI
 * - Auto-voting enable/disable flow
 */
export const useAllocationVoting = ({
  roundId,
  isAutoVotingEnabled = false,
  isAutoVotingEnabledOnChain = false,
  isAutoVotingEnabledInCurrentRound = false,
  onSuccess,
}: UseAllocationVotingProps) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const { votesAtSnapshot } = useVotingPowerAtSnapshot()
  const { data: hasVoted } = useHasVotedInRound(roundId, account?.address ?? undefined)
  const { data: currentPreferences = [] } = useUserVotingPreferences(account?.address)
  const castAllocationVotes = useCastAllocationVotes({
    roundId,
  })
  const manageAutoVotingAndVote = useEnableAutoVotingAndVote({ roundId })
  const updateVotingPreferences = useUpdateVotingPreferences({ roundId })

  const createVotingWeightDescription = useCallback(
    (formattedVotingWeight: string) => <VotingWeightDisplay formattedVotingWeight={formattedVotingWeight} />,
    [],
  )

  const createCustomUI = useCallback(
    (votingWeightDescription: JSX.Element, waitingTitle: string, successTitle: string) => ({
      pending: {
        title: t("Waiting for confirmation..."),
        description: votingWeightDescription,
      },
      waitingConfirmation: {
        title: waitingTitle,
        description: votingWeightDescription,
      },
      success: {
        title: successTitle,
        description: votingWeightDescription,
        showSocialButtons: false,
        showTransactionDetailsButton: false,
        hideDoneButton: true,
        onSuccess,
      },
      error: {
        title: t("Error submitting your vote"),
      },
    }),
    [t, onSuccess],
  )

  const handleConfirmVote = useCallback(
    (allocations: Map<string, number>) => {
      if (!votesAtSnapshot?.totalVotesWithDepositsWei) {
        throw new Error("Votes at snapshot not found")
      }

      const totalVotingPowerWei = votesAtSnapshot.totalVotesWithDepositsWei
      const appIds = Array.from(allocations.keys())
      const percentages = Array.from(allocations.values())

      // Detect equal distribution: all percentages within 0.0001% of each other
      // This avoids floating point issues when users select "Equal votes"
      const isEqualDistribution = percentages.length > 0 && percentages.every(p => Math.abs(p - percentages[0]!) < 0.01)

      // Use pure BigInt division for equal distribution
      // Use percentage conversion for custom allocations (might lose some precision)
      const voteWeightsWei = isEqualDistribution
        ? distributeVotingPowerEqually(totalVotingPowerWei, appIds.length)
        : percentagesToWeiWithExactSum(totalVotingPowerWei, percentages)

      // Filter out zero weights
      const allocationsWithWeightWei = new Map<string, bigint>()
      appIds.forEach((appId, index) => {
        const weight = voteWeightsWei[index]
        if (weight && weight > 0n) {
          allocationsWithWeightWei.set(appId, weight)
        }
      })

      // Re-extract after filtering (in case any were zero)
      const filteredAppIds = Array.from(allocationsWithWeightWei.keys())
      const filteredVoteWeightsWei = Array.from(allocationsWithWeightWei.values())

      // Calculate total voting weight for display in modal
      const totalVotingWeightWei = filteredVoteWeightsWei.reduce((sum, weight) => sum + weight, 0n)
      const totalVotingWeightEther = Number(ethers.formatEther(totalVotingWeightWei))

      const compactFormatter = getCompactFormatter(2)
      const formattedWeight = compactFormatter.format(totalVotingWeightEther)

      // Create voting weight description
      const votingWeightDescription = createVotingWeightDescription(formattedWeight)

      // Calculate auto-voting state using centralized logic
      const { shouldEnable, shouldDisable, needsPreferenceUpdate, isStandardVote, preferencesChanged } =
        getAutoVotingState({
          isAutoVotingEnabled,
          isAutoVotingEnabledOnChain,
          currentPreferences,
          selectedAppIds: filteredAppIds,
          hasVoted: hasVoted ?? false,
        })

      // Helper to get titles for auto-voting operations
      const getAutoVotingTitles = (enable: boolean) => {
        if (enable) {
          return {
            waiting: hasVoted ? t("Enabling automation...") : t("Enabling automation and submitting vote..."),
            success: hasVoted ? t("Automation enabled!") : t("Automation enabled & vote submitted!"),
          }
        }
        return {
          waiting: t("Disabling automation..."),
          success: t("Automation disabled!"),
        }
      }

      // Auto-voting state is changing
      if (shouldEnable || shouldDisable) {
        const { waiting, success } = getAutoVotingTitles(shouldEnable)

        let customUI

        if (shouldEnable) {
          customUI = createCustomUI(votingWeightDescription, waiting, success)
        } else {
          // When disabling, we only show weight description if we are also voting
          // If we already voted, we hide the description
          const showDescription = !hasVoted
          const description = showDescription ? votingWeightDescription : undefined

          customUI = {
            pending: {
              title: t("Waiting for confirmation..."),
              description,
            },
            waitingConfirmation: {
              title: waiting,
              description,
            },
            success: {
              title: success,
              description,
              showSocialButtons: false,
              showTransactionDetailsButton: false,
              hideDoneButton: true,
              onSuccess,
            },
            error: {
              title: t("Error disabling automation"),
            },
          }
        }

        if (account?.address) {
          manageAutoVotingAndVote.sendTransaction(
            {
              roundId,
              appIds: filteredAppIds,
              voteWeights: filteredVoteWeightsWei,
              userAddress: account.address,
              hasVoted: hasVoted ?? false,
              shouldEnable,
              shouldDisable,
              isAutoVotingEnabledInCurrentRound,
              needsPreferenceUpdate,
            },
            customUI,
          )
        }
      }
      // Auto-voting already enabled (and not changing), check if preferences changed
      else if (!isStandardVote) {
        if (preferencesChanged) {
          const customUI = {
            pending: {
              title: t("Waiting for confirmation..."),
            },
            waitingConfirmation: {
              title: t("Updating preferences..."),
            },
            success: {
              title: t("Preferences updated!"),
              showSocialButtons: false,
              showTransactionDetailsButton: false,
              hideDoneButton: true,
              onSuccess,
            },
            error: {
              title: t("Error updating preferences"),
            },
          }

          updateVotingPreferences.sendTransaction({ appIds: filteredAppIds }, customUI)
        }
      }
      // Default: No auto-voting involved, just manual vote
      else {
        const appVotes = Array.from(allocationsWithWeightWei.entries()).map(([appId, weightWei]) => ({
          appId,
          votes: ethers.formatEther(weightWei),
        }))

        const customUI = createCustomUI(
          votingWeightDescription,
          t("Sending transaction..."),
          t("Vote successfully submitted!"),
        )

        castAllocationVotes.sendTransaction(appVotes, customUI)
      }
    },
    [
      t,
      votesAtSnapshot,
      isAutoVotingEnabled,
      isAutoVotingEnabledOnChain,
      isAutoVotingEnabledInCurrentRound,
      account?.address,
      roundId,
      hasVoted,
      currentPreferences,
      createVotingWeightDescription,
      createCustomUI,
      castAllocationVotes,
      manageAutoVotingAndVote,
      updateVotingPreferences,
      onSuccess,
    ],
  )

  return {
    handleConfirmVote,
    isVoting:
      castAllocationVotes.status === "pending" ||
      castAllocationVotes.status === "waitingConfirmation" ||
      manageAutoVotingAndVote.status === "pending" ||
      manageAutoVotingAndVote.status === "waitingConfirmation" ||
      updateVotingPreferences.status === "pending" ||
      updateVotingPreferences.status === "waitingConfirmation",
  }
}
