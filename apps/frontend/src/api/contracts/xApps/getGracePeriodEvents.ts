import { abi } from "thor-devkit"
import { getAllEvents } from "@/api/blockchain/getEvents"
import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@repo/contracts"

const X2_EARN_APP_CONTRACT = getConfig().x2EarnAppsContractAddress

export type AppGracePeriodStartedEvent = {
  appId: string
  startBlock: string
  endBlock: string
  blockNumber: number
  txOrigin: string
}

export const getGracePeriodEvent = async (thor: Connex.Thor, appId?: string): Promise<AppGracePeriodStartedEvent[]> => {
  const eventFragment = X2EarnApps__factory.createInterface().getEvent("AppUnendorsedGracePeriodStarted").format("json")
  const appGracePeriodStartedEvent = new abi.Event(JSON.parse(eventFragment) as abi.Event.Definition)

  const appIdBytes = appId ? `0x${BigInt(appId).toString(16).padStart(64, "0")}` : undefined

  /**
   * Filter criteria to get the events from the X2EarnApps contract that we are interested in
   * This way we can get all of them in one call
   */
  const filterCriteria = [
    {
      address: X2_EARN_APP_CONTRACT,
      topic0: appGracePeriodStartedEvent.signature,
      topic1: appIdBytes,
    },
  ]

  const events = await getAllEvents({ thor, filterCriteria })

  return events.map(event => {
    const decoded = appGracePeriodStartedEvent.decode(event.data, event.topics)
    return {
      appId: decoded[0],
      startBlock: decoded[1].toString(),
      endBlock: decoded[2].toString(),
      blockNumber: event.meta.blockNumber,
      txOrigin: event.meta.txOrigin,
    }
  })
}
