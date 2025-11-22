import { compareAddresses } from "@repo/utils/AddressUtils"
import { useQuery } from "@tanstack/react-query"

import { useGetProposalsAndGrants } from "@/app/rounds/hooks/useRoundProposals"

export const getUserProposalsCreatedEventsQueryKey = (walletAddress: string) => [
  "PROPOSALS",
  "ALL",
  "CREATED",
  walletAddress,
]
export const useUserCreatedProposal = (walletAddress: string) => {
  const { data: { proposals } = {} } = useGetProposalsAndGrants()
  return useQuery({
    queryKey: getUserProposalsCreatedEventsQueryKey(walletAddress),
    queryFn: () => {
      const filteredProposals = proposals?.filter(proposal => compareAddresses(proposal.proposer, walletAddress)) ?? []
      return filteredProposals
    },
    enabled: !!walletAddress || (!!walletAddress && !!proposals),
  })
}
