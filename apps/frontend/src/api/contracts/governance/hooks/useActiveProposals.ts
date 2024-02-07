import { useCurrentBlock } from "@/api/blockchain"
import { useConnex } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"

/**
 *  Hook to get the active proposals events from the governor contract (i.e the proposals created, not canceled, expired and not queued/executed)
 * @returns  the active proposals events (i.e the proposals created, not canceled, expired and not queued/executed)
 */
export const useActiveProposals = () => {
  const { thor } = useConnex()
  const proposalsEventsQuery = useProposalsEvents()
  const { data: currentBlock } = useCurrentBlock()

  const activeProposals = useMemo(() => {
    const proposalsEvents = proposalsEventsQuery.data
    if (!thor || !proposalsEvents) return
    const lastBlock = currentBlock?.number ?? thor.status.head.number
    return proposalsEvents.created.filter(
      proposal =>
        Number(proposal.voteStart) < lastBlock &&
        Number(proposal.voteEnd) > lastBlock &&
        !proposalsEvents.canceled.some(canceledProposal => canceledProposal.proposalId === proposal.proposalId) &&
        !proposalsEvents.executed.some(executedProposal => executedProposal.proposalId === proposal.proposalId) &&
        !proposalsEvents.queued.some(queuedProposal => queuedProposal.proposalId === proposal.proposalId),
    )
  }, [proposalsEventsQuery, currentBlock, thor])

  return {
    ...proposalsEventsQuery,
    data: activeProposals,
  }
}
