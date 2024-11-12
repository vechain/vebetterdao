import { ThorClient } from "@vechain/sdk-network"
import mainnetConfig from "@repo/config/mainnet"
import { FunctionFragment } from "@vechain/sdk-core"
import { XAllocationVoting__factory as XAllocationVoting, X2EarnApps__factory as X2EarnApps } from "@repo/contracts"
import { AppConfig } from "@repo/config"

/**
 * Retrieves the xApps for the specified round.
 * @param thor - The ThorClient instance.
 * @param roundId - The round ID to retrieve xApps for.
 *
 * @returns an array of xApps Ids for the specified round.
 */
export const getRoundXApps = async (thor: ThorClient, roundId: string, config: AppConfig): Promise<string[]> => {
  const res = await thor.contracts.executeContractCall(
    config.xAllocationVotingContractAddress,
    XAllocationVoting.createInterface().getFunction("getAppIdsOfRound"),
    [Number(roundId)],
  )

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const apps = res[0]

  return apps
}

/**
 * Retrieves the all unendorsed xApps.
 * @param thor - The ThorClient instance.
 *
 * @returns an array of xApps IDs that are not endorsed.
 */
export const getUnendorsedXApps = async (thor: ThorClient, config: AppConfig): Promise<string[]> => {
  const res = await thor.contracts.executeContractCall(
    config.x2EarnAppsContractAddress,
    X2EarnApps.createInterface().getFunction("unendorsedAppIds"),
    [],
  )

  if (res.vmError) return Promise.reject(new Error(res.vmError))

  const unendorsedAppIds = res[0]

  return unendorsedAppIds
}

/**
 * Retrieves all xApps.
 * @param thor - The ThorClient instance.
 * @param roundId - The round ID to retrieve xApps for.
 * @returns an array of xApps Ids that are eligible or not endorsed.
 */
export const getAllApps = async (thor: ThorClient, roundId: string, config: AppConfig): Promise<string[]> => {
  const eligibleApps = await getRoundXApps(thor, roundId, config)
  const unendorsedApps = await getUnendorsedXApps(thor, config)

  const allApps = Array.from(new Set([...eligibleApps, ...unendorsedApps]))

  return allApps
}
