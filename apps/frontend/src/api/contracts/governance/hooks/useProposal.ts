import { useMemo } from "react"
import { useProposalCreatedEvent } from "./useProposalCreatedEvent"
import { ProposalState, useProposalState } from "./useProposalState"
import { useProposalVotes } from "./useProposalVotes"
import { useParams } from "next/navigation"
import { useProposalDeposits } from "./useGetProposalDeposit"
import { useProposalVoteDates } from "./useProposalVoteDates"

export const useProposal = (proposalId: string) => {
  const proposalState = useProposalState(proposalId)
  const proposalVotes = useProposalVotes(proposalId)
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const proposalDeposits = useProposalDeposits(proposalId)
  const { votingStartDate, isVotingStartDateLoading, votingEndDate, isVotingEndDateLoading } =
    useProposalVoteDates(proposalId)

  const calls = [proposalState, proposalVotes, proposalCreatedEvent, proposalDeposits]

  // remap main info
  const proposal = useMemo(
    () => {
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
        deposited: proposalDeposits?.data || 0, // TODO: understand if it is correct
        yourSupport: proposalDeposits?.data || 0, // TODO: understand if it is correct
        depositThreshold: proposalCreatedEvent.data?.depositThreshold, // not used right now, remove if not needed
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

      const mock = {}

      return { ...result, ...mock }
    },
    calls.map(call => call.data),
  )

  const isLoading = useMemo(
    () => calls.some(call => call.isLoading),
    calls.map(call => call.isLoading),
  )

  const error = useMemo(
    () => calls.find(call => call.error)?.error || null,
    calls.map(call => call.error),
  )
  // if (error) console.error("useProposal", error)

  return {
    proposalState,
    proposalVotes,
    //proposalQuorum,
    proposalCreatedEvent,
    proposalDeposits,
    proposal,
    isLoading,
    error,
  }
}

export const useCurrentProposal = () => {
  const { proposalId } = useParams<{ proposalId: string }>()
  return useProposal(proposalId)
}
