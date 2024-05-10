import { useMemo } from "react"
import { useProposalCreatedEvent } from "./useProposalCreatedEvent"
import { ProposalState, useProposalState } from "./useProposalState"
import { useProposalVotes } from "./useProposalVotes"
import { useParams } from "next/navigation"
import { useProposalDeposits } from "./useGetProposalDeposit"
import { useProposalVoteDates } from "./useProposalVoteDates"
import { useProposalUserDeposit } from "./useProposalUserDeposit"
import { useWallet } from "@vechain/dapp-kit-react"
import { useIsDepositReached } from "./useIsDepositReached"

export const useProposal = (proposalId: string) => {
  const { account } = useWallet()
  const proposalState = useProposalState(proposalId)
  const proposalVotes = useProposalVotes(proposalId)
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const proposalDeposits = useProposalDeposits(proposalId)
  const proposalUserDeposit = useProposalUserDeposit(proposalId, account || "")
  const isDepositReached = useIsDepositReached(proposalId)
  const calls = [
    proposalState,
    proposalVotes,
    proposalCreatedEvent,
    proposalDeposits,
    proposalUserDeposit,
    isDepositReached,
  ]

  const { votingStartDate, isVotingStartDateLoading, votingEndDate, isVotingEndDateLoading } =
    useProposalVoteDates(proposalId)

  const proposal = useMemo(() => {
    const forVotes = Number(proposalVotes.data?.forVotes || "0")
    const againstVotes = Number(proposalVotes.data?.againstVotes || "0")
    const abstainVotes = Number(proposalVotes.data?.abstainVotes || "0")
    const totalVotes = forVotes + againstVotes + abstainVotes
    const forPercentage = (totalVotes ? forVotes / totalVotes : 0) * 100
    const againstPercentage = (totalVotes ? againstVotes / totalVotes : 0) * 100
    const abstainPercentage = (totalVotes ? abstainVotes / totalVotes : 0) * 100

    const result = {
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
      depositThreshold: proposalCreatedEvent.data?.depositThreshold,
      isDepositThresholdLoading: proposalCreatedEvent.isLoading,
      communityDeposits: proposalDeposits?.data || 0,
      isCommunityDepositsLoading: proposalDeposits.isLoading,
      communityDepositPercentage: Number(proposalDeposits?.data) / Number(proposalCreatedEvent.data?.depositThreshold),
      isCommunityDepositPercentageLoading: proposalDeposits.isLoading || proposalCreatedEvent.isLoading,
      isDepositReached: isDepositReached.data,
      isDepositReachedLoading: isDepositReached.isLoading,
      yourSupport: proposalUserDeposit?.data || 0,
      isYourSupportLoading: proposalUserDeposit.isLoading,
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
    }

    const mock = {
      state: ProposalState.Pending,
      isStateLoading: false,
      isVotesLoading: false,
      isTitleLoading: false,
      isDescriptionLoading: false,
    }

    return { ...result, ...mock }
  }, [
    ...calls.map(call => call.data),
    votingStartDate,
    isVotingStartDateLoading,
    votingEndDate,
    isVotingEndDateLoading,
  ])

  const error = useMemo(
    () => calls.find(call => call.error)?.error || null,
    calls.map(call => call.error),
  )
  if (error) console.error("useProposal", error)

  return {
    proposalState,
    proposalVotes,
    //proposalQuorum,
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
