import { useMemo } from "react"
import { useProposalCreatedEvent } from "./useProposalCreatedEvent"
import { useProposalDeadline } from "./useProposalDeadline"
import { useProposalQuorum } from "./useProposalQuorum"
import { useProposalSnapshot } from "./useProposalSnapshot"
import { useProposalState } from "./useProposalState"
import { useProposalVotes } from "./useProposalVotes"
import { useDepositThreshold } from "./useDepositThreshold"
import { useParams } from "next/navigation"

export const useProposal = (proposalId: string) => {
  const proposalState = useProposalState(proposalId)
  const proposalSnapshot = useProposalSnapshot(proposalId)
  const proposalVotes = useProposalVotes(proposalId)
  const proposalDeadline = useProposalDeadline(proposalId)
  const proposalQuorum = useProposalQuorum(proposalId)
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const depositThreshold = useDepositThreshold()

  // remap main info
  const proposal = useMemo(() => {
    return {
      title: proposalCreatedEvent.data?.description,
      description:
        "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum",
      proposer: proposalCreatedEvent.data?.proposer || "",
      roundIdVoteStart: proposalCreatedEvent.data?.roundIdVoteStart,
      startsInDate: new Date().getTime() + 1000 * 60 * 60 * 24 * 3,
      deposited: 0,
      depositThreshold: depositThreshold.data,
      state: proposalState.data,
      isDepositPending: false,
      isProposalActive: false,
      proposalVotes: {
        abstainVotes: "50",
        againstVotes: "1000",
        forVotes: "100",
      },
    }
    // return {
    //   title: proposalCreatedEvent.data?.description,
    //   description: proposalCreatedEvent.data?.description,
    //   proposer: proposalCreatedEvent.data?.proposer || "",
    //   roundIdVoteStart: proposalCreatedEvent.data?.roundIdVoteStart,
    //   startsInDate: "3 days", // TODO: calculate from proposalDeadline
    //   deposited: 0, // TODO: calculate creation event
    //   depositThreshold: depositThreshold.data,
    //   state: proposalState.data,
    //   isDepositPending: proposalState.data === 8,
    //   isProposalActive: proposalState.data === 1,
    //   proposalVotes: proposalVotes.data,
    // }
  }, [])

  const isLoading =
    proposalState.isLoading ||
    proposalSnapshot.isLoading ||
    proposalVotes.isLoading ||
    proposalDeadline.isLoading ||
    proposalQuorum.isLoading ||
    proposalCreatedEvent.isLoading ||
    depositThreshold.isLoading

  const error =
    proposalState.error ||
    proposalSnapshot.error ||
    proposalVotes.error ||
    proposalDeadline.error ||
    proposalQuorum.error ||
    proposalCreatedEvent.error ||
    depositThreshold.error

  return {
    proposalState,
    proposalSnapshot,
    proposalVotes,
    proposalDeadline,
    proposalQuorum,
    proposalCreatedEvent,
    proposal,
    isLoading,
    error,
  }
}

export const useCurrentProposal = () => {
  const { proposalId } = useParams<{ proposalId: string }>()
  return useProposal(proposalId)
}
