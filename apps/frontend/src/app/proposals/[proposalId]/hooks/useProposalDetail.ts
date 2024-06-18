import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useWallet } from "@vechain/dapp-kit-react"
import { toIPFSURL } from "@/utils"
import { useIpfsMetadata } from "@/api/ipfs"
import {
  useProposalCreatedEvent,
  ProposalState,
  useProposalState,
  useProposalVotes,
  useProposalVoteDates,
  useProposalUserDeposit,
  useIsDepositReached,
  useIsProposalQuorumReached,
  useProposalDepositEvent,
  useProposalVoteEvent,
  useProposalSnapshotVotingPower,
  useProposalSnapshot,
  useGetVotesOnBlock,
  ProposalMetadata,
  useProposalQuorum,
  useProposalQueuedEvent,
  useProposalExecutedEvent,
} from "@/api"
import { ethers } from "ethers"

export const useProposalDetailById = (proposalId: string) => {
  const { account } = useWallet()
  const proposalState = useProposalState(proposalId)
  const proposalVoteEvents = useProposalVoteEvent(proposalId)
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const proposalQueuedEvent = useProposalQueuedEvent(proposalId)
  const proposalExecutedEvent = useProposalExecutedEvent(proposalId)
  const proposalDepositEvent = useProposalDepositEvent(proposalId)
  const proposalUserDeposit = useProposalUserDeposit(proposalId, account || "")
  const proposalSnapshot = useProposalSnapshot(proposalId)
  const proposalSnapshotBlock = useMemo(() => Number(proposalSnapshot.data), [proposalSnapshot.data])
  const isDepositReached = useIsDepositReached(proposalId)
  const isProposalActive = useMemo(() => proposalState?.data === ProposalState.Active, [proposalState?.data])
  const isProposalNotPending = useMemo(() => proposalState?.data !== ProposalState.Pending, [proposalState?.data])
  const proposalQuorum = useProposalQuorum(proposalSnapshotBlock, isProposalActive)
  const isQuorumReached = useIsProposalQuorumReached(proposalId, isProposalActive)
  const proposalSnapshotVotingPower = useProposalSnapshotVotingPower(proposalSnapshotBlock, isProposalActive)
  const proposalVotes = useProposalVotes(proposalId, isProposalNotPending)
  const proposalSnapshotVot3 = useGetVotesOnBlock(proposalSnapshotBlock, account ?? undefined, isProposalActive)

  const roundIdVoteStart = useMemo(
    () => proposalCreatedEvent.data?.roundIdVoteStart,
    [proposalCreatedEvent.data?.roundIdVoteStart],
  )
  const metadataUri = useMemo(() => {
    if (!proposalCreatedEvent.data?.description) {
      return undefined
    }
    return toIPFSURL(proposalCreatedEvent.data?.description)
  }, [proposalCreatedEvent.data?.description])

  const proposalMetadata = useIpfsMetadata<ProposalMetadata>(metadataUri)

  const calls = useMemo(
    () => [
      proposalState,
      proposalVotes,
      proposalVoteEvents,
      proposalCreatedEvent,
      proposalDepositEvent,
      proposalUserDeposit,
      isDepositReached,
      isQuorumReached,
      proposalSnapshotVotingPower,
      proposalSnapshotVot3,
      proposalQuorum,
      proposalMetadata,
    ],
    [
      proposalState,
      proposalVotes,
      proposalVoteEvents,
      proposalCreatedEvent,
      proposalDepositEvent,
      proposalUserDeposit,
      isDepositReached,
      isQuorumReached,
      proposalSnapshotVotingPower,
      proposalSnapshotVot3,
      proposalQuorum,
      proposalMetadata,
    ],
  )

  const {
    votingStartDate,
    votingStartBlock,
    isVotingStartDateLoading,
    votingEndBlock,
    votingEndDate,
    isVotingEndDateLoading,
  } = useProposalVoteDates(proposalId)

  const proposal = useMemo(() => {
    const userVote = proposalVoteEvents.userVote
    const votes = proposalVoteEvents.votes
    const votesWithComment = proposalVoteEvents.votesWithComment
    const hasUserVoted = proposalVoteEvents.hasUserVoted
    const totalVot3UsedInVotes = Number(ethers.formatEther(BigInt(proposalVoteEvents.totalVot3UsedInVotes || 0)))
    const totalVotingPowerUsedInVotes = Number(
      ethers.formatEther(BigInt(proposalVoteEvents.totalVotingPowerUsedInVotes || 0)),
    )
    const forVotes = Number(proposalVotes.data?.forVotes || "0")
    const againstVotes = Number(proposalVotes.data?.againstVotes || "0")
    const abstainVotes = Number(proposalVotes.data?.abstainVotes || "0")
    const forPercentage = (totalVotingPowerUsedInVotes ? forVotes / totalVotingPowerUsedInVotes : 0) * 100
    const againstPercentage = (totalVotingPowerUsedInVotes ? againstVotes / totalVotingPowerUsedInVotes : 0) * 100
    const abstainPercentage = (totalVotingPowerUsedInVotes ? abstainVotes / totalVotingPowerUsedInVotes : 0) * 100
    const depositThreshold = Number(ethers.formatEther(BigInt(proposalCreatedEvent.data?.depositThreshold || 0)))
    const communityDeposits = proposalDepositEvent.communityDeposits
    const communityDepositPercentage = communityDeposits / depositThreshold
    const communityDepositChartPercentage = Math.min(communityDepositPercentage || 0, 1) * 100
    const userSupportLeft = Number(ethers.formatEther(BigInt(proposalUserDeposit?.data || 0)))
    const isUserSupportLeft = userSupportLeft > 0
    const userSupport = proposalDepositEvent.userSupport
    const userSupportPercentage = userSupport / communityDeposits
    const othersSupport = proposalDepositEvent.othersSupport
    const othersSupportPercentage = othersSupport / depositThreshold
    const othersSupportChartPercentage =
      communityDepositPercentage > 1 ? (othersSupport / communityDeposits) * 100 : othersSupportPercentage * 100
    const hasUserSupported = proposalDepositEvent.hasUserSupported
    const supportingUserCount = proposalDepositEvent.supportingUserCount
    const othersSupportUserCount = proposalDepositEvent.othersSupportUserCount
    const userVotingPowerOnSnapshot = ethers.formatEther(proposalSnapshotVotingPower.data || 0)
    const userVot3OnSnapshot = proposalSnapshotVot3.data ?? "0"
    const quorumPercentage = totalVot3UsedInVotes ? totalVot3UsedInVotes / Number(proposalQuorum.data) : 0
    const quorumChartPercentage = Math.min(quorumPercentage || 0, 1) * 100
    const result = {
      id: proposalId,
      title: proposalMetadata.data?.title || "",
      isTitleLoading: proposalCreatedEvent.isLoading || proposalMetadata.isLoading,
      description: proposalMetadata.data?.shortDescription || "",
      isDescriptionLoading: proposalCreatedEvent.isLoading || proposalMetadata.isLoading,
      proposer: proposalCreatedEvent.data?.proposer || "",
      isProposerLoading: proposalCreatedEvent.isLoading,
      roundIdVoteStart,
      isRoundIdVoteStartLoading: proposalCreatedEvent.isLoading,
      proposalCreationDate: proposalCreatedEvent?.data
        ? new Date(proposalCreatedEvent?.data.blockMeta.blockTimestamp * 1000).getTime()
        : undefined,
      proposalQueuedDate: proposalQueuedEvent?.data
        ? new Date(proposalQueuedEvent?.data.blockMeta.blockTimestamp * 1000).getTime()
        : undefined,
      proposalExecutedDate: proposalExecutedEvent?.data
        ? new Date(proposalExecutedEvent?.data.blockMeta.blockTimestamp * 1000).getTime()
        : undefined,
      votingStartDate,
      isVotingStartDateLoading,
      votingEndDate,
      isVotingEndDateLoading,
      depositThreshold,
      isDepositThresholdLoading: proposalCreatedEvent.isLoading,
      communityDeposits,
      isCommunityDepositsLoading: proposalDepositEvent.isLoading,
      communityDepositPercentage,
      communityDepositChartPercentage,
      isCommunityDepositPercentageLoading: proposalDepositEvent.isLoading || proposalCreatedEvent.isLoading,
      isDepositReached: isDepositReached.data,
      isDepositReachedLoading: isDepositReached.isLoading,
      isUserSupportLeft,
      userSupport,
      isYourSupportLoading: proposalUserDeposit.isLoading,
      userSupportPercentage,
      othersSupport,
      isOthersSupportLoading: proposalDepositEvent.isLoading || proposalUserDeposit.isLoading,
      othersSupportPercentage,
      othersSupportChartPercentage,
      supportingUserCount,
      isSupportinUserCountLoading: proposalDepositEvent.isLoading,
      hasUserSupported,
      othersSupportUserCount,
      state: proposalState.data,
      isStateLoading: proposalState.isLoading,
      totalVot3UsedInVotes,
      totalVotingPowerUsedInVotes,
      forVotes,
      againstVotes,
      abstainVotes,
      forPercentage,
      againstPercentage,
      abstainPercentage,
      votes,
      votesWithComment,
      userVote,
      hasUserVoted,
      userVotingPowerOnSnapshot,
      isUserVotingPowerOnSnapshotLoading: proposalSnapshotVotingPower.isLoading,
      userVot3OnSnapshot,
      isUserVot3OnSnapshotLoading: proposalSnapshotVot3.isLoading,
      snapshotVotesQuery: proposalSnapshotVot3,
      isVotesLoading: proposalVotes.isLoading,
      isQuorumReached: isQuorumReached.data,
      isQuorumReachedLoading: isQuorumReached.isLoading,
      quorum: proposalQuorum.data || 0,
      quorumQuery: proposalQuorum,
      isQuorumLoading: proposalQuorum.isLoading,
      quorumPercentage,
      quorumChartPercentage,
      votingStartBlock,
      votingEndBlock,
      proposalVotesQuery: proposalVotes,
    }

    const mock = {}

    return { ...result, ...mock }
  }, [
    proposalVoteEvents,
    proposalVotes,
    proposalCreatedEvent,
    proposalUserDeposit,
    proposalDepositEvent,
    proposalSnapshotVotingPower,
    proposalSnapshotVot3,
    proposalQuorum,
    proposalId,
    proposalMetadata,
    roundIdVoteStart,
    proposalQueuedEvent,
    proposalExecutedEvent,
    votingStartDate,
    isVotingStartDateLoading,
    votingEndDate,
    isVotingEndDateLoading,
    isDepositReached,
    proposalState,
    isQuorumReached,
    votingStartBlock,
    votingEndBlock,
  ])

  const error = useMemo(() => calls.find(call => call.error)?.error || null, [calls])
  if (error) {
    console.error("error", error)
  }

  return {
    proposal,
  }
}

export const useProposalDetail = () => {
  const { proposalId } = useParams<{ proposalId: string }>()
  return useProposalDetailById(proposalId)
}
