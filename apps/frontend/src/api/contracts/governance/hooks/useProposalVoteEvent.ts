import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"
import { useWallet } from "@vechain/dapp-kit-react"
import { compareAddresses } from "@repo/utils/AddressUtils"

/**
 * Custom hook that retrieves the vote event for a specific proposal.
 * @param proposalId - The ID of the proposal.
 * @returns An object containing information about the vote event.
 */
export const useProposalVoteEvent = (proposalId: string) => {
  const { account } = useWallet()
  const events = useProposalsEvents()
  const votes = useMemo(
    () => events.data?.votes?.filter(event => event.proposalId === proposalId),
    [events.data?.votes, proposalId],
  )
  const totalVot3UsedInVotes = useMemo(() => votes?.reduce((acc, event) => acc + Number(event.weight), 0), [votes])
  const totalVotingPowerUsedInVotes = useMemo(
    () => votes?.reduce((acc, event) => acc + Number(event.power), 0),
    [votes],
  )
  const votesWithComment = useMemo(() => votes?.filter(event => !!event.reason), [votes])
  const userVote = useMemo(() => votes?.find(event => compareAddresses(event.account, account || "")), [account, votes])

  const hasUserVoted = !!userVote

  const proposalVoteEvent = useMemo(
    () => ({
      hasUserVoted,
      userVote,
      votesWithComment,
      votes,
      totalVot3UsedInVotes,
      totalVotingPowerUsedInVotes,
      isLoading: events.isLoading,
      error: events.error,
    }),
    [
      events.error,
      events.isLoading,
      hasUserVoted,
      totalVot3UsedInVotes,
      totalVotingPowerUsedInVotes,
      userVote,
      votes,
      votesWithComment,
    ],
  )
  return proposalVoteEvent
}
