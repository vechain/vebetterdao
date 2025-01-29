import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { getProposalUserDepositQueryKey, proposalDepositAbi } from "./useProposalUserDeposit"
import { queryClient } from "@/api/QueryProvider"
import { useProposalsEvents } from "./useProposalsEvents"
import { getConfig } from "@repo/config"

const GOVERNOR_CONTRACT = getConfig().b3trGovernorAddress

/**
 * Custom React hook that fetches and monitors claimable user deposits for each proposal.
 *
 * This hook utilizes the `useQueries` function from `@tanstack/react-query` to manage a series
 * of concurrent queries. Each query corresponds to a single proposal and fetches the deposit
 * details that are claimable by the specified user. Deposits can only be claimed if the proposal
 * state is not pending.
 *
 * @param userAddress - The address of the user whose deposits are to be fetched.
 * @returns An array of results from the `useQueries` function, each corresponding to a proposal's deposit data.
 */
export const useProposalClaimableUserDeposits = (userAddress: string) => {
  const { thor } = useConnex()
  const { data: proposals } = useProposalsEvents()

  const proposalIds = useMemo(() => {
    return proposals?.created.map(proposal => proposal.proposalId) ?? []
  }, [proposals])

  return useQuery({
    queryKey: getProposalUserDepositQueryKey("ALL", userAddress),
    enabled: !!thor && !!userAddress && !!proposalIds,
    queryFn: async () => {
      const clauses = proposalIds.map(proposalId => ({
        to: GOVERNOR_CONTRACT,
        value: "0x0",
        data: proposalDepositAbi.encode(proposalId, userAddress),
      }))

      const res = await thor.explain(clauses).execute()

      const proposalsDeposit = res.map((r, index) => {
        const decoded = proposalDepositAbi.decode(r.data)
        if (r.reverted) throw new Error(`Clause ${index + 1} reverted with reason ${r.revertReason}`)
        const proposalId = proposalIds[index] as string
        const deposit = decoded[0] as string

        queryClient.setQueryData(getProposalUserDepositQueryKey(proposalId, userAddress), deposit)
        return {
          proposalId,
          deposit,
        }
      })

      return proposalsDeposit
    },
  })
}
