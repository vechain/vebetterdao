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
  const votesWithComment = useMemo(() => votes?.filter(event => !!event.reason), [votes])
  const userVote = useMemo(() => votes?.find(event => compareAddresses(event.account, account || "")), [account, votes])

  const hasUserVoted = !!userVote

  console.log("votes", votes)

  const proposalVoteEvent = useMemo(
    () => ({
      hasUserVoted,
      userVote,
      votesWithComment,
      votes,
      isLoading: events.isLoading,
      error: events.error,
    }),
    [events.error, events.isLoading, hasUserVoted, userVote, votes, votesWithComment],
  )
  return proposalVoteEvent
}
