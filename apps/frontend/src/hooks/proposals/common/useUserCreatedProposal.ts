import { compareAddresses } from "@repo/utils/AddressUtils"
import { useMemo } from "react"

import { useProposalEnriched } from "./useProposalEnriched"

export const useUserCreatedProposal = (walletAddress: string) => {
  const { data: { enrichedProposals } = { enrichedProposals: [] } } = useProposalEnriched()

  const data = useMemo(
    () => enrichedProposals?.filter(proposal => compareAddresses(proposal.proposerAddress, walletAddress)) ?? [],
    [enrichedProposals, walletAddress],
  )

  return { data }
}
