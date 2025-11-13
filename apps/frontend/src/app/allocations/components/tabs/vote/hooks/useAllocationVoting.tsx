import { HStack, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { ethers } from "ethers"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiZap } from "react-icons/fi"
import { parseEther } from "viem"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { CastAllocationVotesProps, useCastAllocationVotes } from "@/hooks/useCastAllocationVotes"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"

interface UseAllocationVotingProps {
  roundId: string
  onSuccess: () => void
}

/**
 * Custom hook to manage allocation voting flow with dynamic transaction modal UI
 * Handles:
 * - Transaction modal custom UI state
 * - Pending votes state
 * - Vote confirmation logic
 * - Automatic transaction triggering when UI is ready
 */
export const useAllocationVoting = ({ roundId, onSuccess }: UseAllocationVotingProps) => {
  const { t } = useTranslation()

  // Get user's voting power at snapshot
  const { votesAtSnapshot } = useVotingPowerAtSnapshot()

  const [customUI, setCustomUI] = useState<TransactionCustomUI>({
    pending: {
      title: t("Waiting for confirmation..."),
    },
    waitingConfirmation: {
      title: t("Sending transaction..."),
    },
    success: {
      title: t("Vote successfully submitted!"),
      buttonText: t("Go back to Allocation"),
    },
    error: {
      title: t("Error submitting your vote"),
    },
  })
  const [pendingVotes, setPendingVotes] = useState<CastAllocationVotesProps | null>(null)

  const castAllocationVotes = useCastAllocationVotes({
    roundId,
    onSuccess,
    transactionModalCustomUI: customUI,
  })

  // Effect to trigger transaction when customUI is updated with description and pendingVotes are ready
  useEffect(() => {
    if (pendingVotes && customUI.success?.description) {
      castAllocationVotes.sendTransaction(pendingVotes)
      setPendingVotes(null) // Clear after sending
    }
  }, [pendingVotes, customUI, castAllocationVotes])

  const handleConfirmVote = useCallback(
    (allocations: Map<string, number>) => {
      if (!votesAtSnapshot?.totalVotesWithDeposits) return

      // Convert percentages to weighted votes
      const totalVotingPower = parseEther(votesAtSnapshot.totalVotesWithDeposits)
      const allocationsWithWeight = new Map<string, bigint>()

      allocations.forEach((percentage, appId) => {
        const weight = (totalVotingPower * BigInt(Math.round(percentage * 100))) / 10000n
        if (weight > 0n) {
          allocationsWithWeight.set(appId, weight)
        }
      })

      // Filter out zero votes and prepare data for transaction
      const appVotes = Array.from(allocationsWithWeight.entries()).map(([appId, weight]) => ({
        appId,
        votes: Number(ethers.formatEther(weight)),
      }))

      // Calculate total voting weight for display in modal
      const totalVotingWeight = Array.from(allocationsWithWeight.values()).reduce(
        (sum, weight) => sum + Number(ethers.formatEther(weight)),
        0,
      )

      const compactFormatter = getCompactFormatter(2)
      const formattedWeight = compactFormatter.format(totalVotingWeight)

      // Create voting weight description
      const votingWeightDescription = (
        <HStack key={formattedWeight} justify="center" gap={2} bg="bg.subtle" px={4} py={2} borderRadius="lg">
          <Text textStyle="sm" color="text.subtle">
            {t("You voted with")}
          </Text>
          <HStack gap={1} bg="bg.success.subtle" px={3} py={1} borderRadius="md">
            <FiZap color="green" />
            <Text textStyle="sm" fontWeight="semibold" color="text.success">
              {formattedWeight}
            </Text>
          </HStack>
        </HStack>
      )

      // Update custom UI with dynamic voting weight
      setCustomUI({
        pending: {
          title: t("Waiting for confirmation..."),
          description: votingWeightDescription,
        },
        waitingConfirmation: {
          title: t("Sending transaction..."),
          description: votingWeightDescription,
        },
        success: {
          title: t("Vote successfully submitted!"),
          description: votingWeightDescription,
          buttonText: t("Go back to Allocation"),
        },
        error: {
          title: t("Error submitting your vote"),
        },
      })

      // Set pending votes - useEffect will trigger transaction when customUI is updated
      setPendingVotes(appVotes)
    },
    [t, votesAtSnapshot],
  )

  return {
    handleConfirmVote,
    isVoting: castAllocationVotes.status === "pending" || castAllocationVotes.status === "waitingConfirmation",
  }
}
