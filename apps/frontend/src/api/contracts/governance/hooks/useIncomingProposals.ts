import { useCurrentBlock } from "@/api/blockchain"
import { useConnex } from "@vechain/dapp-kit-react"
import { useProposalsEvents } from "./useProposalsEvents"
import { useQuery } from "@tanstack/react-query"
import { useAllocationsRoundsEvents } from "../../xAllocations"

export const getIncomingProposalsQueryKey = () => ["proposals", "incoming"]
/**
 *  Hook to get the incoming proposals using on-chain events (i.e the proposals not started yet and not canceled)
 * @returns  the incoming proposals events (i.e the proposals not started yet and not canceled)
 */
export const useIncomingProposals = () => {
  const { thor } = useConnex()
  const { data: currentBlock } = useCurrentBlock()
  const { data: proposalsEvents } = useProposalsEvents()
  const { data: allocationsEvents } = useAllocationsRoundsEvents()

  return useQuery({
    queryKey: getIncomingProposalsQueryKey(),
    queryFn: async () => {
      if (!thor || !proposalsEvents) return
      const lastBlock = currentBlock?.number ?? thor.status.head.number
      return proposalsEvents.created.filter(proposal => {
        const relatedRound = allocationsEvents?.created.find(
          round => Number(round.roundId) === Number(proposal.roundIdVoteStart),
        )
        return (
          Number(relatedRound?.voteStart) >= lastBlock &&
          !proposalsEvents.canceled.some(canceledProposal => canceledProposal.proposalId === proposal.proposalId)
        )
      })
    },
    enabled: !!thor && !!proposalsEvents,
  })
}
