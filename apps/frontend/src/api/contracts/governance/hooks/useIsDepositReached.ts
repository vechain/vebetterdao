import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"

import { getConfig } from "@repo/config"
import { B3TRGovernorJson } from "@repo/contracts"

const b3trGovernorAbi = B3TRGovernorJson.abi
const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

/**
 * Retrieves the deposit reached status for a proposal.
 * @param thor - The Connex.Thor instance.
 * @param proposalId - The ID of the proposal.
 * @returns A Promise that resolves to a boolean indicating whether the deposit is reached or not.
 * @throws An error if the proposalId is not provided or if the 'proposalDepositReached' function is not found.
 */
export const getIsDepositReached = async (thor: Connex.Thor, proposalId: string): Promise<boolean> => {
  if (!proposalId) throw new Error("proposalId is required")

  const getIsDepositReachedAbi = b3trGovernorAbi.find(abi => abi.name === "proposalDepositReached")
  if (!getIsDepositReachedAbi) throw new Error("proposalDepositReached function not found")
  const res = await thor.account(GOVERNANCE_CONTRACT).method(getIsDepositReachedAbi).call(proposalId)

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  return res.decoded[0]
}

/**
 * Generates the query key for the 'getIsDepositReached' function.
 * @param proposalId - The ID of the proposal.
 * @returns An array representing the query key.
 */
export const getIsDepositReachedQueryKey = (proposalId: string) => ["proposalDepositReached", proposalId]

/**
 * Custom hook for retrieving the deposit reached status for a proposal.
 * @param proposalId - The ID of the proposal.
 * @returns The result of the query.
 */
export const useIsDepositReached = (proposalId: string) => {
  const { thor } = useConnex()

  return useQuery({
    queryKey: getIsDepositReachedQueryKey(proposalId),
    queryFn: async () => await getIsDepositReached(thor, proposalId),
    enabled: !!thor && !!proposalId,
  })
}
