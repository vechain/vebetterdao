import { getAllEventLogs, ThorClient } from "@vechain/vechain-kit"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts/typechain-types"
import { EnvConfig } from "@repo/config/contracts"
import { FilterCriteria } from "@vechain/sdk-network"

export type GracePeriodStartedEvent = {
  appId: string
  startBlock: string
  endBlock: string
  blockNumber: number
  txOrigin: string
}

/**
 * Get the grace period events from the X2EarnApps contract
 * @param thor - The thor client
 * @param env - The environment config
 * @param appId - The app id to get the events (optional)
 * @returns The grace period started events
 */
export const getGracePeriodEvent = async (
  thor: ThorClient,
  env: EnvConfig,
  appId?: string,
): Promise<GracePeriodStartedEvent[]> => {
  const x2EarnAppContractAddress = getConfig(env).x2EarnAppsContractAddress

  const eventAbi = thor.contracts
    .load(x2EarnAppContractAddress, X2EarnApps__factory.abi)
    .getEventAbi("AppUnendorsedGracePeriodStarted")

  const appIdBytes = appId ? `0x${BigInt(appId).toString(16).padStart(64, "0")}` : undefined

  const topics = eventAbi.encodeFilterTopicsNoNull({
    ...(appId ? { appId: appIdBytes } : {}),
  })

  /**
   * Filter criteria to get the events from the X2EarnApps contract that we are interested in
   * This way we can get all of them in one call
   */
  const filterCriteria: FilterCriteria[] = [
    {
      criteria: {
        address: x2EarnAppContractAddress,
        topic0: topics[0] ?? undefined,
        topic1: appIdBytes,
      },
      eventAbi,
    },
  ]

  const events = await getAllEventLogs({
    nodeUrl: thor.httpClient.baseURL,
    thor,
    from: 0,
    to: undefined,
    filterCriteria,
  })

  return events.map(event => {
    if (!event.decodedData) {
      throw new Error("Event data not decoded")
    }

    const [appId, startBlock, endBlock] = event.decodedData as [bigint, bigint, bigint]

    return {
      appId: appId.toString(),
      startBlock: startBlock.toString(),
      endBlock: endBlock.toString(),
      blockNumber: event.meta.blockNumber,
      txOrigin: event.meta.txOrigin,
    }
  })
}
