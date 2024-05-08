import { useMemo } from "react"
import { useProposalCreatedEvent } from "./useProposalCreatedEvent"
import { useProposalDeadline } from "./useProposalDeadline"
import { useProposalQuorum } from "./useProposalQuorum"
import { useProposalSnapshot } from "./useProposalSnapshot"
import { useProposalState } from "./useProposalState"
import { useProposalVotes } from "./useProposalVotes"
import { useDepositThreshold } from "./useDepositThreshold"
import { useParams } from "next/navigation"
import { useProposalDeposits } from "./useGetProposalDeposit"

export const useProposal = (proposalId: string) => {
  const proposalState = useProposalState(proposalId)
  const proposalSnapshot = useProposalSnapshot(proposalId)
  const proposalVotes = useProposalVotes(proposalId)
  const proposalDeadline = useProposalDeadline(proposalId)
  const proposalQuorum = useProposalQuorum(proposalId)
  const proposalCreatedEvent = useProposalCreatedEvent(proposalId)
  const proposalDeposits = useProposalDeposits(proposalId)

  console.log("proposalDeposits", proposalDeposits)

  // remap main info
  const proposal = useMemo(() => {
    const forVotes = Number(proposalVotes.data?.forVotes || "0")
    const againstVotes = Number(proposalVotes.data?.againstVotes || "0")
    const abstainVotes = Number(proposalVotes.data?.abstainVotes || "0")
    const totalVotes = forVotes + againstVotes + abstainVotes
    const forPercentage = (totalVotes ? forVotes / totalVotes : 0) * 100
    const againstPercentage = (totalVotes ? againstVotes / totalVotes : 0) * 100
    const abstainPercentage = (totalVotes ? abstainVotes / totalVotes : 0) * 100
    // return {
    //   title: proposalCreatedEvent.data?.description,
    //   description:
    //     "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua Ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat Duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore fugiat nulla pariatur Excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum",
    //   proposer: proposalCreatedEvent.data?.proposer || "",
    //   roundIdVoteStart: proposalCreatedEvent.data?.roundIdVoteStart,
    //   startDate: new Date().getTime() + 1000 * 60 * 60 * 24 * 3,
    //   deposited: proposalDeposits?.data || 0,
    //   depositThreshold: proposalCreatedEvent.data?.depositThreshold,
    //   state: proposalState.data,
    //   isDepositPending: true,
    //   isProposalActive: false,
    //   forVotes,
    //   againstVotes,
    //   abstainVotes,
    //   totalVotes,
    //   forPercentage,
    //   againstPercentage,
    //   abstainPercentage,
    // }
    return {
      title: proposalCreatedEvent.data?.description,
      description: proposalCreatedEvent.data?.description, // TODO: get the right description
      proposer: proposalCreatedEvent.data?.proposer || "",
      roundIdVoteStart: proposalCreatedEvent.data?.roundIdVoteStart,
      startDate: new Date().getTime() + 1000 * 60 * 60 * 24 * 3, // TODO: stimare
      endDate: new Date().getTime() + 1000 * 60 * 60 * 24 * 4, // TODO: stimare
      deposited: proposalDeposits?.data || 0,
      depositThreshold: proposalCreatedEvent.data?.depositThreshold,
      state: proposalState.data,
      isDepositPending: proposalState.data === 8,
      isProposalActive: proposalState.data === 1,
      forVotes,
      againstVotes,
      abstainVotes,
      totalVotes,
      forPercentage,
      againstPercentage,
      abstainPercentage,
    }
  }, [])

  const isLoading =
    proposalState.isLoading ||
    proposalSnapshot.isLoading ||
    proposalVotes.isLoading ||
    proposalDeadline.isLoading ||
    proposalQuorum.isLoading ||
    proposalCreatedEvent.isLoading ||
    proposalDeposits.isLoading

  const error =
    proposalState.error ||
    proposalSnapshot.error ||
    proposalVotes.error ||
    proposalDeadline.error ||
    proposalQuorum.error ||
    proposalCreatedEvent.error ||
    proposalDeposits.error

  return {
    proposalState,
    proposalSnapshot,
    proposalVotes,
    proposalDeadline,
    proposalQuorum,
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
