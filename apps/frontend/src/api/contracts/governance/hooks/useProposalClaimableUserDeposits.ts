import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts/factories/B3TRGovernor__factory"
import { useThor, executeMultipleClausesCall } from "@vechain/vechain-kit"

import { getProposalsWithTypes } from "@/app/proposals/page"

import { ProposalFilter, StateFilter } from "../../../../store/useProposalFilters"

const abi = B3TRGovernor__factory.abi
const address = getConfig().b3trGovernorAddress as `0x${string}`

// Filters for proposals that have claimable deposits
const CLAIMABLE_STATES = [
  ProposalFilter.InThisRound, // Active
  StateFilter.Canceled,
  StateFilter.Defeated,
  StateFilter.Succeeded,
  StateFilter.Queued,
  StateFilter.Executed,
  StateFilter.DepositNotMet,
] as const

type ClaimableState = (typeof CLAIMABLE_STATES)[number]

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
  return useQuery({
    queryKey: getProposalClaimableUserDepositsQueryKey(userAddress),
    enabled: !!thor && !!userAddress,
    queryFn: async () => {
      const proposals = await getProposalsWithTypes(thor)
      const [proposalDeposits, proposalStates] = await Promise.all([
        executeMultipleClausesCall({
          thor,
          calls: proposals.map(
            proposal =>
              ({
                abi,
                address,
                functionName: "getUserDeposit",
                args: [BigInt(proposal.proposalId || 0), userAddress],
              }) as const,
          ),
        }),
        executeMultipleClausesCall({
          thor,
          calls: proposals.map(
            proposal =>
              ({
                abi,
                address,
                functionName: "state",
                args: [proposal.proposalId],
              }) as const,
          ),
        }),
      ])

      const claimableDeposits = proposalDeposits
        .filter(
          (deposit, idx) =>
            deposit.toString() !== "0" && CLAIMABLE_STATES.includes(proposalStates[idx] as unknown as ClaimableState),
        )
        .map((deposit, idx) => ({
          proposalId: proposals[idx]?.proposalId.toString()!,
          deposit: deposit.toString(),
        }))

      return {
        claimableDeposits,
        totalClaimableDeposits: claimableDeposits.reduce((acc, { deposit }) => acc + BigInt(deposit), BigInt(0)),
      }
    },
  })
}
