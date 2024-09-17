import { abi } from "thor-devkit"
import { getAllEvents } from "@/api/blockchain/getEvents"
import { getConfig } from "@repo/config"
import { X2EarnAppsJson } from "@repo/contracts"
const X2EarnAppsAbi = X2EarnAppsJson.abi

const X2_EARN_APP_CONTRACT = getConfig().x2EarnAppsContractAddress

export type AppEndorsedEvent = {
  appId: string
  nodeId: string
  endorsed: string
  blockMeta: Connex.Thor.Filter.WithMeta["meta"]
}

export const getEndorsementEvent = async (thor: Connex.Thor, appId?: string) => {
  const appEndorsedAbi = X2EarnAppsAbi.find(abi => abi.name === "AppEndorsed")
  if (!appEndorsedAbi) throw new Error("AppEndorsed event not found")
  const appEndorsedEvent = new abi.Event(appEndorsedAbi as abi.Event.Definition)

  const appIdBytes = appId ? `0x${BigInt(appId).toString(16).padStart(64, "0")}` : undefined

  /**
   * Filter criteria to get the events from the governor contract that we are interested in
   * This way we can get all of them in one call
   */
  const filterCriteria = [
    {
      address: X2_EARN_APP_CONTRACT,
      topic0: appEndorsedEvent.signature,
      topic1: appIdBytes,
    },
  ]

  const events = await getAllEvents({ thor, filterCriteria })

  /**
   * Decode the events to get the data we are interested in (i.e the endorsement of the app)
   */
  const decodedAppEndorsedEvent: AppEndorsedEvent[] = []

  events.forEach(event => {
    switch (event.topics[0]) {
      case appEndorsedEvent.signature: {
        const decoded = appEndorsedEvent.decode(event.data, event.topics)
        decodedAppEndorsedEvent.push({
          appId: decoded[0],
          nodeId: decoded[1],
          endorsed: decoded[2],
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
    endorsed: decodedAppEndorsedEvent,
  }
}
