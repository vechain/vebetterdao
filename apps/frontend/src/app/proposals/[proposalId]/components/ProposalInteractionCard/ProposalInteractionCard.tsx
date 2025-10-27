import { Button, Card, Heading, HStack, Icon, Separator, Skeleton, VStack } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { Clock, Reports } from "iconoir-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAccountPermissions } from "@/api/contracts/account/hooks/useAccountPermissions"
import { useGetProposalDeposits } from "@/api/contracts/governance/hooks/useGetProposalDeposits"
import { useHasVotedInProposals } from "@/api/contracts/governance/hooks/useHasVotedInProposals"
import { useIsDepositReached } from "@/api/contracts/governance/hooks/useIsDepositReached"
import { useProposalDepositEvent } from "@/api/contracts/governance/hooks/useProposalDepositEvent"
import { useProposalDepositThreshold } from "@/api/contracts/governance/hooks/useProposalDepositThreshold"
import { useProposalQuorumByType } from "@/api/contracts/governance/hooks/useProposalQuorumByType"
import { useProposalQuorumNumeratorByType } from "@/api/contracts/governance/hooks/useProposalQuorumNumeratorByType"
import { useProposalSnapshot } from "@/api/contracts/governance/hooks/useProposalSnapshot"
import { useProposalTotalVotes } from "@/api/contracts/governance/hooks/useProposalTotalVotes"
import { useProposalUserDeposit } from "@/api/contracts/governance/hooks/useProposalUserDeposit"
import { useUserSingleProposalVoteEvent } from "@/api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { useGetVotesOnBlock } from "@/api/contracts/governance/hooks/useVotesOnBlock"
import { useVot3PastSupply } from "@/api/contracts/vot3/hooks/useVot3PastTotalSupply"
import { useProposalVotes } from "@/api/indexer/proposals/useProposalVotes"
import { CountdownBoxes } from "@/components/CountdownBoxes/CountdownBoxes"
import AbstainIcon from "@/components/Icons/svg/abstain.svg"
import HeartSolidIcon from "@/components/Icons/svg/heart-solid.svg"
import HeartIcon from "@/components/Icons/svg/heart.svg"
import ThumbsDownIcon from "@/components/Icons/svg/thumbs-down.svg"
import ThumbsUpIcon from "@/components/Icons/svg/thumbs-up.svg"
import { MulticolorBar } from "@/components/MulticolorBar/MulticolorBar"
import { ResultsDisplay } from "@/components/Proposal/ResultsDisplay"
import {
  ProposalType as GrantsProposalType,
  ProposalEnriched,
  ProposalState,
  ProposalType,
} from "@/hooks/proposals/grants/types"
import { useExecuteProposal } from "@/hooks/useExecuteProposal"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"
import { useMarkProposalCompleted } from "@/hooks/useMarkProposalCompleted"
import { useMarkProposalInDevelopment } from "@/hooks/useMarkProposalInDevelopment"
import { useQueueProposal } from "@/hooks/useQueueProposal"
import { VotingSegment, votingSegmentToProgressBar } from "@/types/voting"

import { ProposalCancelModal } from "../ProposalCancelModal/ProposalCancelModal"
import { ProposalCastVoteModal } from "../ProposalCastVoteModal/ProposalCastVoteModal"
import { ProposalResultsDetailsModal } from "../ProposalResultsDetailsModal/ProposalResultsDetailsModal"
import { ProposalSupportModal } from "../ProposalSupportModal/ProposalSupportModal"
import { UserInteractionBadges } from "../UserInteractionBadges/UserInteractionBadges"

export const ProposalInteractionCard = ({
  proposal,
  isVotingPhase,
  daysLeft,
  hoursLeft,
  minutesLeft,
  isLoading,
}: {
  proposal?: ProposalEnriched
  isVotingPhase: boolean
  daysLeft: number
  hoursLeft: number
  minutesLeft: number
  isLoading: boolean
}) => {
  // ===== STATE =====
  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false)
  const [isVoteModalOpen, setIsVoteModalOpen] = useState(false)
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
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
  const proposalDepositEvent = useProposalDepositEvent(proposalId)
  const { data: userDeposits } = useProposalUserDeposit(proposalId, account?.address ?? "")
  const { data: proposalQuorumNumerator } = useProposalQuorumNumeratorByType(
    proposal?.type ?? GrantsProposalType.Standard,
  )
  const { data: proposalQuorum } = useProposalQuorumByType(
    Number(roundSnapshot ?? 0),
    proposal?.type ?? GrantsProposalType.Standard,
  )
  const { data: votesAtSnapshotQueryData } = useVot3PastSupply(Number(roundSnapshot ?? 0))
  const { data: proposalVotesQueryData } = useProposalVotes(proposalId)
  const { data: proposalTotalVotesQueryData } = useProposalTotalVotes(proposalId)
  const { data: userVoteEvent } = useUserSingleProposalVoteEvent(proposalId)

  const { data: permissions } = useAccountPermissions(account?.address ?? "")

  // ===== CONTRACT TRANSACTION HOOKS =====
  const { sendTransaction: queueProposal } = useQueueProposal({ proposalId })
  const { sendTransaction: executeProposal } = useExecuteProposal({ proposalId })
  const { sendTransaction: markProposalInDevelopment } = useMarkProposalInDevelopment({ proposalId })
  const { sendTransaction: markProposalCompleted } = useMarkProposalCompleted({ proposalId })

  const handleQueueProposal = useCallback(() => queueProposal(), [queueProposal])

  const handleExecuteProposal = useCallback(() => executeProposal(), [executeProposal])

  const handleMarkProposalInDevelopment = useCallback(() => markProposalInDevelopment(), [markProposalInDevelopment])

  const handleMarkProposalCompleted = useCallback(() => markProposalCompleted(), [markProposalCompleted])

  // ===== COMPUTED VALUES =====
  const isProposer = compareAddresses(account?.address ?? "", proposal?.proposerAddress ?? "")
  const currentDepositAmount = BigInt(currentDepositAmountQueryData ?? "0")
  const proposalDepositThreshold = BigInt(proposalDepositThresholdQueryData ?? "0")
  const proposalQuorumBigInt = BigInt(proposalQuorum ?? "0")
  const userVotingPower = Number(userVot3OnSnapshot ?? 0)
  const hasUserAlreadyVoted = userHasAlreadyVotedInProposal?.[proposalId] ?? false
  const userVot3Balance = Number(userVot3BalanceQueryData?.original ?? 0)
  const proposalDepositReached = isDepositReached ?? false
  const currentUserCanExecute = permissions?.isProposalExecutor ?? false
  const proposalHasTargets = proposal?.targets && proposal?.targets.length > 0
  const userVoteOption = userVoteEvent?.userVote
  const totalVotesAtSnapshot = votesAtSnapshotQueryData ?? ethers.formatEther("0")
  const hasProposalStateRole = permissions?.isProposalStateManager ?? false
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

    const result = (current / threshold) * 100

    if (result < 1 && result > 0) {
      return result.toFixed(2)
    }

    return result.toFixed(0)
  }, [currentDepositAmount, proposalDepositThreshold])

  const canMarkInDevelopment = useMemo(() => {
    if (proposal?.type === ProposalType.Grant || !hasProposalStateRole) {
      return false
    }

    return proposal?.state === ProposalState.Executed || proposal?.state === ProposalState.Succeeded
  }, [hasProposalStateRole, proposal?.state, proposal?.type])

  const canMarkCompleted = useMemo(() => {
    if (proposal?.type === ProposalType.Grant || !hasProposalStateRole) {
      return false
    }

    return proposal?.state === ProposalState.InDevelopment
  }, [hasProposalStateRole, proposal?.state, proposal?.type])

  // ===== BUSINESS LOGIC =====
  const canCancelProposal = useMemo(() => {
    if (proposal?.state !== ProposalState.Pending) return false
    const isAdmin = permissions?.isAdminOfB3TRGovernor
    //Proposal is pending, and either the proposer or the account is the admin
    return proposal?.state === ProposalState.Pending && (isProposer || isAdmin)
  }, [isProposer, permissions?.isAdminOfB3TRGovernor, proposal?.state])

  const shouldShowActionButton = useMemo(() => {
    if (!account?.address) {
      return false
    }

    if (proposal?.state === ProposalState.Active) {
      return !hasUserAlreadyVoted && userVotingPower > 0
    }

    if (proposal?.state === ProposalState.Pending) {
      return !proposalDepositReached && userVot3Balance > 0 && !isProposer
    }

    //User has permissions to execute or queue
    if (isQueuable || isExecutable) {
      return isQueuable || currentUserCanExecute
    }

    return false
  }, [
    account?.address,
    proposal?.state,
    isQueuable,
    isExecutable,
    currentUserCanExecute,
    hasUserAlreadyVoted,
    userVotingPower,
    proposalDepositReached,
    userVot3Balance,
    isProposer,
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
    if (isExecutable) {
      return !currentUserCanExecute
    }

    return false
  }, [
    proposal?.state,
    isExecutable,
    hasUserAlreadyVoted,
    userVotingPower,
    userVot3Balance,
    proposalDepositReached,
    currentUserCanExecute,
  ])

  // ===== VOTING DATA PROCESSING =====
  const votingSegments: VotingSegment[] = useMemo(() => {
    if (!proposalVotesQueryData?.votes) return []

    return [
      {
        option: "Approve",
        voters: proposalVotesQueryData.votes.for?.voters ?? 0,
        votingPower: proposalVotesQueryData.votes.for?.totalWeight ?? BigInt(0),
        totalWeight: proposalVotesQueryData.votes.for?.totalWeight ?? BigInt(0),
        percentage: proposalVotesQueryData.votes.for?.percentagePower ?? 0,
        percentagePower: proposalVotesQueryData.votes.for?.percentagePower ?? 0,
        color: "status.positive.primary",
        icon: ThumbsUpIcon,
      },
      {
        option: "Abstain",
        voters: proposalVotesQueryData.votes.abstain?.voters ?? 0,
        votingPower: proposalVotesQueryData.votes.abstain?.totalWeight ?? BigInt(0),
        totalWeight: proposalVotesQueryData.votes.abstain?.totalWeight ?? BigInt(0),
        percentage: proposalVotesQueryData.votes.abstain?.percentagePower ?? 0,
        percentagePower: proposalVotesQueryData.votes.abstain?.percentagePower ?? 0,
        color: "status.warning.primary",
        icon: AbstainIcon,
      },
      {
        option: "Against",
        voters: proposalVotesQueryData.votes.against?.voters ?? 0,
        votingPower: proposalVotesQueryData.votes.against?.totalWeight ?? BigInt(0),
        totalWeight: proposalVotesQueryData.votes.against?.totalWeight ?? BigInt(0),
        percentage: proposalVotesQueryData.votes.against?.percentagePower ?? 0,
        percentagePower: proposalVotesQueryData.votes.against?.percentagePower ?? 0,
        color: "status.negative.primary",
        icon: ThumbsDownIcon,
      },
    ]
  }, [proposalVotesQueryData?.votes])

  const progressBarSegments = useMemo(() => {
    if (
      proposal?.state === ProposalState.Pending ||
      proposal?.state === ProposalState.DepositNotMet ||
      proposal?.state === ProposalState.Canceled
    ) {
      return [
        {
          percentage: Number(percentageSupported ?? 0),
          color: "status.positive.primary",
          icon: userDeposits ? HeartSolidIcon : HeartIcon,
        },
      ]
    }

    return votingSegments.map(votingSegmentToProgressBar)
  }, [proposal?.state, votingSegments, percentageSupported, userDeposits])

  // ===== ACTION HANDLERS =====
  const handleVoteAction = useCallback(() => {
    setIsVoteModalOpen(true)
  }, [])

  const handleSupportAction = useCallback(() => {
    setIsSupportModalOpen(true)
  }, [])

  const handleCancelProposal = useCallback(() => {
    setIsCancelModalOpen(true)
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

  const proposalTypeText = useMemo(() => {
    return proposal?.type === GrantsProposalType.Standard ? "Grant" : "Proposal"
  }, [proposal?.type])

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

  const handleCloseSupportModal = useCallback(() => {
    setIsSupportModalOpen(false)
  }, [])

  const showCountdownBoxes = useMemo(() => {
    const disabledStates = [
      ProposalState.Canceled,
      ProposalState.Defeated,
      ProposalState.DepositNotMet,
      ProposalState.Succeeded,
      ProposalState.Queued,
      ProposalState.Executed,
    ]

    return !disabledStates.includes(proposal?.state ?? ProposalState.Pending)
  }, [proposal?.state])

  return (
    <>
      <Skeleton loading={isLoading}>
        <Card.Root gap={"0"} variant="primary">
          <Card.Body gap="8">
            {showCountdownBoxes && (
              <>
                <HStack>
                  <Icon as={Clock} boxSize={5} />
                  <Card.Title p={0} gap={0}>
                    <Heading>{t("Ends in")}</Heading>
                  </Card.Title>
                </HStack>
                {/* Countdown Display */}
                <CountdownBoxes days={daysLeft} hours={hoursLeft} minutes={minutesLeft} />
                <Separator />
              </>
            )}

            <VStack w="full" gap="6" align={"stretch"}>
              <HStack justify="space-between">
                <HStack>
                  <Icon as={Reports} boxSize={5} />
                  <Heading>{t("Results")}</Heading>
                </HStack>
                <Button variant="link" onClick={() => setIsResultsModalOpen(true)}>
                  {t("Details")}
                </Button>
              </HStack>
              {/* Progress Bar and Results Display */}
              <VStack gap="4">
                <MulticolorBar segments={progressBarSegments} />
                <ResultsDisplay proposalId={proposalId} segments={progressBarSegments} />
              </VStack>
              {/* User Interaction Badges */}
              <UserInteractionBadges
                proposalState={proposal?.state ?? ProposalState.Pending}
                userDeposits={userDeposits}
                userVoteOption={userVoteOption}
              />
            </VStack>

            <HStack w="full" gap={4}>
              {/* Action Button */}
              {shouldShowActionButton && (
                <Button
                  variant="primary"
                  w="full"
                  flex={1}
                  onClick={handleButtonClick}
                  disabled={isActionButtonDisabled}>
                  {getButtonText()}
                </Button>
              )}
              {canCancelProposal && (
                <Button variant="secondary" w="full" flex={1} onClick={handleCancelProposal}>
                  {t("Cancel {{proposalType}}", {
                    proposalType: proposalTypeText,
                  })}
                </Button>
              )}
              {canMarkInDevelopment && (
                <Button variant="secondary" w="full" flex={1} onClick={handleMarkProposalInDevelopment}>
                  {t("Mark as in development")}
                </Button>
              )}
              {canMarkCompleted && (
                <Button variant="secondary" w="full" flex={1} onClick={handleMarkProposalCompleted}>
                  {t("Mark as completed")}
                </Button>
              )}
            </HStack>
          </Card.Body>
        </Card.Root>
      </Skeleton>

      {/* ===== RESULTS MODAL ===== */}
      <ProposalResultsDetailsModal
        isResultsModalOpen={isResultsModalOpen}
        onClose={() => setIsResultsModalOpen(false)}
        progressBarSegments={progressBarSegments}
        votingSegments={votingSegments}
        userDeposits={userDeposits ?? BigInt(0)}
        totalVotesAtSnapshot={totalVotesAtSnapshot}
        proposalState={proposal?.state ?? ProposalState.Pending}
        proposalId={proposalId}
        proposalQuorum={proposalQuorumBigInt}
        proposalQuorumNumerator={proposalQuorumNumerator ?? BigInt(0)}
        proposalTotalVotes={proposalTotalVotes}
        proposalVotesData={proposalVotesQueryData}
        proposalSupportAmount={currentDepositAmount}
        totalSupporters={proposalDepositEvent?.supportingUserCount ?? 0}
        proposalSupportThreshold={proposalDepositThreshold}
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

      {/* Cancel Modal */}
      <ProposalCancelModal
        proposalId={proposalId}
        isOpen={isCancelModalOpen}
        proposalTypeText={proposalTypeText}
        onClose={() => setIsCancelModalOpen(false)}
      />
    </>
  )
}
