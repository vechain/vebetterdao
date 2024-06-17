import { ThorClient } from "@vechain/sdk-network"
import { xallocationsVotingABI } from "../const"
import testnetConfig from "@repo/config/testnet"
import { FunctionFragment, coder } from "@vechain/sdk-core"
import { XApp } from "../types"

/**
 * Retrieves the xApps for the specified round.
 * @param thor - The ThorClient instance.
 * @param roundId - The round ID to retrieve xApps for.
 * @returns an array of xApps for the specified round.
 */
export const getRoundXApps = async (thor: ThorClient, roundId: string): Promise<XApp[]> => {
  const res = await thor.contracts.executeContractCall(
    testnetConfig.xAllocationVotingContractAddress,
    coder.createInterface(xallocationsVotingABI).getFunction("getRoundAppsWithDetails") as FunctionFragment,
    [roundId],
  )

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const apps = res[0]

  return apps.map((app: any) => ({
    id: app[0],
    teamWalletAddress: app[1],
    name: app[2],
    createdAt: app[3],
  }))
}
