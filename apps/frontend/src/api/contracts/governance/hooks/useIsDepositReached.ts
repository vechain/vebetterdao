import { useQuery } from "@tanstack/react-query"
import { useThor } from "@vechain/vechain-kit"
import { ThorClient } from "@vechain/sdk-network"
import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@repo/contracts/typechain-types"

const GOVERNANCE_CONTRACT = getConfig().b3trGovernorAddress

/**
 * Retrieves the deposit reached status for a proposal.
 * @param thor - The ThorClient instance.
 * @param proposalId - The ID of the proposal.
 * @returns A Promise that resolves to a boolean indicating whether the deposit is reached or not.
 * @throws An error if the proposalId is not provided or if the method call fails.
 */
export const getIsDepositReached = async (thor: ThorClient, proposalId: string): Promise<boolean> => {
  if (!proposalId) throw new Error("proposalId is required")

  const res = await thor.contracts
    .load(GOVERNANCE_CONTRACT, B3TRGovernor__factory.abi)
    .read.proposalDepositReached(proposalId)

  if (!res) return Promise.reject(new Error("Proposal deposit reached call failed"))

  return res[0] as boolean
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
  const thor = useThor()

  return useQuery({
    queryKey: getIsDepositReachedQueryKey(proposalId),
    queryFn: async () => await getIsDepositReached(thor, proposalId),
    enabled: !!thor && !!proposalId,
  })
}
