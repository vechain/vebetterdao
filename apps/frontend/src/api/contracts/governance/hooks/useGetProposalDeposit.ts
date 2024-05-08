import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts"

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

const governorInterface = B3TRGovernor__factory.createInterface()

/**
 * Retrieves the proposal deposit for a given proposal ID.
 * @param thor - The Connex.Thor instance.
 * @returns A Promise that resolves to the proposal deposit as a string.
 */
export const getProposalDeposit = async (thor: Connex.Thor): Promise<string> => {
  const functionFragment = governorInterface.getFunction("getProposalDeposits").format("json")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(JSON.parse(functionFragment)).call()

  if (res.vmError) return Promise.reject(new Error(res.vmError))
  return res.decoded[0]
}

/**
 * Generates the query key for retrieving proposal deposits.
 * @param proposalId - The ID of the proposal.
 * @returns The query key as an array.
 */
export const getProposalDepositQueryKey = (proposalId: string) => ["proposals", proposalId, "deposits"]

/**
 * Custom hook for fetching proposal deposits.
 * @param proposalId - The ID of the proposal.
 * @returns The result of the query.
 */
export const useProposalDeposits = (proposalId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getProposalDepositQueryKey(proposalId),
    queryFn: async () => await getProposalDeposit(thor),
    enabled: !!thor,
  })
}
