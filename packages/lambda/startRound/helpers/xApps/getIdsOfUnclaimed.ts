import { FunctionFragment } from "ethers"
import mainnetConfig from "@repo/config/mainnet"
import { ThorClient } from "@vechain/sdk-network"
import { XAllocationPool__factory as XAllocationPool } from "@repo/contracts"

/**
 * Retrieves the IDs of the xApps that have not yet claimed their rewards for the specified round.
 * @param thor - The ThorClient instance.
 * @param xapps - The xApps ids to check for unclaimed rewards.
 * @param roundId - The round ID to check for unclaimed rewards.
 *
 * @returns an array of xApp IDs that have not yet claimed their rewards.
 */
export const getIdsOfUnclaimed = async (thor: ThorClient, xapps: string[], roundId: string): Promise<string[]> => {
  const unclaimed: string[] = []

  for (const xappId of xapps) {
    const res = await thor.contracts.executeContractCall(
      mainnetConfig.xAllocationPoolContractAddress,
      XAllocationPool.createInterface().getFunction("claimed") as FunctionFragment,
      [Number(roundId), xappId],
    )

    if (res.vmError) return Promise.reject(new Error(res.vmError))

    if (!res[0]) {
      unclaimed.push(xappId)
    }
  }

  return unclaimed
}
