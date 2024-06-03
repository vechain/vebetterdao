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
  const userVote = events.data?.votes?.find(
    event => event.proposalId === proposalId && compareAddresses(event.account, account || ""),
  )

  const hasUserVoted = !!userVote

  const proposalVoteEvent = useMemo(
    () => ({
      hasUserVoted,
      userVote,
      votes: events.data?.votes?.find(event => event.proposalId === proposalId),
      isLoading: events.isLoading,
      error: events.error,
    }),
    [events, hasUserVoted, proposalId, userVote],
  )
  return proposalVoteEvent
}
