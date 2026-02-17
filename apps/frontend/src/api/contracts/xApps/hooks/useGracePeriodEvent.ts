import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/x-2-earn-apps/X2EarnApps__factory"

import { useEvents } from "@/hooks/useEvents"

const abi = X2EarnApps__factory.abi
const contractAddress = getConfig().x2EarnAppsContractAddress

export const useGracePeriodEvent = (appId?: string) =>
  useEvents({
    abi,
    contractAddress,
    eventName: "AppUnendorsedGracePeriodStarted",
    filterParams: appId ? { appId: appId as `0x${string}` } : undefined,
    order: "desc", //We care only to the latest grace period event to display a banner in app page
    limit: 1,
    select: events => {
      const latest = events[0]
      if (!latest) return undefined
      const { meta, decodedData } = latest
      const { blockNumber, txOrigin } = meta
      const { appId: id, startBlock, endBlock } = decodedData.args
      return {
        appId: id.toString(),
        startBlock: startBlock.toString(),
        endBlock: endBlock.toString(),
        blockNumber,
        txOrigin,
      }
    },
    enabled: !!appId,
  })
