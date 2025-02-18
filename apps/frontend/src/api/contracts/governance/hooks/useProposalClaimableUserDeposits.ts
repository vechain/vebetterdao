import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getProposalUserDepositQueryKey, proposalDepositAbi } from "./useProposalUserDeposit"
import { queryClient } from "@/api/QueryProvider"
import { getConfig } from "@repo/config"
import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { StateFilter } from "@/store"

const GOVERNOR_CONTRACT = getConfig().b3trGovernorAddress

// Filters for proposals that have claimable deposits
const CLAIMABLE_STATES = [
  StateFilter.Canceled,
  StateFilter.Defeated,
  StateFilter.Succeeded,
  StateFilter.Queued,
  StateFilter.Executed,
  StateFilter.DepositNotMet,
]

/**
 * Processes and caches the claimable deposits.
 */
const processDeposits = (res: any[], filteredProposals: any[], userAddress: string) => {
  return res
    .map((r, index) => {
      if (r.reverted) throw new Error(`Clause ${index + 1} reverted: ${r.revertReason}`)

      const decoded = proposalDepositAbi.decode(r.data)
      const proposalId = filteredProposals[index]?.proposalId as string
      const deposit = decoded[0] as string

      // Cache individual proposal deposit
      queryClient.setQueryData(getProposalUserDepositQueryKey(proposalId, userAddress), deposit)

      return { proposalId, deposit }
    })
    .filter(({ deposit }) => deposit !== "0") // Remove zero deposits
}

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

  const { filteredProposals, isLoading: filteredProposalsLoading } = useFilteredProposals(CLAIMABLE_STATES)

  return useQuery({
    queryKey: getProposalUserDepositQueryKey("allClaimableDeposits", userAddress),
    enabled: !!thor && !!userAddress && !filteredProposalsLoading,
    queryFn: async () => {
      // Prepare the clauses to fetch relevant user deposits
      const clauses = filteredProposals.map(proposal => ({
        to: GOVERNOR_CONTRACT,
        value: "0x0",
        data: proposalDepositAbi.encode(proposal.proposalId, userAddress),
      }))

      const res = await thor.explain(clauses).execute()
      const claimableDeposits = processDeposits(res, filteredProposals, userAddress)

      return {
        claimableDeposits,
        totalClaimableDeposits: claimableDeposits.reduce((acc, { deposit }) => acc + BigInt(deposit), BigInt(0)),
      }
    },
  })
}
