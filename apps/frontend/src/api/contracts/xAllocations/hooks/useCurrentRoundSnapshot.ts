import { getConfig } from "@repo/config"
import { XAllocationVotingGovernor__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVotingGovernor__factory"
import { useCallClause, getCallClauseQueryKey } from "@vechain/vechain-kit"

const address = getConfig().xAllocationVotingContractAddress as `0x${string}`
const abi = XAllocationVotingGovernor__factory.abi
const method = "currentRoundSnapshot" as const

/**
 * Returns the query key for fetching the current round snapshot.
 * @returns The query key for fetching the current round snapshot.
 */
export const getCurrentRoundSnapshotQueryKey = () => getCallClauseQueryKey({ abi, address, method })

/**
 * Hook to get the current round snapshot from the XAllocationVotingGovernor contract.
 * This combines currentRoundId() and roundSnapshot() into a single call.
 * @returns The snapshot block number for the current allocation round.
 */
export const useCurrentRoundSnapshot = () => {
  return useCallClause({
    abi,
    address,
    method,
    args: [],
    queryOptions: {
      select: data => data[0].toString(),
    },
  })
}
