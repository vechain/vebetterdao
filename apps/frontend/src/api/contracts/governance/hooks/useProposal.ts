import { useCallback, useMemo } from "react"
import { useProposalCreatedEvent } from "./useProposalCreatedEvent"
import { useProposalState } from "./useProposalState"
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
import { useVot3TokenDetails } from "../../vot3"

export const useProposal = (proposalId: string) => {
  const { account } = useWallet()
  const proposalState = useProposalState(proposalId)
  const proposalVotes = useProposalVotes(proposalId)
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const proposalDepositEvent = useProposalDepositEvent(proposalId)
  const proposalDeposits = useProposalDeposits(proposalId)
  const proposalUserDeposit = useProposalUserDeposit(proposalId, account || "")
  const isDepositReached = useIsDepositReached(proposalId)
  const isQuorumReached = useIsProposalQuorumReached(proposalId)
  const vot3Token = useVot3TokenDetails()

  const calls = [
    proposalState,
    proposalVotes,
    proposalCreatedEvent,
    proposalDepositEvent,
    proposalDeposits,
    proposalUserDeposit,
    isDepositReached,
    isQuorumReached,
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
    const yourSupport = scaleVot3Amount(proposalUserDeposit?.data)
    const yourSupportPercentage = Number(yourSupport) / Number(communityDeposits)
    const othersSupport = Number(communityDeposits) - Number(yourSupport)
    const othersSupportPercentage = othersSupport / Number(depositThreshold)
    const othersSupportChartPercentage =
      communityDepositPercentage > 0 ? (othersSupport / Number(communityDeposits)) * 100 : othersSupportPercentage * 100
    const isYouSupporting = Number(yourSupport) > 0
    const supportingUserCount = proposalDepositEvent.supportingUserCount
    const othersSupportUserCount = isYouSupporting ? Number(supportingUserCount) - 1 : Number(supportingUserCount)

    const result = {
      id: proposalId,
      title: proposalCreatedEvent.data?.description,
      isTitleLoading: proposalCreatedEvent.isLoading,
      description: proposalCreatedEvent.data?.description, // TODO: get the right description
      isDescriptionLoading: proposalCreatedEvent.isLoading,
      proposer: proposalCreatedEvent.data?.proposer || "",
      isProposerLoading: proposalCreatedEvent.isLoading,
      roundIdVoteStart: proposalCreatedEvent.data?.roundIdVoteStart,
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
      yourSupport,
      isYourSupportLoading: proposalUserDeposit.isLoading,
      yourSupportPercentage,
      othersSupport,
      isOthersSupportLoading: proposalDeposits.isLoading || proposalUserDeposit.isLoading,
      othersSupportPercentage,
      othersSupportChartPercentage,
      supportingUserCount,
      isSupportinUserCountLoading: proposalDepositEvent.isLoading,
      isYouSupporting,
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
      isVotesLoading: proposalVotes.isLoading,
      isQuorumReached: isQuorumReached.data,
      isQuorumReachedLoading: isQuorumReached.isLoading,
    }

    const mock = {}

    return { ...result, ...mock }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ...calls.map(call => call.data),
    ...calls.map(call => call.isLoading),
    votingStartDate,
    isVotingStartDateLoading,
    votingEndDate,
    isVotingEndDateLoading,
  ])

  const error = useMemo(
    () => calls.find(call => call.error)?.error || null,
    calls.map(call => call.error),
  )
  // if (error) console.error("useProposal", error)

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
