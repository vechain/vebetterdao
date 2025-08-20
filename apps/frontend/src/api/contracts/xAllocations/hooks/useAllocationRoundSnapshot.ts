import { useCallClause, getCallClauseQueryKeyWithArgs } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain-kit/vebetterdao-contracts/typechain-types"

const address = getConfig().xAllocationVotingContractAddress
const abi = XAllocationVoting__factory.abi
const method = "roundSnapshot" as const

/**
 * Returns the query key for fetching the round snapshot.
 * @param roundId - The round id.
 * @returns The query key for fetching the round snapshot.
 */
export const getAllocationRoundSnapshotQueryKey = (roundId: string) => {
  return getCallClauseQueryKeyWithArgs({ abi, address, method, args: [BigInt(roundId)] })
}

/**
 * Hook to get the round snapshot from the XAllocationVoting contract.
 * @param roundId - The round id.
 * @returns The round snapshot.
 */
export const useAllocationRoundSnapshot = (roundId: string) => {
  return useCallClause({
    abi,
    address,
    method,
    args: [BigInt(roundId)],
    queryOptions: {
      enabled: !!roundId,
      select: data => data[0].toString(),
    },
  })
}
