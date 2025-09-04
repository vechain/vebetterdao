import {
  useGetProposalDeposits,
  useGetVotesOnBlock,
  useProposalVotes,
  useHasVotedInProposals,
  useIsDepositReached,
  useProposalDepositThreshold,
  useProposalQuorumByType,
  useProposalSnapshot,
  useProposalUserDeposit,
} from "@/api"
import { CountdownBoxes, MulticolorBar, ResultsDisplay } from "@/components"
import { useGetVot3Balance, useProposalVot3Deposit } from "@/hooks"
import { ProposalEnriched, ProposalState, ProposalType as GrantsProposalType } from "@/hooks/proposals/grants/types"
import { Box, Button, Card, Heading, HStack, Icon, Separator, Skeleton, Text } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaHeart, FaRegHeart } from "react-icons/fa"
import { FiBarChart2 } from "react-icons/fi"
import { TbClockHour8 } from "react-icons/tb"
import { ProposalCastVoteModal } from "../ProposalCastVoteModal/ProposalCastVoteModal"
import { ProposalResultsDetailsModal } from "../ProposalResultsDetailsModal/ProposalResultsDetailsModal"
import { UilCircle, UilThumbsDown, UilThumbsUp } from "@iconscout/react-unicons"

type Props = {
  proposal?: ProposalEnriched
  isVotingPhase: boolean
  daysLeft: number
  hoursLeft: number
  minutesLeft: number
  isLoading: boolean
}

export const ProposalInteractionCard = ({
  proposal,
  isVotingPhase,
  daysLeft,
  hoursLeft,
  minutesLeft,
  isLoading,
}: Props) => {
  // ===== STATE =====
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false)

  // ===== HOOKS =====
  const { t } = useTranslation()
  const { sendTransaction } = useProposalVot3Deposit({ proposalId: proposal?.id ?? "" })
  const { account } = useWallet()

  // ===== CONTRACT QUERIES =====
  const { data: isDepositReached } = useIsDepositReached(proposal?.id ?? "")
  const { data: userHasAlreadyVotedInProposal } = useHasVotedInProposals([proposal?.id ?? ""])
  const { data: userVot3BalanceQueryData } = useGetVot3Balance(account?.address)
  const { data: proposalDepositThresholdQueryData } = useProposalDepositThreshold(proposal?.id ?? "")
  const { data: currentDepositAmountQueryData } = useGetProposalDeposits(proposal?.id ?? "")
  const { data: roundSnapshot } = useProposalSnapshot(proposal?.id ?? "")
  const { data: userVot3OnSnapshot } = useGetVotesOnBlock(Number(roundSnapshot ?? 0), account?.address ?? "")
  const { data: userDeposits } = useProposalUserDeposit(proposal?.id ?? "", account?.address ?? "")
  const { data: proposalQuorum } = useProposalQuorumByType(
    Number(roundSnapshot ?? 0),
    proposal?.type ?? GrantsProposalType.Standard,
  )
  const { data: proposalVotesQueryData } = useProposalVotes(proposal?.id ?? "")

  // ===== COMPUTED VALUES =====
  const currentDepositAmount = BigInt(currentDepositAmountQueryData ?? "0")
  const proposalDepositThreshold = BigInt(proposalDepositThresholdQueryData ?? "0")
  const proposalQuorumBigInt = BigInt(proposalQuorum ?? "0")
  const userVotingPower = Number(userVot3OnSnapshot ?? 0)
  const hasUserAlreadyVoted = userHasAlreadyVotedInProposal?.[proposal?.id ?? ""] ?? false
  const userVot3Balance = Number(userVot3BalanceQueryData?.original ?? 0)
  const proposalDepositReached = isDepositReached ?? false

  const percentageSupported = useMemo(() => {
    if (currentDepositAmount === 0n) return "0"
    if (proposalDepositThreshold === 0n) return "0"

    // Convert to numbers for percentage calculation (safe since we're dividing)
    const current = Number(ethers.formatEther(currentDepositAmount))
    const threshold = Number(ethers.formatEther(proposalDepositThreshold))

    return ((current / threshold) * 100).toFixed(0)
  }, [currentDepositAmount, proposalDepositThreshold])

  // ===== BUSINESS LOGIC =====
  const shouldShowActionButton = useMemo(() => {
    if (proposal?.state === ProposalState.Active) {
      return !hasUserAlreadyVoted && userVotingPower > 0
    }

    if (proposal?.state === ProposalState.Pending) {
      return !proposalDepositReached && userVot3Balance > 0
    }

    return false
  }, [proposal?.state, isLoading, proposalDepositReached, hasUserAlreadyVoted, userVot3Balance, userVotingPower])

  const isActionButtonDisabled = useMemo(() => {
    const disabledStates = [ProposalState.Canceled, ProposalState.Defeated, ProposalState.DepositNotMet]

    // If proposal is canceled, always disable action button
    if (disabledStates.includes(proposal?.state ?? ProposalState.Pending)) {
      return true
    }

    // If it's voting phase AND: User has voted OR User cannot vote
    if (isVotingPhase) {
      return hasUserAlreadyVoted || userVotingPower === 0
    }

    // If it's support phase AND: User has no balance OR Maximum support reached
    if (!isVotingPhase) {
      return userVot3Balance < 1 || proposalDepositReached
    }

    return false
  }, [proposal?.state, isVotingPhase, hasUserAlreadyVoted, userVotingPower, userVot3Balance, proposalDepositReached])

  const progressBarSegments = useMemo(() => {
    if (proposal?.state === ProposalState.Pending) {
      return [
        {
          percentage: Number(percentageSupported ?? 0),
          color: "success.primary",
          icon: userDeposits ? FaHeart : FaRegHeart,
        },
      ]
    }

    return [
      {
        percentage: Number(proposalVotesQueryData?.forPercentage ?? 0),
        color: "success.primary",
        icon: UilThumbsUp,
      },
      {
        percentage: Number(proposalVotesQueryData?.abstainPercentage ?? 0),
        color: "warning.primary",
        icon: UilCircle,
      },
      {
        percentage: Number(proposalVotesQueryData?.againstPercentage ?? 0),
        color: "error.primary",
        icon: UilThumbsDown,
      },
    ]
  }, [percentageSupported, proposalVotesQueryData])

  const supportWith100Vot3 = useCallback(() => {
    sendTransaction({ amount: ethers.parseEther("3000").toString(), proposalId: proposal?.id ?? "" })
  }, [sendTransaction, proposal?.id])

  // ===== MODAL DATA =====
  const proposalTotalVotes = proposalVotesQueryData?.totalVotes
    ? ethers.parseEther(proposalVotesQueryData.totalVotes.toString())
    : 0n

  // Utility function to format BigInt to string with max 1 decimal and no negatives
  const formatTokenAmount = (amount: bigint): string => {
    if (amount <= 0n) return "0"
    const formatted = ethers.formatEther(amount)
    const num = parseFloat(formatted)
    return num.toFixed(1)
  }

  // Utility function to calculate difference between two BigInt values, capped at 0
  const calculateAmountLeft = (target: bigint, current: bigint): string => {
    if (current >= target) return "0"
    return formatTokenAmount(target - current)
  }

  // Calculate values based on current phase
  const totalAmountNeeded = isVotingPhase
    ? formatTokenAmount(proposalQuorumBigInt)
    : formatTokenAmount(proposalDepositThreshold)

  const amountLeftToReach = isVotingPhase
    ? calculateAmountLeft(proposalQuorumBigInt, proposalTotalVotes)
    : calculateAmountLeft(proposalDepositThreshold, currentDepositAmount)
  const resultsDetails = useMemo(() => {
    const detailsArray = []

    // Both phases show total amount needed and amount left to reach
    detailsArray.push({
      label: t("Total amount needed"),
      value: t("{{amount}} VOT3", { amount: totalAmountNeeded }),
    })

    detailsArray.push({
      label: t("Amount left to reach"),
      value: t("{{amount}} VOT3", { amount: amountLeftToReach }),
    })

    return detailsArray
  }, [t, totalAmountNeeded, amountLeftToReach])

  return (
    <>
      {/* ===== MAIN CARD ===== */}
      <Skeleton loading={isLoading}>
        <Card.Root variant="baseWithBorder">
          {/* Card Header - Countdown Timer */}
          <Card.Header as={HStack}>
            <Icon as={TbClockHour8} boxSize={5} />
            <Card.Title>
              <Heading>{t("Ends in")}</Heading>
            </Card.Title>
          </Card.Header>

          <Card.Body gap={4}>
            {/* Countdown Display */}
            <CountdownBoxes days={daysLeft} hours={hoursLeft} minutes={minutesLeft} />

            <Separator />

            {/* Results Section Header */}
            <HStack justify="space-between">
              <HStack>
                <Icon as={FiBarChart2} boxSize={5} />
                <Heading>{t("Results")}</Heading>
              </HStack>
              <Button variant="primaryGhost" onClick={() => setIsResultsModalOpen(true)}>
                {t("Details")}
              </Button>
            </HStack>

            {/* Progress Bar */}
            <MulticolorBar segments={progressBarSegments} />

            {/* Results Display */}
            <ResultsDisplay
              segments={progressBarSegments}
              tokenAmount={BigInt(0)} // Not shown in main card
              showTokenAmount={false}
            />

            {/* User Support Badge */}
            {userDeposits && (
              <HStack>
                <Text color="gray.600">{t("You supported with")}</Text>
                <Box border="2px solid" borderColor="success.primary" color="success.primary" borderRadius="lg">
                  <HStack gap={2} px="12px" py="8px">
                    <Icon as={FaHeart} boxSize={5} color="success.primary" />
                    <Text>{t("{{amount}} VOT3", { amount: ethers.formatEther(userDeposits) })}</Text>
                  </HStack>
                </Box>
              </HStack>
            )}

            {/* Action Button */}
            {shouldShowActionButton && (
              <Button
                variant="primaryAction"
                onClick={isVotingPhase ? () => setIsVoteModalOpen(true) : supportWith100Vot3}
                disabled={isActionButtonDisabled}>
                {isVotingPhase ? t("Vote") : t("Support")}
              </Button>
            )}
          </Card.Body>
        </Card.Root>
      </Skeleton>

      {/* ===== RESULTS MODAL ===== */}
      <ProposalResultsDetailsModal
        isResultsModalOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        progressBarSegments={progressBarSegments}
        userDeposits={userDeposits ?? BigInt(0)}
        proposalDepositThreshold={proposalDepositThreshold}
        resultsDetails={resultsDetails}
        isVotingPhase={isVotingPhase}
      />

      {/* ===== VOTE MODAL ===== */}
      <ProposalCastVoteModal
        isVoteModalOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        proposalId={proposal?.id ?? ""}
      />
    </>
  )
}
