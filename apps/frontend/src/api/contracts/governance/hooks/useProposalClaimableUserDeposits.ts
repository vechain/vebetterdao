import { useQueries } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { ProposalCreatedEvent } from "./useProposalsEvents"
import { getProposalUserDeposit } from "./useProposalUserDeposit"
import { ProposalState, getProposalState, getProposalStateQueryKey } from "./useProposalState"
import { ProposalDeposit } from "../utils"
import { queryClient } from "@/api/QueryProvider"

/**
 * Returns a key used for deposit queries in the context of a proposal.
 *
 * This function constructs and returns an array that uniquely identifies the deposit information
 * for a given proposal and user within the application's caching layer.
 *
 * @param proposalId - The unique identifier for the proposal.
 * @param userAddress - The Ethereum address of the user.
 * @returns An array of strings that form the query key.
 */
export const getProposalDepositKey = (proposalId: string, userAddress: string) => [
  "proposals",
  proposalId,
  "deposit",
  userAddress,
]

/**
 * Custom React hook that fetches and monitors claimable user deposits for each proposal.
 *
 * This hook utilizes the `useQueries` function from `@tanstack/react-query` to manage a series
 * of concurrent queries. Each query corresponds to a single proposal and fetches the deposit
 * details that are claimable by the specified user. Deposits can only be claimed if the proposal
 * state is not pending.
 *
 * @param proposals - An array of `ProposalCreatedEvent` representing the proposals to be queried.
 * @param userAddress - The address of the user whose deposits are to be fetched.
 * @returns An array of results from the `useQueries` function, each corresponding to a proposal's deposit data.
 */
export const useProposalClaimableUserDeposits = (proposals: ProposalCreatedEvent[], userAddress: string) => {
  const { thor } = useConnex()

  const proposalIds = useMemo(() => {
    return proposals.map(proposal => proposal.proposalId)
  }, [proposals])

  return useQueries({
    queries: proposalIds.map(proposalId => ({
      queryKey: getProposalDepositKey(proposalId, userAddress),
      queryFn: async () => {
        const state = await queryClient.ensureQueryData({
          queryKey: getProposalStateQueryKey(proposalId),
          queryFn: () => getProposalState(thor, proposalId),
        })

        if (state === ProposalState.Pending) return { proposalId, deposit: "0" } as ProposalDeposit

        const deposit = await getProposalUserDeposit(thor, proposalId, userAddress)

        const proposalDeposit: ProposalDeposit = {
          proposalId,
          deposit,
        }

        return proposalDeposit
      },
    })),
  })
}
