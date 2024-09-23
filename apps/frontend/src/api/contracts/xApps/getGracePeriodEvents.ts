import { abi } from "thor-devkit"
import { getAllEvents } from "@/api/blockchain/getEvents"
import { getConfig } from "@repo/config"
import { X2EarnAppsJson } from "@repo/contracts"
const X2EarnAppsAbi = X2EarnAppsJson.abi

const X2_EARN_APP_CONTRACT = getConfig().x2EarnAppsContractAddress

export type AppGracePeriodStartedEvent = {
  appId: string
  clock: string
  endBlock: string
  blockMeta: Connex.Thor.Filter.WithMeta["meta"]
}

export const getGracePeriodEvent = async (thor: Connex.Thor, appId?: string) => {
  const appGracePeriodStartedAbi = X2EarnAppsAbi.find(abi => abi.name === "AppUnendorsedGracePeriodStarted")
  if (!appGracePeriodStartedAbi) throw new Error("AppUnendorsedGracePeriodStarted event not found")
  const appGracePeriodStartedEvent = new abi.Event(appGracePeriodStartedAbi as abi.Event.Definition)

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

  /**
   * Decode the events to get the data we are interested in (i.e the endorsement grace period of the app)
   */
  const decodedAppGracePeriodStartedEvent: AppGracePeriodStartedEvent[] = []

  events.forEach(event => {
    switch (event.topics[0]) {
      case appGracePeriodStartedEvent.signature: {
        const decoded = appGracePeriodStartedEvent.decode(event.data, event.topics)
        decodedAppGracePeriodStartedEvent.push({
          appId: decoded[0],
          clock: decoded[1],
          endBlock: decoded[2],
          blockMeta: event.meta,
        })
        break
      }
      default: {
        throw new Error("Unknown event")
      }
    }
  })

  return {
    gracePeriodEvent: decodedAppGracePeriodStartedEvent,
  }
}
