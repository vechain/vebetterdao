import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { getProposalUserDepositQueryKey } from "./useProposalUserDeposit"
import { queryClient } from "@/api/QueryProvider"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"
import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { ProposalFilter, StateFilter } from "@/store"

const GOVERNOR_CONTRACT = getConfig().b3trGovernorAddress

// Filters for proposals that have claimable deposits
const CLAIMABLE_STATES = [
  ProposalFilter.InThisRound, // Active
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
  const contract = B3TRGovernor__factory.createInterface()

  return res
    .map((r, index) => {
      if (r.reverted) throw new Error(`Clause ${index + 1} reverted: ${r.revertReason}`)

      const decoded = contract.decodeFunctionResult("getUserDeposit", r.data)
      const proposalId = filteredProposals[index]?.proposalId as string
      const deposit = decoded[0].toString()

      // Cache individual proposal deposit
      queryClient.setQueryData(getProposalUserDepositQueryKey(proposalId, userAddress), deposit)

      return { proposalId, deposit }
    })
    .filter(({ deposit }) => deposit !== "0") // Remove zero deposits
}

/**
 * Custom React hook that fetches and monitors claimable user deposits for each proposal.
 *
 * This hook utilizes the `useQuery` function from `@tanstack/react-query` to manage a query.
 * The query corresponds to fetching the deposit details that are claimable by the specified user.
 * Deposits can only be claimed if the proposal state is not pending.
 *
 * @param userAddress - The address of the user whose deposits are to be fetched.
 * @returns Query result containing claimable deposits data.
 */
export const useProposalClaimableUserDeposits = (userAddress: string) => {
  const thor = useThor()

  const { filteredProposals, isLoading: filteredProposalsLoading } = useFilteredProposals(CLAIMABLE_STATES)

  return useQuery({
    queryKey: getProposalUserDepositQueryKey("allClaimableDeposits", userAddress),
    enabled: !!thor && !!userAddress && !filteredProposalsLoading,
    queryFn: async () => {
      // Prepare the clauses to fetch relevant user deposits
      const clauses = filteredProposals.map(proposal => ({
        to: GOVERNOR_CONTRACT,
        value: "0x0",
        data: B3TRGovernor__factory.createInterface().encodeFunctionData("getUserDeposit", [
          proposal.proposalId,
          userAddress,
        ]),
      }))

      const simulationResults = await thor.transactions.simulateTransaction(clauses)
      const claimableDeposits = processDeposits(simulationResults, filteredProposals, userAddress)

      return {
        claimableDeposits,
        totalClaimableDeposits: claimableDeposits.reduce((acc, { deposit }) => acc + BigInt(deposit), BigInt(0)),
      }
    },
  })
}
