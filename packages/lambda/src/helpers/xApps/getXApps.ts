import { ThorClient } from "@vechain/sdk-network"
import { XAllocationVoting__factory as XAllocationVoting, X2EarnApps__factory as X2EarnApps } from "@repo/contracts"
import { AppConfig } from "@repo/config"
import { ABIContract } from "@vechain/sdk-core"

/**
 * Retrieves the xApps for the specified round.
 * @param thor - The ThorClient instance.
 * @param roundId - The round ID to retrieve xApps for.
 *
 * @returns an array of xApps Ids for the specified round.
 */
export const getRoundXApps = async (thor: ThorClient, roundId: string, config: AppConfig): Promise<string[]> => {
  const res = await thor.contracts.executeCall(
    config.xAllocationVotingContractAddress,
    ABIContract.ofAbi(XAllocationVoting.abi).getFunction("getAppIdsOfRound"),
    [Number(roundId)],
  )

  if (!res.success) return Promise.reject(new Error(res.result.errorMessage))

  const apps = res.result?.array?.[0] as string[]

  return apps
}

/**
 * Retrieves the all unendorsed xApps.
 * @param thor - The ThorClient instance.
 *
 * @returns an array of xApps IDs that are not endorsed.
 */
export const getUnendorsedXApps = async (thor: ThorClient, config: AppConfig): Promise<string[]> => {
  const res = await thor.contracts.executeCall(
    config.x2EarnAppsContractAddress,
    ABIContract.ofAbi(X2EarnApps.abi).getFunction("unendorsedAppIds"),
    [],
  )

  if (!res.success) return Promise.reject(new Error(res.result.errorMessage))

  const unendorsedAppIds = res.result?.array?.[0] as string[]

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
