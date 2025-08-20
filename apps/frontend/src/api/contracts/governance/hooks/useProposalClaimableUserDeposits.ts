import { useQuery } from "@tanstack/react-query"
import { useThor, executeMultipleClausesCall } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { useFilteredProposals } from "@/app/proposals/hooks/useFilteredProposals"
import { ProposalFilter, StateFilter } from "@/store"
import { B3TRGovernor__factory } from "@vechain-kit/vebetterdao-contracts"

const GOVERNOR_CONTRACT = getConfig().b3trGovernorAddress as `0x${string}`
const abi = B3TRGovernor__factory.abi

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

export const getProposalClaimableUserDepositsQueryKey = (userAddress: string) => ["allClaimableDeposits", userAddress]

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
  const thor = useThor()
  const { filteredProposals, isLoading: filteredProposalsLoading } = useFilteredProposals(CLAIMABLE_STATES)

  return useQuery({
    queryKey: getProposalClaimableUserDepositsQueryKey(userAddress),
    enabled: !!thor && !!userAddress && !filteredProposalsLoading,
    queryFn: async () => {
      const res = await executeMultipleClausesCall({
        thor,
        calls: filteredProposals.map(
          proposal =>
            ({
              abi,
              address: GOVERNOR_CONTRACT,
              functionName: "getUserDeposit",
              args: [BigInt(proposal.proposalId || 0), userAddress],
            }) as const,
        ),
      })

      const claimableDeposits = res
        .map((deposit, index) => {
          return {
            proposalId: filteredProposals[index]?.proposalId as string,
            deposit: deposit.toString(),
          }
        })
        .filter(({ deposit }) => deposit !== "0")

      return {
        claimableDeposits,
        totalClaimableDeposits: claimableDeposits.reduce((acc, { deposit }) => acc + BigInt(deposit), BigInt(0)),
      }
    },
  })
}
