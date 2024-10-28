import { getCallKey, useCall } from "@/hooks"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@repo/contracts/typechain-types"

const XALLOCATIONVOTING_CONTRACT = getConfig().xAllocationVotingContractAddress
const xAllocationVotingInterface = XAllocationVoting__factory.createInterface()
const method = "roundSnapshot"

/**
 * Returns the query key for fetching the round snapshot.
 * @param roundId - The round id.
 * @returns The query key for fetching the round snapshot.
 */
export const getAllocationRoundSnapshotQueryKey = (roundId: string) => {
  return getCallKey({ method, keyArgs: [roundId] })
}

/**
 * Hook to get the round snapshot from the XAllocationVoting contract.
 * @param roundId - The round id.
 * @returns The round snapshot.
 */
export const useAllocationRoundSnapshot = (roundId: string) => {
  return useCall({
    contractInterface: xAllocationVotingInterface,
    contractAddress: XALLOCATIONVOTING_CONTRACT,
    method: "roundSnapshot",
    args: [roundId],
    enabled: !!roundId,
  })
}
