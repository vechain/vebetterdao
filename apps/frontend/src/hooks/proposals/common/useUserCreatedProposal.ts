import { useProposalEnriched } from "@/hooks/proposals/common"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { useQuery } from "@tanstack/react-query"

export const getUserProposalsCreatedEventsQueryKey = (walletAddress: string) => [
  "PROPOSALS",
  "ALL",
  "CREATED",
  walletAddress,
]

export const useUserCreatedProposal = (walletAddress: string) => {
  const { data: { proposals } = { proposals: [] } } = useProposalEnriched()

  return useQuery({
    queryKey: getUserProposalsCreatedEventsQueryKey(walletAddress),
    queryFn: () => {
      const filteredProposals =
        proposals?.filter(proposal => compareAddresses(proposal.proposerAddress, walletAddress)) ?? []
      return filteredProposals
    },
    enabled: !!walletAddress || (!!walletAddress && !!proposals),
  })
}
