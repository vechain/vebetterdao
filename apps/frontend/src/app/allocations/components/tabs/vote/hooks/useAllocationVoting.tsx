import { Badge, Button, Card, Icon, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { ethers } from "ethers"
import { Flash } from "iconoir-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { parseEther } from "viem"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { CastAllocationVotesProps, useCastAllocationVotes } from "@/hooks/useCastAllocationVotes"
import { TransactionCustomUI } from "@/providers/TransactionModalProvider"
import { calculateVotingWeightFromPercentage } from "@/utils/MathUtils/MathUtils"

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
    },
    error: {
      title: t("Error submitting your vote"),
    },
  })
  const [pendingVotes, setPendingVotes] = useState<CastAllocationVotesProps | null>(null)

  const castAllocationVotes = useCastAllocationVotes({
    roundId,
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

      // Convert percentages to weighted votes in wei
      const totalVotingPower = parseEther(votesAtSnapshot.totalVotesWithDeposits)
      const allocationsWithWeight = new Map<string, bigint>()

      allocations.forEach((percentage, appId) => {
        const weight = calculateVotingWeightFromPercentage(totalVotingPower, percentage)
        if (weight > 0n) {
          allocationsWithWeight.set(appId, weight)
        }
      })

      // Prepare data for transaction - pass wei values directly as strings
      const appVotes = Array.from(allocationsWithWeight.entries()).map(([appId, weight]) => ({
        appId,
        votesWei: weight.toString(),
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
        <Card.Root
          key={formattedWeight}
          variant="subtle"
          mt="8"
          p={4}
          bg="bg.secondary"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          gap="2">
          <Text textStyle="sm" color="text.subtle">
            {t("You voted with")}
          </Text>
          <Badge
            variant="outline"
            rounded="md"
            size="lg"
            borderWidth="2px"
            borderColor="status.positive.primary"
            color="status.positive.primary"
            px={3}
            py={1}
            textStyle="md">
            <Icon as={Flash} color="status.positive.primary" boxSize="5" />
            {formattedWeight}
          </Badge>
        </Card.Root>
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
          customButton: (
            <Button
              variant="primary"
              alignSelf="center"
              px={8}
              py={2.5}
              textStyle="lg"
              fontWeight="semibold"
              onClick={onSuccess}>
              {t("Back to Home")}
            </Button>
          ),
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
