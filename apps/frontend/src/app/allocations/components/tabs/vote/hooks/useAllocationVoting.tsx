import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { parseEther } from "viem"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { useHasVotedInRound } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
import { useUserVotingPreferences } from "@/api/contracts/xAllocations/hooks/useUserVotingPreferences"
import { getAutoVotingState } from "@/hooks/useAutoVotingState"
import { useCastAllocationVotes } from "@/hooks/useCastAllocationVotes"
import { useEnableAutoVotingAndVote } from "@/hooks/useEnableAutoVoting"
import { useUpdateVotingPreferences } from "@/hooks/useUpdateVotingPreferences"
import { calculateVotingWeightFromPercentage } from "@/utils/MathUtils/MathUtils"

import { VotingWeightDisplay } from "../../../VotingWeightDisplay"

interface UseAllocationVotingProps {
  roundId: string
  isAutoVotingEnabled?: boolean
  isAutoVotingEnabledOnChain?: boolean
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
      if (!votesAtSnapshot?.totalVotesWithDeposits) {
        throw new Error("Votes at snapshot not found")
      }

      // Convert percentages to weighted votes in wei
      const totalVotingPower = parseEther(votesAtSnapshot.totalVotesWithDeposits)
      const allocationsWithWeight = new Map<string, bigint>()

      allocations.forEach((percentage, appId) => {
        const weight = calculateVotingWeightFromPercentage(totalVotingPower, percentage)
        if (weight > 0n) {
          allocationsWithWeight.set(appId, weight)
        }
      })

      // Extract app IDs and weights
      const appIds = Array.from(allocationsWithWeight.keys())
      const voteWeights = Array.from(allocationsWithWeight.values())

      // Calculate total voting weight for display in modal
      const totalVotingWeight = voteWeights.reduce((sum, weight) => sum + Number(ethers.formatEther(weight)), 0)

      const compactFormatter = getCompactFormatter(2)
      const formattedWeight = compactFormatter.format(totalVotingWeight)

      // Create voting weight description
      const votingWeightDescription = createVotingWeightDescription(formattedWeight)

      // Calculate auto-voting state using centralized logic
      const { shouldEnable, shouldDisable, needsPreferenceUpdate, isStandardVote, preferencesChanged } =
        getAutoVotingState({
          isAutoVotingEnabled,
          isAutoVotingEnabledOnChain,
          currentPreferences,
          selectedAppIds: appIds,
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
          waiting: hasVoted ? t("Disabling automation...") : t("Disabling automation and submitting vote..."),
          success: hasVoted ? t("Automation disabled!") : t("Automation disabled & vote submitted!"),
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
              appIds,
              voteWeights,
              userAddress: account.address,
              hasVoted: hasVoted ?? false,
              shouldEnable,
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

          updateVotingPreferences.sendTransaction({ appIds }, customUI)
        }
      }
      // Default: No auto-voting involved, just manual vote
      else {
        const appVotes = Array.from(allocationsWithWeight.entries()).map(([appId, weight]) => ({
          appId,
          votesWei: weight.toString(),
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
