import { getConfig } from "@repo/config"
import { B3TRGovernor__factory } from "@vechain/vebetterdao-contracts"
import { getCallClauseQueryKeyWithArgs, useCallClause } from "@vechain/vechain-kit"

const address = getConfig().b3trGovernorAddress
const abi = B3TRGovernor__factory.abi
const method = "proposalDepositThreshold" as const
/**
 * Returns the query key for fetching the deposit threshold from the governor contract.
 * @param proposalId - The id of the proposal to get the threshold for.
 * @returns The query key for fetching the deposit threshold.
 */
export const getProposalDepositThresholdQueryKey = (proposalId: string) =>
  getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(proposalId)] })
/**
 * Hook to get the proposal deposit threshold from the governor contract (i.e the number of votes required to go to voting phase)
 * @param proposalId - The id of the proposal to get the threshold for.
 * @returns the current proposal deposit threshold
 */
export const useProposalDepositThreshold = (proposalId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(proposalId)],
    queryOptions: {
      select: data => data[0],
    },
  })
}
