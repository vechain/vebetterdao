import { ThorClient } from "@vechain/sdk-network"
import { ABIContract } from "@vechain/sdk-core"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"

/**
 * Gets the round snapshot (start block) for a given round ID
 * @param thor - The ThorClient instance
 * @param contractAddress - The XAllocationVoting contract address
 * @param roundId - The round ID to get the snapshot for
 * @returns The block number at which the round started
 */
export const getRoundSnapshot = async (thor: ThorClient, contractAddress: string, roundId: number): Promise<number> => {
  const xAllocationVotingContract = ABIContract.ofAbi(XAllocationVoting__factory.abi)
  const roundSnapshotResult = await thor.contracts.executeCall(
    contractAddress,
    xAllocationVotingContract.getFunction("roundSnapshot"),
    [roundId],
  )

  if (!roundSnapshotResult.success) {
    throw new Error("Failed to get round snapshot")
  }

  return Number(roundSnapshotResult.result?.array?.[0] ?? 0)
}
