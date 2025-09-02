import { useProposalEnriched } from "@/hooks/proposals/common"
import { useQuery } from "@tanstack/react-query"
import { useWallet } from "@vechain/vechain-kit"

export const getUserProposalsCreatedEventsQueryKey = (user?: string) => ["PROPOSALS", "ALL", "CREATED", user]

export const useUserCreatedProposal = (user?: string) => {
  const { data: { proposals } = { proposals: [] } } = useProposalEnriched()
  const { account } = useWallet()

  return useQuery({
    queryKey: getUserProposalsCreatedEventsQueryKey(user ?? undefined),
    queryFn: () => {
      const lowerCaseUser = user?.toLowerCase()
      const lowerCaseAccount = account?.address?.toLowerCase()
      const filteredProposals =
        proposals?.filter(
          p =>
            p.proposerAddress.toLowerCase() === lowerCaseUser || p.proposerAddress.toLowerCase() === lowerCaseAccount,
        ) ?? []
      return filteredProposals
    },
    enabled: !!user || (!!account?.address && !!proposals),
  })
}
