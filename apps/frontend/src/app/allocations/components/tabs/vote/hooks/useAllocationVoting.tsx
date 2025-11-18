import { Badge, Button, Card, Icon, Text } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { Flash } from "iconoir-react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { parseEther } from "viem"

import { useVotingPowerAtSnapshot } from "@/api/contracts/governance/hooks/useVotingPowerAtSnapshot"
import { useHasVotedInRound } from "@/api/contracts/xAllocations/hooks/useHasVotedInRound"
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

  const { votesAtSnapshot } = useVotingPowerAtSnapshot()
  const { data: hasVoted } = useHasVotedInRound(roundId, account?.address ?? undefined)
  const castAllocationVotes = useCastAllocationVotes({
    roundId,
  })
  const enableAutoVotingAndVote = useEnableAutoVotingAndVote({ roundId })

  const createVotingWeightDescription = useCallback(
    (formattedVotingWeight: string) => (
      <Card.Root
        key={formattedVotingWeight}
        variant="subtle"
        mt="4"
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
          {formattedVotingWeight}
        </Badge>
      </Card.Root>
    ),
    [t],
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
        customButton: (
          <Button
            variant="primary"
            alignSelf="center"
            px={8}
            py={2.5}
            textStyle="lg"
            fontWeight="semibold"
            onClick={onSuccess}>
            {t("Back to Allocation")}
          </Button>
        ),
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

      if (isAutoVotingEnabled) {
        // Auto-voting flow: enable auto-voting AND cast vote in same transaction
        const waitingTitle = hasVoted ? t("Enabling automation...") : t("Enabling automation and submitting vote...")
        const successTitle = hasVoted ? t("Automation enabled!") : t("Automation enabled & vote submitted!")
        const customUI = createCustomUI(votingWeightDescription, waitingTitle, successTitle)

        // Call transaction directly with custom UI
        if (account?.address) {
          enableAutoVotingAndVote.sendTransaction(
            {
              roundId,
              appIds,
              voteWeights,
              userAddress: account.address,
              hasVoted: hasVoted ?? false,
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

        const customUI = createCustomUI(
          votingWeightDescription,
          t("Sending transaction..."),
          t("Vote successfully submitted!"),
        )

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
      hasVoted,
      createVotingWeightDescription,
      createCustomUI,
      castAllocationVotes,
      enableAutoVotingAndVote,
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
