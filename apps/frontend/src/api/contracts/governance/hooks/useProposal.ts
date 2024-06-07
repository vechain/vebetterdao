import { useCallback, useMemo } from "react"
import { useProposalCreatedEvent } from "./useProposalCreatedEvent"
import { ProposalState, useProposalState } from "./useProposalState"
import { useProposalVotes } from "./useProposalVotes"
import { useParams } from "next/navigation"
import { useProposalDeposits } from "./useGetProposalDeposit"
import { useProposalVoteDates } from "./useProposalVoteDates"
import { useProposalUserDeposit } from "./useProposalUserDeposit"
import { useWallet } from "@vechain/dapp-kit-react"
import { useIsDepositReached } from "./useIsDepositReached"
import { useIsProposalQuorumReached } from "./useIsProposalQuorumReached"
import { useProposalDepositEvent } from "./useProposalDepositEvent"
import { scaleNumberDown } from "@repo/utils/FormattingUtils"
import { useVot3PastSupply, useVot3TokenDetails } from "../../vot3"
import { useProposalVoteEvent } from "./useProposalVoteEvent"
import { useProposalSnapshotVotingPower } from "./useProposalSnapshotVotingPower"
import { useProposalSnapshot } from "./useProposalSnapshot"
import { useGetVotesOnBlock } from "./useVotesOnBlock"

export const useProposal = (proposalId: string) => {
  const { account } = useWallet()
  const proposalState = useProposalState(proposalId)
  const proposalVoteEvents = useProposalVoteEvent(proposalId)
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const proposalDepositEvent = useProposalDepositEvent(proposalId)
  const proposalDeposits = useProposalDeposits(proposalId)
  const proposalUserDeposit = useProposalUserDeposit(proposalId, account || "")
  const proposalSnapshot = useProposalSnapshot(proposalId)
  const proposalSnapshotBlock = useMemo(() => {
    return Number(proposalSnapshot.data)
  }, [proposalSnapshot.data])
  const isDepositReached = useIsDepositReached(proposalId)
  const isProposalActive = useMemo(() => {
    return proposalState?.data === ProposalState.Active
  }, [proposalState?.data])
  const isQuorumReached = useIsProposalQuorumReached(proposalId, isProposalActive)
  const proposalVotes = useProposalVotes(proposalId, isProposalActive)
  const proposalSnapshotVotingPower = useProposalSnapshotVotingPower(proposalSnapshotBlock, isProposalActive)
  const proposalSnapshotVot3 = useGetVotesOnBlock(proposalSnapshotBlock, account ?? undefined, isProposalActive)
  const vot3Token = useVot3TokenDetails()
  const roundIdVoteStart = useMemo(() => {
    return proposalCreatedEvent.data?.roundIdVoteStart
  }, [proposalCreatedEvent.data?.roundIdVoteStart])

  const calls = [
    proposalState,
    proposalVotes,
    proposalVoteEvents,
    proposalCreatedEvent,
    proposalDepositEvent,
    proposalDeposits,
    proposalUserDeposit,
    isDepositReached,
    isQuorumReached,
    proposalSnapshotVotingPower,
    proposalSnapshotVot3,
  ]

  const { votingStartDate, isVotingStartDateLoading, votingEndDate, isVotingEndDateLoading } =
    useProposalVoteDates(proposalId)

  const scaleVot3Amount = useCallback(
    (amount?: string | number) => {
      return scaleNumberDown(amount || 0, vot3Token.data?.decimals || 18, vot3Token.data?.decimals || 18)
    },
    [vot3Token.data?.decimals],
  )

  const proposal = useMemo(() => {
    const userVote = proposalVoteEvents.userVote
    const hasUserVoted = proposalVoteEvents.hasUserVoted
    const forVotes = Number(proposalVotes.data?.forVotes || "0")
    const againstVotes = Number(proposalVotes.data?.againstVotes || "0")
    const abstainVotes = Number(proposalVotes.data?.abstainVotes || "0")
    const totalVotes = forVotes + againstVotes + abstainVotes
    const forPercentage = (totalVotes ? forVotes / totalVotes : 0) * 100
    const againstPercentage = (totalVotes ? againstVotes / totalVotes : 0) * 100
    const abstainPercentage = (totalVotes ? abstainVotes / totalVotes : 0) * 100
    const depositThreshold = scaleVot3Amount(proposalCreatedEvent.data?.depositThreshold)
    const communityDeposits = scaleVot3Amount(proposalDeposits?.data)
    const communityDepositPercentage = Number(communityDeposits) / Number(depositThreshold)
    const communityDepositChartPercentage = Math.min(communityDepositPercentage || 0, 1) * 100
    const userSupport = scaleVot3Amount(proposalUserDeposit?.data)
    const userSupportPercentage = Number(userSupport) / Number(communityDeposits)
    const othersSupport = Number(communityDeposits) - Number(userSupport)
    const othersSupportPercentage = othersSupport / Number(depositThreshold)
    const othersSupportChartPercentage =
      communityDepositPercentage > 0 ? (othersSupport / Number(communityDeposits)) * 100 : othersSupportPercentage * 100
    const hasUserSupported = Number(userSupport) > 0
    const supportingUserCount = proposalDepositEvent.supportingUserCount
    const othersSupportUserCount = hasUserSupported
      ? Math.max(Number(supportingUserCount) - 1, 0)
      : Number(supportingUserCount)
    const userVotingPowerOnSnapshot = scaleVot3Amount(proposalSnapshotVotingPower.data)
    const userVot3OnSnapshot = proposalSnapshotVot3.data?.scaled ?? "0"

    const result = {
      id: proposalId,
      title: proposalCreatedEvent.data?.description,
      isTitleLoading: proposalCreatedEvent.isLoading,
      description: proposalCreatedEvent.data?.description, // TODO: get the right description
      isDescriptionLoading: proposalCreatedEvent.isLoading,
      proposer: proposalCreatedEvent.data?.proposer || "",
      isProposerLoading: proposalCreatedEvent.isLoading,
      roundIdVoteStart,
      isRoundIdVoteStartLoading: proposalCreatedEvent.isLoading,
      votingStartDate,
      isVotingStartDateLoading,
      votingEndDate,
      isVotingEndDateLoading,
      depositThreshold,
      isDepositThresholdLoading: proposalCreatedEvent.isLoading,
      communityDeposits,
      isCommunityDepositsLoading: proposalDeposits.isLoading,
      communityDepositPercentage,
      communityDepositChartPercentage,
      isCommunityDepositPercentageLoading: proposalDeposits.isLoading || proposalCreatedEvent.isLoading,
      isDepositReached: isDepositReached.data,
      isDepositReachedLoading: isDepositReached.isLoading,
      userSupport,
      isYourSupportLoading: proposalUserDeposit.isLoading,
      userSupportPercentage,
      othersSupport,
      isOthersSupportLoading: proposalDeposits.isLoading || proposalUserDeposit.isLoading,
      othersSupportPercentage,
      othersSupportChartPercentage,
      supportingUserCount,
      isSupportinUserCountLoading: proposalDepositEvent.isLoading,
      hasUserSupported,
      othersSupportUserCount,
      state: proposalState.data,
      isStateLoading: proposalState.isLoading,
      forVotes,
      againstVotes,
      abstainVotes,
      totalVotes,
      forPercentage,
      againstPercentage,
      abstainPercentage,
      userVote,
      hasUserVoted,
      userVotingPowerOnSnapshot,
      isUserVotingPowerOnSnapshotLoading: proposalSnapshotVotingPower.isLoading,
      userVot3OnSnapshot,
      isUserVot3OnSnapshotLoading: proposalSnapshotVot3.isLoading,
      isVotesLoading: proposalVotes.isLoading,
      isQuorumReached: isQuorumReached.data,
      isQuorumReachedLoading: isQuorumReached.isLoading,
    }

    const mock = {}

    return { ...result, ...mock }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...calls, votingStartDate, isVotingStartDateLoading, votingEndDate, isVotingEndDateLoading])

  const error = useMemo(
    () => calls.find(call => call.error)?.error || null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...calls],
  )

  return {
    proposalState,
    proposalVotes,
    proposalCreatedEvent,
    proposalDeposits,
    proposal,
    error,
  }
}

export const useCurrentProposal = () => {
  const { proposalId } = useParams<{ proposalId: string }>()
  return useProposal(proposalId)
}
