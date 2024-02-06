import { useCurrentBlock } from "@/api/blockchain"
import { useConnex } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { useProposalsEvents } from "./useProposalsEvents"

/**
 *  Hook to get the incoming proposals using on-chain events (i.e the proposals not started yet and not canceled)
 * @returns  the incoming proposals events (i.e the proposals not started yet and not canceled)
 */
export const useIncomingProposals = () => {
  const { thor } = useConnex()
  const { data: currentBlock } = useCurrentBlock()
  const { data: proposalsEvents } = useProposalsEvents()

  const incomingProposals = useMemo(() => {
    if (!thor || !proposalsEvents) return
    const lastBlock = currentBlock?.number ?? thor.status.head.number
    return proposalsEvents.created.filter(
      proposal =>
        Number(proposal.voteStart) > lastBlock &&
        !proposalsEvents.canceled.some(canceledProposal => canceledProposal.proposalId === proposal.proposalId),
    )
  }, [proposalsEvents, thor, currentBlock])

  return {
    ...proposalsEvents,
    data: incomingProposals,
  }
}
