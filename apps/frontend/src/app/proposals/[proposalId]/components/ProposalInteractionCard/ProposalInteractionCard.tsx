import {
  useGetProposalDeposits,
  useGetVotesOnBlock,
  useHasVotedInProposals,
  useIsDepositReached,
  useProposalDepositThreshold,
  useProposalQuorumByType,
  useProposalSnapshot,
  useProposalTotalVotes,
  useProposalUserDeposit,
  useProposalVotes,
} from "@/api"
import { useAccountPermissions } from "@/api/contracts/account/hooks/useAccountPermissions"
import { CountdownBoxes, MulticolorBar, ResultsDisplay } from "@/components"
import AbstainIcon from "@/components/Icons/svg/abstain.svg"
import HeartSolidIcon from "@/components/Icons/svg/heart-solid.svg"
import HeartIcon from "@/components/Icons/svg/heart.svg"
import ThumbsDownIcon from "@/components/Icons/svg/thumbs-down.svg"
import ThumbsUpIcon from "@/components/Icons/svg/thumbs-up.svg"
import {
  ProposalType as GrantsProposalType,
  ProposalEnriched,
  ProposalState,
  useExecuteProposal,
  useGetVot3Balance,
  useQueueProposal,
} from "@/hooks"
import { Box, Button, Card, Heading, HStack, Icon, Separator, Skeleton, Text } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiBarChart2 } from "react-icons/fi"
import { TbClockHour8 } from "react-icons/tb"

import { ProposalCastVoteModal } from "../ProposalCastVoteModal/ProposalCastVoteModal"
import { ProposalResultsDetailsModal } from "../ProposalResultsDetailsModal/ProposalResultsDetailsModal"
import { ProposalSupportModal } from "../ProposalSupportModal/ProposalSupportModal"

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
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)

  const proposalId = proposal?.id ?? ""
  // ===== HOOKS =====
  const { t } = useTranslation()
  const { account } = useWallet()

  // ===== CONTRACT QUERIES =====
  const { data: isDepositReached } = useIsDepositReached(proposalId)
  const { data: userHasAlreadyVotedInProposal } = useHasVotedInProposals([proposalId], account?.address ?? "")
  const { data: userVot3BalanceQueryData } = useGetVot3Balance(account?.address)
  const { data: proposalDepositThresholdQueryData } = useProposalDepositThreshold(proposalId)
  const { data: currentDepositAmountQueryData } = useGetProposalDeposits(proposalId)
  const { data: roundSnapshot } = useProposalSnapshot(proposalId)
  const { data: userVot3OnSnapshot } = useGetVotesOnBlock(Number(roundSnapshot ?? 0), account?.address ?? "")
  const { data: userDeposits } = useProposalUserDeposit(proposalId, account?.address ?? "")
  const { data: proposalQuorum } = useProposalQuorumByType(
    Number(roundSnapshot ?? 0),
    proposal?.type ?? GrantsProposalType.Standard,
  )
  const { data: proposalVotesQueryData } = useProposalVotes(proposalId)
  const { data: proposalTotalVotesQueryData } = useProposalTotalVotes(proposalId)

  const { data: permissions } = useAccountPermissions(account?.address ?? "")

  // ===== CONTRACT TRANSACTION HOOKS =====
  const { sendTransaction: queueProposal } = useQueueProposal({ proposalId })
  const { sendTransaction: executeProposal } = useExecuteProposal({ proposalId })

  const handleQueueProposal = useCallback(() => queueProposal(), [queueProposal])

  const handleExecuteProposal = useCallback(() => executeProposal(), [executeProposal])

  // ===== COMPUTED VALUES =====
  const currentDepositAmount = BigInt(currentDepositAmountQueryData ?? "0")
  const proposalDepositThreshold = BigInt(proposalDepositThresholdQueryData ?? "0")
  const proposalQuorumBigInt = BigInt(proposalQuorum ?? "0")
  const userVotingPower = Number(userVot3OnSnapshot ?? 0)
  const hasUserAlreadyVoted = userHasAlreadyVotedInProposal?.[proposalId] ?? false
  const userVot3Balance = Number(userVot3BalanceQueryData?.original ?? 0)
  const proposalDepositReached = isDepositReached ?? false
  const currentUserCanQueueOrExecute = permissions?.isProposalExecutor ?? false
  const proposalHasTargets = proposal?.targets && proposal?.targets.length > 0
  // Check if the proposal is queuable and executable
  const isQueuable = useMemo(() => {
    return proposal?.state === ProposalState.Succeeded && proposalHasTargets
  }, [proposal?.state, proposalHasTargets])

  const isExecutable = useMemo(() => {
    return proposal?.state === ProposalState.Queued && proposalHasTargets
  }, [proposal?.state, proposalHasTargets])

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
    if (!account?.address) {
      return false
    }

    if (proposal?.state === ProposalState.Active) {
      return !hasUserAlreadyVoted && userVotingPower > 0
    }

    if (proposal?.state === ProposalState.Pending) {
      return (
        !proposalDepositReached &&
        userVot3Balance > 0 &&
        !compareAddresses(account?.address ?? "", proposal?.proposerAddress ?? "")
      )
    }

    //User has permissions to execute or queue
    if ((isQueuable || isExecutable) && currentUserCanQueueOrExecute) {
      return isQueuable || isExecutable
    }

    return false
  }, [
    proposal?.state,
    isQueuable,
    isExecutable,
    hasUserAlreadyVoted,
    userVotingPower,
    proposalDepositReached,
    userVot3Balance,
    currentUserCanQueueOrExecute,
    account?.address,
    proposal?.proposerAddress,
  ])

  const isActionButtonDisabled = useMemo(() => {
    const disabledStates = [ProposalState.Canceled, ProposalState.Defeated, ProposalState.DepositNotMet]

    // If proposal is canceled, always disable action button
    if (disabledStates.includes(proposal?.state ?? ProposalState.Pending)) {
      return true
    }

    // If it's voting phase AND: User has voted OR User cannot vote
    if (proposal?.state === ProposalState.Active) {
      return hasUserAlreadyVoted || userVotingPower === 0
    }

    // If it's support phase AND: User has no balance OR Maximum support reached
    if (proposal?.state === ProposalState.Pending) {
      return userVot3Balance < 1 || proposalDepositReached
    }

    //User has permissions to execute or queue
    if (isQueuable || isExecutable) {
      return !currentUserCanQueueOrExecute
    }

    return false
  }, [
    proposal?.state,
    isQueuable,
    isExecutable,
    hasUserAlreadyVoted,
    userVotingPower,
    userVot3Balance,
    proposalDepositReached,
    currentUserCanQueueOrExecute,
  ])

  const progressBarSegments = useMemo(() => {
    if (proposal?.state === ProposalState.Pending || proposal?.state === ProposalState.DepositNotMet) {
      return [
        {
          percentage: Number(percentageSupported ?? 0),
          color: "success.primary",
          icon: userDeposits ? HeartSolidIcon : HeartIcon,
        },
      ]
    }

    return [
      {
        percentage: Number(proposalVotesQueryData?.votes?.for?.percentage ?? 0),
        color: "success.primary",
        icon: ThumbsUpIcon,
      },
      {
        percentage: Number(proposalVotesQueryData?.votes?.abstain?.percentage ?? 0),
        color: "warning.primary",
        icon: AbstainIcon,
      },
      {
        percentage: Number(proposalVotesQueryData?.votes?.against?.percentage ?? 0),
        color: "error.primary",
        icon: ThumbsDownIcon,
      },
    ]
  }, [
    proposal?.state,
    proposalVotesQueryData?.votes?.for,
    proposalVotesQueryData?.votes?.abstain,
    proposalVotesQueryData?.votes?.against,
    percentageSupported,
    userDeposits,
  ])

  // ===== ACTION HANDLERS =====
  const handleVoteAction = useCallback(() => {
    setIsVoteModalOpen(true)
  }, [])

  const handleSupportAction = useCallback(() => {
    setIsSupportModalOpen(true)
  }, [])

  const getButtonAction = useCallback(() => {
    if (isExecutable) return handleExecuteProposal
    if (isQueuable) return handleQueueProposal
    if (isVotingPhase && !hasUserAlreadyVoted && userVotingPower > 0) return handleVoteAction
    if (!isVotingPhase && !proposalDepositReached && userVot3Balance > 0) return handleSupportAction
    return
  }, [
    isExecutable,
    handleExecuteProposal,
    isQueuable,
    handleQueueProposal,
    isVotingPhase,
    hasUserAlreadyVoted,
    userVotingPower,
    handleVoteAction,
    proposalDepositReached,
    userVot3Balance,
    handleSupportAction,
  ])

  const getButtonText = useCallback(() => {
    if (isExecutable) return t("Execute Proposal")
    if (isQueuable) return t("Queue Proposal")
    if (isVotingPhase) return t("Vote")
    return t("Support")
  }, [isExecutable, isQueuable, isVotingPhase, t])

  const handleButtonClick = useCallback(() => {
    const action = getButtonAction()
    action?.()
  }, [getButtonAction])

  // ===== MODAL DATA =====
  const proposalTotalVotes = proposalTotalVotesQueryData
    ? ethers.parseEther(proposalTotalVotesQueryData.toString())
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
    if (isVotingPhase) {
      detailsArray.push({
        label: t("Wallets voted"),
        value: String(proposalVotesQueryData?.totalVoters ?? 0),
      })
    }

    return detailsArray
  }, [t, totalAmountNeeded, amountLeftToReach, isVotingPhase, proposalVotesQueryData])

  const handleCloseSupportModal = useCallback(() => {
    setIsSupportModalOpen(false)
  }, [])

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
              proposalId={proposalId}
              segments={progressBarSegments}
              tokenAmount={BigInt(0)} // Not shown in main card
              showTokenAmount={false}
            />

            {/* User Support Badge */}
            {userDeposits && proposal?.state === ProposalState.Pending ? (
              <HStack>
                <Text color="gray.600">{t("You supported with")}</Text>
                <Box border="2px solid" borderColor="success.primary" color="success.primary" borderRadius="lg">
                  <HStack gap={2} px="12px" py="8px">
                    <Icon as={HeartIcon} boxSize={5} color="success.primary" />
                    <Text>{t("{{amount}} VOT3", { amount: Number(ethers.formatEther(userDeposits)).toFixed(1) })}</Text>
                  </HStack>
                </Box>
              </HStack>
            ) : null}

            {/* Action Button */}
            {shouldShowActionButton && (
              <Button variant="primaryAction" onClick={handleButtonClick} disabled={isActionButtonDisabled}>
                {getButtonText()}
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
        proposalId={proposalId}
      />

      {/* ===== VOTE MODAL ===== */}
      <ProposalCastVoteModal
        isVoteModalOpen={isVoteModalOpen}
        onClose={() => setIsVoteModalOpen(false)}
        proposalId={proposalId}
      />

      {/* ===== SUPPORT MODAL ===== */}
      <ProposalSupportModal
        isSupportModalOpen={isSupportModalOpen}
        onClose={handleCloseSupportModal}
        proposalId={proposalId}
        votingRoundId={Number(proposal?.votingRoundId ?? 0)}
        proposalThreshold={proposalDepositThreshold}
        proposalDeposits={currentDepositAmount}
      />
    </>
  )
}
