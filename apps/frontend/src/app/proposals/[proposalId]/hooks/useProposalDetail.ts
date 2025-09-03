import { useMemo } from "react"
import { useParams } from "next/navigation"
import { useWallet } from "@vechain/vechain-kit"

import {
  useProposalVoteDates,
  useProposalUserDeposit,
  useIsDepositReached,
  useIsProposalQuorumReached,
  useProposalDepositEvent,
  useProposalSnapshotVotingPower,
  useProposalSnapshot,
  useGetVotesOnBlock,
  useProposalQuorum,
  useProposalQueuedEvent,
  useProposalExecutedEvent,
  useProposalCanceledEvent,
  useProposalVotesIndexer,
} from "@/api"
import { ethers } from "ethers"
import dayjs from "dayjs"
import {
  ProposalState,
  GrantProposalEnriched,
  ProposalEnriched,
  GovernanceType,
  ProposalType,
} from "@/hooks/proposals/grants/types"
import { useProposalEnrichedById } from "@/hooks/proposals/common/useProposalEnrichedById"
import { UseQueryResult } from "@tanstack/react-query"
import { getGrantProposalMetadataOrReturnDefault } from "@/hooks/proposals/grants/useStandardOrGrantProposalDetails"
import { ParsedProposalVotesResponse } from "@/api/indexer/proposals/useProposalVotesIndexer"

export type FormattedProposalDetailData = {
  // Blocks timelines ( To Blocks )
  votingStartBlock: string | undefined
  votingEndBlock: string | undefined

  // Formatted timelines ( To Date )
  proposalQueuedDate: number | undefined
  proposalExecutedDate: number | undefined
  votingStartDate: number
  votingEndDate: number
  proposalCanceledDate: dayjs.Dayjs | undefined

  // Deposits informations data
  missingSupport: string
  communityDeposits: number
  communityDepositPercentage: number
  communityDepositChartPercentage: number
  isDepositReached: boolean | undefined
  isUserSupportLeft: boolean
  userSupport: number
  othersSupport: number
  othersSupportPercentage: number
  othersSupportChartPercentage: number
  supportingUserCount: number
  hasUserSupported: boolean
  othersSupportUserCount: number

  // Votes information data
  totalVotingPowerUsedInVotes: bigint | undefined
  forVotes: string | undefined
  againstVotes: string | undefined
  abstainVotes: string | undefined
  forPercentage: number | undefined
  againstPercentage: number | undefined
  abstainPercentage: number | undefined
  userVotingPowerOnSnapshot: string
  userVot3OnSnapshot: string
  snapshotVotesQuery: UseQueryResult<string, unknown>
  isQuorumReached: boolean | undefined
  quorum: string
  quorumQuery: UseQueryResult<string, unknown>
  proposalVotesQuery: ParsedProposalVotesResponse | undefined

  // LOADING STATES
  isStateLoading: boolean
  isDescriptionLoading: boolean
  isRoundIdVoteStartLoading: boolean
  isDepositThresholdLoading: boolean
  isProposerLoading: boolean
  isTitleLoading: boolean
  isVotingStartDateLoading: boolean
  isVotingEndDateLoading: boolean
  isCommunityDepositsLoading: boolean
  isCommunityDepositPercentageLoading: boolean
  isYourSupportLoading: boolean
  isOthersSupportLoading: boolean
  isSupportinUserCountLoading: boolean
  isUserVotingPowerOnSnapshotLoading: boolean
  isUserVot3OnSnapshotLoading: boolean
  isQuorumReachedLoading: boolean
  isQuorumLoading: boolean
  isVotesLoading: boolean

  // Standard proposal information
  governanceType: GovernanceType
}

export type ProposalDetailData = {
  proposal: (GrantProposalEnriched | ProposalEnriched) & FormattedProposalDetailData
}

// If it is a grant proposal, we narrow to Grant type
export const isGrantProposal = (
  proposal: ProposalEnriched | (GrantProposalEnriched & FormattedProposalDetailData),
): proposal is GrantProposalEnriched & FormattedProposalDetailData => {
  return proposal.type === ProposalType.Grant
}

export const isStandardProposal = (
  proposal: ProposalEnriched | (GrantProposalEnriched & FormattedProposalDetailData),
): proposal is ProposalEnriched & FormattedProposalDetailData => {
  return proposal.type === ProposalType.Standard
}

export const useProposalDetailById = (proposalId: string): ProposalDetailData => {
  const { account } = useWallet()
  const proposalEnriched = useProposalEnrichedById(proposalId)

  const proposalState = proposalEnriched?.proposal?.state
  const proposalType = proposalEnriched.type
  const isProposalEnrichedLoading = proposalEnriched?.isLoading
  const proposalCanceledEvent = useProposalCanceledEvent(proposalId) // ok shared with grant
  const proposalQueuedEvent = useProposalQueuedEvent(proposalId) // ok shared with grant
  const proposalExecutedEvent = useProposalExecutedEvent(proposalId) // ok shared with grant
  const proposalDepositEvent = useProposalDepositEvent(proposalId) // ok shared with grant
  const proposalUserDeposit = useProposalUserDeposit(proposalId, account?.address || "") // ok shared with grant
  const proposalSnapshot = useProposalSnapshot(proposalId) // ok shared with grant
  const proposalSnapshotBlock = useMemo(
    () => (proposalSnapshot.data ? Number(proposalSnapshot.data) : undefined),
    [proposalSnapshot.data],
  )
  const isDepositReached = useIsDepositReached(proposalId) // ok shared with grant
  const isProposalActive = useMemo(() => proposalState === ProposalState.Active, [proposalState])
  const isProposalStateValidForQuorum = useMemo(
    () => proposalState !== undefined && proposalState !== ProposalState.Pending,
    [proposalState],
  )
  const proposalQuorum = useProposalQuorum(proposalSnapshotBlock, isProposalStateValidForQuorum)
  const isQuorumReached = useIsProposalQuorumReached(proposalId) // ok shared with grant
  const proposalSnapshotVotingPower = useProposalSnapshotVotingPower(proposalSnapshotBlock, isProposalActive) // ok shared with grant
  const { data: proposalVotes, isLoading: isVotesLoading } = useProposalVotesIndexer({ proposalId }) // ok shared with grant
  const proposalSnapshotVot3 = useGetVotesOnBlock(
    proposalSnapshotBlock,
    account?.address ?? undefined,
    isProposalActive,
  )

  const votingRoundId = useMemo(
    () => proposalEnriched.proposal?.votingRoundId,
    [proposalEnriched.proposal?.votingRoundId],
  )

  const proposalCanceledDate = useMemo(() => {
    if (!proposalCanceledEvent.data?.blockMeta.blockTimestamp) {
      return undefined
    }
    return dayjs.unix(proposalCanceledEvent.data?.blockMeta.blockTimestamp)
  }, [proposalCanceledEvent.data?.blockMeta.blockTimestamp])

  const grantsDetails = useMemo(() => {
    return getGrantProposalMetadataOrReturnDefault(proposalEnriched.proposal as GrantProposalEnriched)
  }, [proposalEnriched.proposal])

  const calls = useMemo(
    () => [
      proposalCanceledEvent,
      proposalDepositEvent,
      proposalUserDeposit,
      isDepositReached,
      isQuorumReached,
      proposalSnapshotVotingPower,
      proposalSnapshotVot3,
      proposalQuorum,
      // proposalState,
      // proposalCreatedEvent,
      // proposalMetadata,
    ],
    [
      proposalCanceledEvent,
      proposalDepositEvent,
      proposalUserDeposit,
      isDepositReached,
      isQuorumReached,
      proposalSnapshotVotingPower,
      proposalSnapshotVot3,
      proposalQuorum,
      // proposalState,
      // proposalCreatedEvent,
      // proposalMetadata,
    ],
  )

  // Proposal Vote Dates
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
      // Proposal Votes
      forVotes = proposalVotes.votes.for.totalWeight
      againstVotes = proposalVotes.votes.against.totalWeight
      abstainVotes = proposalVotes.votes.abstain.totalWeight
      totalVotingPowerUsedInVotes = proposalVotes.totalPower
      forPercentage = proposalVotes.votes.for.percentage
      againstPercentage = proposalVotes.votes.against.percentage
      abstainPercentage = proposalVotes.votes.abstain.percentage
    }

    // Proposal Enriched data
    const depositThreshold = proposalEnriched.proposal?.depositThreshold || ""

    // Deposit Event
    const communityDeposits = proposalDepositEvent.communityDeposits
    const userSupportLeft = Number(ethers.formatEther(BigInt(proposalUserDeposit?.data || 0)))
    const communityDepositPercentage = communityDeposits / Number(depositThreshold) // TODO : Double check the roundings
    const communityDepositChartPercentage = Math.min(communityDepositPercentage || 0, 1) * 100
    const isUserSupportLeft = userSupportLeft > 0
    const userSupport = proposalDepositEvent.userSupport
    const userSupportPercentage = userSupport / communityDeposits
    const othersSupport = proposalDepositEvent.othersSupport
    const othersSupportPercentage = othersSupport / Number(depositThreshold) // TODO : Double check the roundings
    const othersSupportChartPercentage =
      communityDepositPercentage > 1 ? (othersSupport / communityDeposits) * 100 : othersSupportPercentage * 100
    const hasUserSupported = proposalDepositEvent.hasUserSupported
    const supportingUserCount = proposalDepositEvent.supportingUserCount
    const othersSupportUserCount = proposalDepositEvent.othersSupportUserCount
    const userVotingPowerOnSnapshot = ethers.formatEther(BigInt(proposalSnapshotVotingPower.data || 0))
    const userVot3OnSnapshot = proposalSnapshotVot3.data ?? "0"

    const result = {
      // ProposalCreatedEvent type :
      id: proposalId,
      governanceType:
        (proposalEnriched?.proposal?.targets.length ?? 0) >= 1 ? GovernanceType.OnChain : GovernanceType.Text, // if they are target, it is a SC executable function
      ipfsDescription: proposalEnriched?.proposal?.ipfsDescription || "",
      votingRoundId: votingRoundId || "",
      depositThreshold: ethers.formatEther(depositThreshold || BigInt(0)),
      values: proposalEnriched?.proposal?.values || [],

      proposer: proposalEnriched?.proposal?.proposerAddress || "", // REDUNDANT
      proposerAddress: proposalEnriched?.proposal?.proposerAddress || "", // REDUNDANT
      calldatas: proposalEnriched?.proposal?.calldatas || [],
      targets: proposalEnriched?.proposal?.targets || [],
      createdAt: proposalEnriched?.proposal?.createdAt || 0,
      createdAtBlock: proposalEnriched?.proposal?.createdAtBlock || 0,

      // ProposalEnriched and GrantProposalEnriched type :
      // title: proposalEnriched?.proposal?.title || "",
      // shortDescription: proposalEnriched?.proposal?.shortDescription || "",
      // markdownDescription: proposalEnriched?.proposal?.markdownDescription || "",
      // description: proposalEnriched?.proposal?.shortDescription || "",
      // proposerAddress is already in ProposalEnriched type
      state: proposalEnriched?.proposal?.state || ProposalState.Pending, // TODO : Double check the default value
      type: proposalType,

      // grantType: (proposalEnriched?.proposal as GrantProposalEnriched)?.grantType || "",
      grantAmountRequested: (proposalEnriched?.proposal as GrantProposalEnriched)?.grantAmountRequested || 0,
      ...grantsDetails, // Spread grantsDetails here

      // Blocks timelines
      votingStartBlock,
      votingEndBlock,

      // Timeline data ( To Date )
      proposalQueuedDate: proposalQueuedEvent?.data
        ? new Date(proposalQueuedEvent?.data.blockMeta.blockTimestamp * 1000).getTime()
        : undefined,
      proposalExecutedDate: proposalExecutedEvent?.data
        ? new Date(proposalExecutedEvent?.data.blockMeta.blockTimestamp * 1000).getTime()
        : undefined,
      votingStartDate,
      votingEndDate,
      proposalCanceledDate,

      // Deposits data
      missingSupport: proposalDepositEvent.missingSupport,
      communityDeposits,
      communityDepositPercentage,
      communityDepositChartPercentage,
      isDepositReached: isDepositReached.data,
      isUserSupportLeft,
      userSupport,
      userSupportPercentage,
      othersSupport,
      othersSupportPercentage,
      othersSupportChartPercentage,
      supportingUserCount,
      hasUserSupported,
      othersSupportUserCount,

      // Proposal Votes data
      totalVotingPowerUsedInVotes,
      forVotes,
      againstVotes,
      abstainVotes,
      forPercentage,
      againstPercentage,
      abstainPercentage,
      userVotingPowerOnSnapshot,
      userVot3OnSnapshot,
      snapshotVotesQuery: proposalSnapshotVot3,
      isQuorumReached: isQuorumReached.data,
      quorum: proposalQuorum.data || "",
      quorumQuery: proposalQuorum,
      proposalVotesQuery: proposalVotes,

      // Loading States
      isStateLoading: isProposalEnrichedLoading,
      isDescriptionLoading: proposalEnriched.isLoading,
      isRoundIdVoteStartLoading: proposalEnriched.isLoading,
      isDepositThresholdLoading: proposalEnriched.isLoading,
      isProposerLoading: proposalEnriched.isLoading,
      isTitleLoading: proposalEnriched.isLoading,
      isVotingStartDateLoading,
      isVotingEndDateLoading,
      isCommunityDepositsLoading: proposalDepositEvent.isLoading,
      isCommunityDepositPercentageLoading: proposalDepositEvent.isLoading || proposalEnriched.isLoading,
      isYourSupportLoading: proposalUserDeposit.isLoading,
      isOthersSupportLoading: proposalDepositEvent.isLoading || proposalUserDeposit.isLoading,
      isSupportinUserCountLoading: proposalDepositEvent.isLoading,
      isUserVotingPowerOnSnapshotLoading: proposalSnapshotVotingPower.isLoading,
      isUserVot3OnSnapshotLoading: proposalSnapshotVot3.isLoading,
      isQuorumReachedLoading: isQuorumReached.isLoading,
      isQuorumLoading: proposalQuorum.isLoading,
      isVotesLoading,
    }

    const mock = {}

    return { ...result, ...mock }
  }, [
    proposalCanceledDate,
    proposalVotes,
    proposalUserDeposit,
    proposalType,
    votingRoundId,
    proposalDepositEvent,
    proposalSnapshotVotingPower,
    proposalSnapshotVot3,
    proposalQuorum,
    proposalId,
    proposalQueuedEvent,
    proposalExecutedEvent,
    votingStartDate,
    isVotingStartDateLoading,
    votingEndDate,
    isVotingEndDateLoading,
    isDepositReached,
    isQuorumReached,
    votingStartBlock,
    votingEndBlock,
    isVotesLoading,
    isProposalEnrichedLoading,
    proposalEnriched,
    grantsDetails,
  ])

  const error = useMemo(() => calls.find(call => call.error)?.error || null, [calls])
  if (error) {
    console.error("error", error)
  }

  return { proposal }
}

export const useProposalDetail = (_proposalId?: string): ProposalDetailData => {
  const { proposalId } = useParams<{ proposalId: string }>()
  return useProposalDetailById(_proposalId ?? proposalId)
}
