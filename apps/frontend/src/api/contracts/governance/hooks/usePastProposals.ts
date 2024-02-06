import { useCurrentBlock } from "@/api/blockchain"
import { useConnex } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"

/**
 *  Hook to get the past proposals using on-chain events (i.e the proposals expired, canceled, queued or executed)
 * @returns  the past proposals events (i.e the proposals expired, canceled, queued or executed)
 */
export const usePastProposals = () => {
  const { thor } = useConnex()
  const { data: proposalsEvents } = useProposalsEvents()
  const { data: currentBlock } = useCurrentBlock()

  const pastProposals = useMemo(() => {
    if (!thor || !proposalsEvents) return
    const lastBlock = currentBlock?.number ?? thor.status.head.number
    return proposalsEvents.created.filter(
      proposal =>
        Number(proposal.voteEnd) < lastBlock ||
        proposalsEvents.canceled.some(canceledProposal => canceledProposal.proposalId === proposal.proposalId) ||
        proposalsEvents.executed.some(executedProposal => executedProposal.proposalId === proposal.proposalId) ||
        proposalsEvents.queued.some(queuedProposal => queuedProposal.proposalId === proposal.proposalId),
    )
  }, [proposalsEvents, thor, currentBlock])

  return {
    ...proposalsEvents,
    data: pastProposals,
  }
}
