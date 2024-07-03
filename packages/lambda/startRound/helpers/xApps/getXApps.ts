import { ThorClient } from "@vechain/sdk-network"
import mainnetConfig from "@repo/config/mainnet"
import { FunctionFragment, coder } from "@vechain/sdk-core"
import { XApp } from "../types"
import { X2EarnApps__factory as X2EarnApps } from "@repo/contracts"

/**
 * Retrieves the xApps for the specified round.
 * @param thor - The ThorClient instance.
 * @param roundId - The round ID to retrieve xApps for.
 * @returns an array of xApps for the specified round.
 */
export const getRoundXApps = async (thor: ThorClient, roundId: string): Promise<XApp[]> => {
  const res = await thor.contracts.executeContractCall(
    mainnetConfig.x2EarnAppsContractAddress,
    X2EarnApps.createInterface().getFunction("apps") as FunctionFragment,
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
