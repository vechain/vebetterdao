import { Badge, Button, Card, Icon, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { Flash } from "iconoir-react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { parseEther } from "viem"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { useCastAllocationVotes } from "@/hooks/useCastAllocationVotes"
import { useEnableAutoVotingAndVote } from "@/hooks/useEnableAutoVoting"
import { calculateVotingWeightFromPercentage } from "@/utils/MathUtils/MathUtils"

interface UseAllocationVotingProps {
  roundId: string
  onSuccess: () => void
  isAutoVotingEnabled?: boolean
}

/**
 * Custom hook to manage allocation voting flow with dynamic transaction modal UI
 * Handles:
 * - Vote confirmation logic with dynamic UI
 * - Direct transaction submission with custom UI
 * - Auto-voting setup flow (when isAutoVotingEnabled is true)
 */
export const useAllocationVoting = ({ roundId, onSuccess, isAutoVotingEnabled = false }: UseAllocationVotingProps) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  // Get user's voting power at snapshot
  const { votesAtSnapshot } = useVotingPowerAtSnapshot()

  const castAllocationVotes = useCastAllocationVotes({
    roundId,
  })

  const enableAutoVotingAndVote = useEnableAutoVotingAndVote()

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

      // Extract app IDs and weights
      const appIds = Array.from(allocationsWithWeight.keys())
      const voteWeights = Array.from(allocationsWithWeight.values())

      // Calculate total voting weight for display in modal
      const totalVotingWeight = voteWeights.reduce((sum, weight) => sum + Number(ethers.formatEther(weight)), 0)

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

      if (isAutoVotingEnabled) {
        // Auto-voting flow: enable auto-voting AND cast vote in same transaction
        const customUI = {
          pending: {
            title: t("Waiting for confirmation..."),
            description: votingWeightDescription,
          },
          waitingConfirmation: {
            title: t("Enabling automation and submitting vote..."),
            description: votingWeightDescription,
          },
          success: {
            title: t("Automation enabled & vote submitted!"),
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
        }

        // Call transaction directly with custom UI
        if (account?.address) {
          enableAutoVotingAndVote.sendTransaction(
            {
              roundId,
              appIds,
              voteWeights,
              userAddress: account.address,
            },
            customUI,
          )
        }
      } else {
        // Manual voting flow: just cast vote
        // Prepare data for transaction - pass wei values directly as strings
        const appVotes = Array.from(allocationsWithWeight.entries()).map(([appId, weight]) => ({
          appId,
          votesWei: weight.toString(),
        }))

        // Create custom UI with dynamic voting weight
        const customUI = {
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
        }

        // Call transaction directly with custom UI
        castAllocationVotes.sendTransaction(appVotes, customUI)
      }
    },
    [
      t,
      votesAtSnapshot,
      onSuccess,
      isAutoVotingEnabled,
      account?.address,
      roundId,
      castAllocationVotes.sendTransaction,
      enableAutoVotingAndVote.sendTransaction,
    ],
  )

  return {
    handleConfirmVote,
    isVoting:
      castAllocationVotes.status === "pending" ||
      castAllocationVotes.status === "waitingConfirmation" ||
      enableAutoVotingAndVote.status === "pending" ||
      enableAutoVotingAndVote.status === "waitingConfirmation",
  }
}
