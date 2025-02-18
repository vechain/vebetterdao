import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { getProposalUserDepositQueryKey, proposalDepositAbi } from "./useProposalUserDeposit"
import { queryClient } from "@/api/QueryProvider"
import { useAllProposalsState } from "./useAllProposalsState"
import { ProposalState } from "./useProposalState"
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
 * @param proposalIds - An array of proposal IDs for which the deposits are to be fetched.
 * @returns An array of results from the `useQueries` function, each corresponding to a proposal's deposit data.
 */
export const useProposalClaimableUserDeposits = (userAddress: string, proposalIds: string[]) => {
  const { thor } = useConnex()

  const { data: proposalStates, isLoading: proposalStatesLoading } = useAllProposalsState(proposalIds)

  return useQuery({
    queryKey: getProposalUserDepositQueryKey("proposalClaimableDeposits", userAddress),
    enabled: !!thor && !!userAddress && proposalIds.length > 0 && !proposalStatesLoading,
    queryFn: async () => {
      // Only build clauses for proposals that are not in the Pending state
      const clauses = proposalIds
        .filter(proposalId => proposalStates?.find(p => p.proposalId === proposalId)?.state !== ProposalState.Pending)
        .map(proposalId => ({
          to: GOVERNOR_CONTRACT,
          value: "0x0",
          data: proposalDepositAbi.encode(proposalId, userAddress),
        }))

      const res = await thor.explain(clauses).execute()

      const proposalsDeposit = res
        .map((r, index) => {
          if (r.reverted) {
            throw new Error(`Clause ${index + 1} reverted with reason ${r.revertReason}`)
          }
          const decoded = proposalDepositAbi.decode(r.data)
          const proposalId = proposalIds[index] as string
          const deposit = decoded[0] as string

          // Update the cache for the individual proposal deposit query
          queryClient.setQueryData(getProposalUserDepositQueryKey(proposalId, userAddress), deposit)

          return {
            proposalId,
            deposit,
          }
        })
        .filter(proposal => proposal.deposit !== "0")

      return proposalsDeposit
    },
  })
}
