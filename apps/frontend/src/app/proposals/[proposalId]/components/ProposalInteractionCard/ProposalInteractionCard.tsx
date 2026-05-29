import { Alert, Button, Card, Heading, HStack, Icon, Separator, Skeleton, Text, VStack } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanNumber } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { ethers } from "ethers"
import { Clock, InfoCircle, Reports } from "iconoir-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useAccountPermissions } from "@/api/contracts/account/hooks/useAccountPermissions"
import { useGetProposalDeposits } from "@/api/contracts/governance/hooks/useGetProposalDeposits"
import { useGovernorVotesOnBlock } from "@/api/contracts/governance/hooks/useGovernorVotesOnBlock"
import { useHasVotedInProposals } from "@/api/contracts/governance/hooks/useHasVotedInProposals"
import { useIsDepositReached } from "@/api/contracts/governance/hooks/useIsDepositReached"
import { useIsProposalPaid } from "@/api/contracts/governance/hooks/useIsProposalPaid"
import { useProposalBudget } from "@/api/contracts/governance/hooks/useProposalBudget"
import { useProposalContributors } from "@/api/contracts/governance/hooks/useProposalContributors"
import { useProposalDepositEvent } from "@/api/contracts/governance/hooks/useProposalDepositEvent"
import { useProposalDepositThreshold } from "@/api/contracts/governance/hooks/useProposalDepositThreshold"
import { useProposalDescription } from "@/api/contracts/governance/hooks/useProposalDescription"
import { useProposalEta } from "@/api/contracts/governance/hooks/useProposalEta"
import { useProposalImplementationDiscussion } from "@/api/contracts/governance/hooks/useProposalImplementationDiscussion"
import { useProposalPayee } from "@/api/contracts/governance/hooks/useProposalPayee"
import { useProposalQuorumByType } from "@/api/contracts/governance/hooks/useProposalQuorumByType"
import { useProposalQuorumNumeratorByType } from "@/api/contracts/governance/hooks/useProposalQuorumNumeratorByType"
import { useProposalSnapshot } from "@/api/contracts/governance/hooks/useProposalSnapshot"
import { useProposalTotalVotes } from "@/api/contracts/governance/hooks/useProposalTotalVotes"
import { useProposalUserDeposit } from "@/api/contracts/governance/hooks/useProposalUserDeposit"
import { useSimulateExecuteProposal } from "@/api/contracts/governance/hooks/useSimulateExecuteProposal"
import { useTotalVotesOnBlock } from "@/api/contracts/governance/hooks/useTotalVotesOnBlock"
import { useUserSingleProposalVoteEvent } from "@/api/contracts/governance/hooks/useUserProposalsVoteEvents"
import { useIsDelegatedAtSnapshot } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegatedAtSnapshot"
import { useTreasuryB3trTransferLimit } from "@/api/contracts/treasury/useTreasuryTransferLimit"
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
import { useClaimPayout } from "@/hooks/useClaimPayout"
import { useExecuteProposal } from "@/hooks/useExecuteProposal"
import { useGetVot3UnlockedBalance } from "@/hooks/useGetVot3UnlockedBalance"
import { useMarkProposalCompleted } from "@/hooks/useMarkProposalCompleted"
import { useQueueProposal } from "@/hooks/useQueueProposal"
import { VotingSegment, votingSegmentToProgressBar } from "@/types/voting"

import { MarkInDevelopmentModal } from "../MarkInDevelopmentModal/MarkInDevelopmentModal"
import { ProposalCancelModal } from "../ProposalCancelModal/ProposalCancelModal"
import { ProposalCastVoteModal } from "../ProposalCastVoteModal/ProposalCastVoteModal"
import { ProposalResultsDetailsModal } from "../ProposalResultsDetailsModal/ProposalResultsDetailsModal"
import { ProposalSupportModal } from "../ProposalSupportModal/ProposalSupportModal"
import { UserInteractionBadges } from "../UserInteractionBadges/UserInteractionBadges"

const CANCELLABLE_STATES = [ProposalState.Pending, ProposalState.Succeeded, ProposalState.Queued]

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
  const [isMarkInDevModalOpen, setIsMarkInDevModalOpen] = useState(false)
  const [isEditCommunityExecutionOpen, setIsEditCommunityExecutionOpen] = useState(false)
  const proposalId = proposal?.id ?? ""
  // ===== HOOKS =====
  const { t } = useTranslation()
  const { account } = useWallet()

  // ===== CONTRACT QUERIES =====
  const { data: isDepositReached } = useIsDepositReached(proposalId)
  const { data: userHasAlreadyVotedInProposal } = useHasVotedInProposals([proposalId], account?.address ?? "")
  const { data: userVot3BalanceQueryData } = useGetVot3UnlockedBalance(account?.address)
  const { data: proposalDepositThresholdQueryData } = useProposalDepositThreshold(proposalId)
  const { data: currentDepositAmountQueryData } = useGetProposalDeposits(proposalId)
  const { data: roundSnapshot } = useProposalSnapshot(proposalId)
  const { data: userVot3OnSnapshot } = useGovernorVotesOnBlock(Number(roundSnapshot ?? 0), account?.address ?? "")
  const proposalDepositEvent = useProposalDepositEvent(proposalId)
  const { data: userDeposits } = useProposalUserDeposit(proposalId, account?.address ?? "")
  const { data: proposalQuorumNumerator } = useProposalQuorumNumeratorByType(
    Number(roundSnapshot ?? 0),
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

  const { data: userTotalVotesAtSnapshot } = useTotalVotesOnBlock(
    roundSnapshot ? Number(roundSnapshot) : undefined,
    account?.address,
  )
  const { data: isDelegatedToNavigator } = useIsDelegatedAtSnapshot(account?.address, roundSnapshot)
  const { data: permissions } = useAccountPermissions(account?.address ?? "")

  // ===== CONTRACT TRANSACTION HOOKS =====
  const { sendTransaction: queueProposal } = useQueueProposal({ proposalId })
  const { sendTransaction: executeProposal } = useExecuteProposal({ proposalId })
  const { sendTransaction: markProposalCompleted } = useMarkProposalCompleted({ proposalId })
  const [optimisticPaid, setOptimisticPaid] = useState(false)
  const { sendTransaction: claimPayout } = useClaimPayout({
    proposalId,
    onSuccess: () => setOptimisticPaid(true),
  })

  // V11: per-proposal community-execution data
  const { data: proposalMaxBudget } = useProposalBudget(proposalId)
  const { data: proposalPayee } = useProposalPayee(proposalId)
  const { data: isPaidOnChain } = useIsProposalPaid(proposalId)
  // Treasury per-call B3TR cap: if maxBudget exceeds it, claimPayout would revert.
  // Used below to disable Pay devs so the user doesn't burn gas on a guaranteed revert.
  const { data: treasuryB3trLimit } = useTreasuryB3trTransferLimit()
  const { data: proposalDescription } = useProposalDescription(proposalId)
  const { data: proposalDiscussion } = useProposalImplementationDiscussion(proposalId)
  const { data: proposalContributors } = useProposalContributors(proposalId)
  const isPayeeMember = useMemo(
    () => !!account?.address && !!proposalPayee && compareAddresses(proposalPayee, account.address ?? ""),
    [account?.address, proposalPayee],
  )
  const isProposalPaid = optimisticPaid || !!isPaidOnChain

  // Stable reference for the edit modal's initial values. Without useMemo, the literal object
  // would get a new identity on every render — including every React Query refetch — and the
  // modal's seeding effect would wipe whatever the user has typed.
  const editInitialValues = useMemo(
    () => ({
      payee: proposalPayee ?? "",
      description: proposalDescription ?? "",
      implementationDiscussion: proposalDiscussion ?? "",
      contributors: proposalContributors ?? [],
    }),
    [proposalPayee, proposalDescription, proposalDiscussion, proposalContributors],
  )

  const handleQueueProposal = useCallback(() => queueProposal(), [queueProposal])

  const handleExecuteProposal = useCallback(() => executeProposal(), [executeProposal])

  // V11: marking as InDevelopment always goes through the modal (which collects payees when budget > 0).
  const handleMarkProposalInDevelopment = useCallback(() => {
    setIsMarkInDevModalOpen(true)
  }, [])

  const handleMarkProposalCompleted = useCallback(() => markProposalCompleted(), [markProposalCompleted])

  const handlePayDevs = useCallback(() => claimPayout(), [claimPayout])

  // ===== COMPUTED VALUES =====
  const isProposer = compareAddresses(account?.address ?? "", proposal?.proposerAddress ?? "")
  // Grant proposers cannot support their own grant — only applies to grant-type proposals in support phase.
  const isGrantProposerInSupportPhase =
    isProposer && proposal?.type !== GrantsProposalType.Standard && proposal?.state === ProposalState.Pending
  const currentDepositAmount = BigInt(currentDepositAmountQueryData ?? "0")
  const proposalDepositThreshold = BigInt(proposalDepositThresholdQueryData ?? "0")
  const proposalQuorumBigInt = BigInt(proposalQuorum ?? "0")
  const userVotingPower = Number(userVot3OnSnapshot ?? 0)
  const userDepositedAmount = userTotalVotesAtSnapshot?.depositsVotes ?? "0"
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

  // ===== TIMELOCK COUNTDOWN =====
  const { data: proposalEta } = useProposalEta(proposalId, proposal?.state === ProposalState.Queued)
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000))
  useEffect(() => {
    if (proposal?.state !== ProposalState.Queued) return
    const id = setInterval(() => setNowSeconds(Math.floor(Date.now() / 1000)), 1000)
    return () => clearInterval(id)
  }, [proposal?.state])
  const secondsUntilExecutable = proposalEta ? Math.max(0, proposalEta - nowSeconds) : 0
  const isAwaitingTimelock = isExecutable && !!proposalEta && secondsUntilExecutable > 0

  // Dry-run the execute() once the timelock is clear — surfaces underlying reverts (e.g. Treasury
  // transfer-limit, missing role on a sub-call) so the user doesn't pay gas just to see a revert.
  const { data: simulatedExecution } = useSimulateExecuteProposal({
    proposal,
    caller: account?.address,
    enabled: isExecutable && !isAwaitingTimelock,
  })
  const executeWouldRevert = Boolean(simulatedExecution?.wouldRevert)
  const executeRevertReason = simulatedExecution?.revertReason

  const formattedTimeUntilExecutable = useMemo(() => {
    if (!isAwaitingTimelock) return ""
    const days = Math.floor(secondsUntilExecutable / 86_400)
    const hours = Math.floor((secondsUntilExecutable % 86_400) / 3_600)
    const minutes = Math.floor((secondsUntilExecutable % 3_600) / 60)
    const seconds = secondsUntilExecutable % 60
    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
    if (minutes > 0) return `${minutes}m ${seconds}s`
    return `${seconds}s`
  }, [isAwaitingTimelock, secondsUntilExecutable])

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

    return Math.floor(result)
  }, [currentDepositAmount, proposalDepositThreshold])

  const canMarkInDevelopment = useMemo(() => {
    if (proposal?.type === ProposalType.Grant) return false
    if (proposal?.state !== ProposalState.Executed && proposal?.state !== ProposalState.Succeeded) return false
    // V11: proposer can always mark their own proposal as InDevelopment; admins can also do it.
    return isProposer || hasProposalStateRole
  }, [hasProposalStateRole, isProposer, proposal?.state, proposal?.type])

  const canMarkCompleted = useMemo(() => {
    if (proposal?.type === ProposalType.Grant || !hasProposalStateRole) {
      return false
    }

    return proposal?.state === ProposalState.InDevelopment
  }, [hasProposalStateRole, proposal?.state, proposal?.type])

  // V11: editing payee/description/discussion/contributors is allowed for proposer + admin
  // while the proposal is InDevelopment or Completed and the payout has not been claimed.
  const canEditCommunityExecution = useMemo(() => {
    if (proposal?.type === ProposalType.Grant) return false
    if (proposal?.state !== ProposalState.InDevelopment && proposal?.state !== ProposalState.Completed) return false
    if (isProposalPaid) return false
    return isProposer || hasProposalStateRole
  }, [proposal?.type, proposal?.state, isProposalPaid, isProposer, hasProposalStateRole])

  // V11: Pay devs is visible to admin / proposer / payee when the proposal is Completed
  // and the single payout hasn't been pulled yet.
  const canPayDevs = useMemo(() => {
    if (proposal?.type === ProposalType.Grant) return false
    if (proposal?.state !== ProposalState.Completed) return false
    if (!proposalPayee || proposalPayee.toLowerCase() === ethers.ZeroAddress.toLowerCase()) return false
    if (isProposalPaid) return false
    return hasProposalStateRole || isProposer || isPayeeMember
  }, [hasProposalStateRole, isProposer, isPayeeMember, proposalPayee, isProposalPaid, proposal?.state, proposal?.type])

  // maxBudget is set at proposal creation and cannot be lowered; if it exceeds Treasury's
  // per-call B3TR limit, claimPayout will revert. Disable Pay devs and wait for admins to
  // raise the global limit.
  const payoutExceedsTreasuryLimit = useMemo(() => {
    if (treasuryB3trLimit === undefined || proposalMaxBudget === undefined) return false
    return (proposalMaxBudget as unknown as bigint) > (treasuryB3trLimit as unknown as bigint)
  }, [treasuryB3trLimit, proposalMaxBudget])
  const treasuryB3trLimitFormatted = useMemo(
    () =>
      treasuryB3trLimit !== undefined ? humanNumber(ethers.formatEther(treasuryB3trLimit as unknown as bigint)) : "",
    [treasuryB3trLimit],
  )

  // ===== BUSINESS LOGIC =====
  const canCancelProposal = useMemo(() => {
    if (proposal?.state === undefined) return false
    const isAdmin = permissions?.isAdminOfB3TRGovernor
    // Match the on-chain rule: the proposer can only cancel while still Pending (support phase).
    // Admins can additionally cancel Succeeded or Queued proposals before execution.
    if (isProposer && proposal.state === ProposalState.Pending) return true
    if (isAdmin && CANCELLABLE_STATES.includes(proposal.state)) return true
    return false
  }, [isProposer, permissions?.isAdminOfB3TRGovernor, proposal?.state])

  const shouldShowActionButton = useMemo(() => {
    if (!account?.address) {
      return false
    }

    if (proposal?.state === ProposalState.Active) {
      if (isDelegatedToNavigator) return false
      return !hasUserAlreadyVoted && userVotingPower > 0
    }

    if (proposal?.state === ProposalState.Pending) {
      return !proposalDepositReached && userVot3Balance > 0
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
    isDelegatedToNavigator,
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

    // If it's support phase AND: User has no balance OR Maximum support reached OR user is the grant proposer
    if (proposal?.state === ProposalState.Pending) {
      return userVot3Balance < 1 || proposalDepositReached || isGrantProposerInSupportPhase
    }

    //User has permissions to execute or queue
    if (isExecutable) {
      // Gate the Execute button while the timelock delay hasn't elapsed, or when the simulation
      // tells us the underlying call would revert anyway.
      return !currentUserCanExecute || isAwaitingTimelock || executeWouldRevert
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
    isGrantProposerInSupportPhase,
    isAwaitingTimelock,
    executeWouldRevert,
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
    return proposal?.type === GrantsProposalType.Standard ? "Proposal" : "Grant"
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
                  <Heading>{t("Ends in")}</Heading>
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

            {isDelegatedToNavigator && isVotingPhase && (
              <Alert.Root status="info" py="2" px="3">
                <HStack alignItems="flex-start" gap="2" w="full">
                  <Alert.Indicator boxSize="4" flexShrink={0} mt="0.5">
                    <InfoCircle />
                  </Alert.Indicator>
                  <Text textStyle="sm" fontWeight="medium" color="status.info.strong">
                    {t("You have delegated to a navigator. Your navigator votes on proposals on your behalf.")}
                  </Text>
                </HStack>
              </Alert.Root>
            )}

            {!isDelegatedToNavigator && isVotingPhase && userVotingPower === 0 && Number(userDepositedAmount) > 0 && (
              <Alert.Root status="info" py="2" px="3">
                <HStack alignItems="flex-start" gap="2" w="full">
                  <Alert.Indicator boxSize="4" flexShrink={0} mt="0.5">
                    <InfoCircle />
                  </Alert.Indicator>
                  <Text textStyle="sm" fontWeight="medium" color="status.info.strong">
                    {t(
                      "You have 0 voting power. Your {{amount}} VOT3 tokens were used to support a proposal and count as voting power only for allocation rounds, not for proposals.",
                      { amount: humanNumber(userDepositedAmount) },
                    )}
                  </Text>
                </HStack>
              </Alert.Root>
            )}

            {isGrantProposerInSupportPhase && (
              <Alert.Root status="info" py="2" px="3">
                <HStack alignItems="flex-start" gap="2" w="full">
                  <Alert.Indicator boxSize="4" flexShrink={0} mt="0.5">
                    <InfoCircle />
                  </Alert.Indicator>
                  <Text textStyle="sm" fontWeight="medium" color="status.info.strong">
                    {t("You can't support your own grant proposal.")}
                  </Text>
                </HStack>
              </Alert.Root>
            )}

            {isAwaitingTimelock && (
              <Alert.Root status="info" py="2" px="3">
                <HStack alignItems="flex-start" gap="2" w="full">
                  <Alert.Indicator boxSize="4" flexShrink={0} mt="0.5">
                    <InfoCircle />
                  </Alert.Indicator>
                  <Text textStyle="sm" fontWeight="medium" color="status.info.strong">
                    {t("Available to execute in {{time}}", { time: formattedTimeUntilExecutable })}
                  </Text>
                </HStack>
              </Alert.Root>
            )}

            {isExecutable && !isAwaitingTimelock && executeWouldRevert && (
              <Alert.Root status="error" py="2" px="3">
                <HStack alignItems="flex-start" gap="2" w="full">
                  <Alert.Indicator boxSize="4" flexShrink={0} mt="0.5">
                    <InfoCircle />
                  </Alert.Indicator>
                  <Text textStyle="sm" fontWeight="medium" color="status.negative.strong">
                    {t("Execution would revert: {{reason}}", {
                      reason: executeRevertReason ?? t("unknown error"),
                    })}
                  </Text>
                </HStack>
              </Alert.Root>
            )}

            {canPayDevs && payoutExceedsTreasuryLimit && (
              <Alert.Root status="error" py="2" px="3">
                <HStack alignItems="flex-start" gap="2" w="full">
                  <Alert.Indicator boxSize="4" flexShrink={0} mt="0.5">
                    <InfoCircle />
                  </Alert.Indicator>
                  <Text textStyle="sm" fontWeight="medium" color="status.negative.strong">
                    {t(
                      "Payout exceeds Treasury's per-transfer B3TR limit ({{limit}} B3TR). An admin must raise the Treasury limit before Pay devs can succeed.",
                      { limit: treasuryB3trLimitFormatted },
                    )}
                  </Text>
                </HStack>
              </Alert.Root>
            )}

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
                <Button variant="negative" w="full" flex={1} onClick={handleCancelProposal}>
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
              {canEditCommunityExecution && (
                <Button variant="secondary" w="full" flex={1} onClick={() => setIsEditCommunityExecutionOpen(true)}>
                  {t("Edit details")}
                </Button>
              )}
              {canPayDevs && (
                <Button
                  variant="primary"
                  w="full"
                  flex={1}
                  onClick={handlePayDevs}
                  disabled={payoutExceedsTreasuryLimit}>
                  {t("Pay devs")}
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

      {/* V11: Mark In Development modal — registers the V11 payee + metadata for the first time. */}
      <MarkInDevelopmentModal
        proposalId={proposalId}
        maxBudget={proposalMaxBudget ?? 0n}
        isOpen={isMarkInDevModalOpen}
        onClose={() => setIsMarkInDevModalOpen(false)}
      />

      {/* V11: Edit development details modal — same form, but routes through updateCommunityExecution. */}
      <MarkInDevelopmentModal
        proposalId={proposalId}
        maxBudget={proposalMaxBudget ?? 0n}
        isOpen={isEditCommunityExecutionOpen}
        onClose={() => setIsEditCommunityExecutionOpen(false)}
        isEdit
        initialValues={editInitialValues}
      />
    </>
  )
}
