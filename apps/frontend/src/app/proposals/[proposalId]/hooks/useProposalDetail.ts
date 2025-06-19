import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useWallet } from "@vechain/vechain-kit"
import { toIPFSURL } from "@/utils"
import { useIpfsMetadata } from "@/api/ipfs"
import {
  useProposalCreatedEvent,
  ProposalState,
  useProposalState,
  useProposalVoteDates,
  useProposalUserDeposit,
  useIsDepositReached,
  useIsProposalQuorumReached,
  useProposalDepositEvent,
  useProposalSnapshotVotingPower,
  useProposalSnapshot,
  useGetVotesOnBlock,
  ProposalMetadata,
  useProposalQuorum,
  useProposalQueuedEvent,
  useProposalExecutedEvent,
  useProposalCanceledEvent,
  useProposalVotesIndexer,
} from "@/api"
import { ethers } from "ethers"
import dayjs from "dayjs"

export const useProposalDetailById = (proposalId: string) => {
  const { account } = useWallet()
  const proposalState = useProposalState(proposalId)
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const proposalCanceledEvent = useProposalCanceledEvent(proposalId)
  const proposalQueuedEvent = useProposalQueuedEvent(proposalId)
  const proposalExecutedEvent = useProposalExecutedEvent(proposalId)
  const proposalDepositEvent = useProposalDepositEvent(proposalId)
  const proposalUserDeposit = useProposalUserDeposit(proposalId, account?.address || "")
  const proposalSnapshot = useProposalSnapshot(proposalId)
  const proposalSnapshotBlock = useMemo(() => Number(proposalSnapshot.data), [proposalSnapshot.data])
  const isDepositReached = useIsDepositReached(proposalId)
  const isProposalActive = useMemo(() => proposalState?.data === ProposalState.Active, [proposalState?.data])
  const proposalQuorum = useProposalQuorum(proposalSnapshotBlock)
  const isQuorumReached = useIsProposalQuorumReached(proposalId)
  const proposalSnapshotVotingPower = useProposalSnapshotVotingPower(proposalSnapshotBlock, isProposalActive)
  const { data: proposalVotes, isLoading: isVotesLoading } = useProposalVotesIndexer({ proposalId })
  const proposalSnapshotVot3 = useGetVotesOnBlock(
    proposalSnapshotBlock,
    account?.address ?? undefined,
    isProposalActive,
  )

  const roundIdVoteStart = useMemo(
    () => proposalCreatedEvent.data?.roundIdVoteStart,
    [proposalCreatedEvent.data?.roundIdVoteStart],
  )

  const proposalCanceledDate = useMemo(() => {
    if (!proposalCanceledEvent.data?.blockMeta.blockTimestamp) {
      return undefined
    }
    return dayjs.unix(proposalCanceledEvent.data?.blockMeta.blockTimestamp)
  }, [proposalCanceledEvent.data?.blockMeta.blockTimestamp])
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
      proposalCreatedEvent,
      proposalCanceledEvent,
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
      proposalCreatedEvent,
      proposalCanceledEvent,
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
    let forVotes,
      againstVotes,
      abstainVotes,
      totalVotingPowerUsedInVotes,
      forPercentage,
      againstPercentage,
      abstainPercentage
    if (proposalVotes) {
      forVotes = proposalVotes.votes.for.totalWeight
      againstVotes = proposalVotes.votes.against.totalWeight
      abstainVotes = proposalVotes.votes.abstain.totalWeight
      totalVotingPowerUsedInVotes = proposalVotes.totalPower
      forPercentage = proposalVotes.votes.for.percentage
      againstPercentage = proposalVotes.votes.against.percentage
      abstainPercentage = proposalVotes.votes.abstain.percentage
    }

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
    const userVotingPowerOnSnapshot = ethers.formatEther(BigInt(proposalSnapshotVotingPower.data || 0))
    const userVot3OnSnapshot = proposalSnapshotVot3.data ?? "0"
    const result = {
      id: proposalId,
      proposalCanceledDate,
      title: proposalMetadata.data?.title || "",
      isTitleLoading: proposalCreatedEvent.isLoading || proposalMetadata.isLoading,
      description: proposalMetadata.data?.shortDescription || "",
      type: (proposalCreatedEvent.data?.targets.length ?? 0) >= 1 ? "on-chain" : "text",
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
      totalVotingPowerUsedInVotes,
      forVotes,
      againstVotes,
      abstainVotes,
      forPercentage,
      againstPercentage,
      abstainPercentage,
      userVotingPowerOnSnapshot,
      isUserVotingPowerOnSnapshotLoading: proposalSnapshotVotingPower.isLoading,
      userVot3OnSnapshot,
      isUserVot3OnSnapshotLoading: proposalSnapshotVot3.isLoading,
      snapshotVotesQuery: proposalSnapshotVot3,
      isVotesLoading,
      isQuorumReached: isQuorumReached.data,
      isQuorumReachedLoading: isQuorumReached.isLoading,
      quorum: proposalQuorum.data || 0,
      quorumQuery: proposalQuorum,
      isQuorumLoading: proposalQuorum.isLoading,
      votingStartBlock,
      votingEndBlock,
      proposalVotesQuery: proposalVotes,
    }

    const mock = {}

    return { ...result, ...mock }
  }, [
    proposalCanceledDate,
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
    isVotesLoading,
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
