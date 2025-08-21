import { ThorClient } from "@vechain/sdk-network"
import { Clause, ABIContract, Address } from "@vechain/sdk-core"
import { XAllocationPool__factory as XAllocationPool } from "@vechain/vebetterdao-contracts"

/**
 * Retrieves the shares for the xApps in a specific round.
 *
 * @param thor - The ThorClient instance used to interact with the blockchain.
 * @param roundId - The ID of the round for which to get the xApp shares.
 * @param roundAppIds - An array of app IDs for which to get the shares.
 * @param contractAddress - The contract address.
 * @returns A promise that resolves to an array of objects containing the appId and its corresponding share percentage.
 * @throws An error if any contract call reverts.
 */
export const getRoundXAppShares = async (
  thor: ThorClient,
  roundId: Number,
  roundAppIds: string[],
  contractAddress: string,
) => {
  // Prepare the clauses to get the shares for the xApps in the round
  const clauses = roundAppIds.map(appId =>
    Clause.callFunction(
      Address.of(contractAddress),
      ABIContract.ofAbi(XAllocationPool.abi).getFunction("getAppShares"),
      [roundId, appId],
    ),
  )
  const res = await thor.transactions.simulateTransaction(clauses)

  // Transform the data to get the shares for the xApps in the round
  const shares = res.map((r, index) => {
    if (r.reverted) {
      throw new Error(
        `Error in contract call to XAllocationPool::getAppShares at ${contractAddress}. Clause ${index + 1} for appId ${roundAppIds[index]} and roundId ${roundId} reverted with reason ${r.vmError}`,
      )
    }
    const decoded = XAllocationPool.createInterface().decodeFunctionResult("getAppShares", r.data)
    const share = Number(decoded[0]) / 100
    const unallocatedShare = Number(decoded[1]) / 100

    return {
      appId: roundAppIds[index] as string,
      percentage: share + unallocatedShare,
    }
  })

  return shares
}
