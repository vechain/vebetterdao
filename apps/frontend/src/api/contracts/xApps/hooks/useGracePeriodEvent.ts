import { getConfig } from "@repo/config"
import { X2EarnApps__factory } from "@vechain/vebetterdao-contracts/factories/X2EarnApps__factory"

import { useEvents } from "@/hooks/useEvents"

const abi = X2EarnApps__factory.abi
const contractAddress = getConfig().x2EarnAppsContractAddress

export const useGracePeriodEvent = (appId?: string) =>
  useEvents({
    abi,
    contractAddress,
    eventName: "AppUnendorsedGracePeriodStarted",
    filterParams: [appId],
    select: events =>
      events.map(({ meta, decodedData }) => {
        const { blockNumber, txOrigin } = meta
        const { appId: id, startBlock, endBlock } = decodedData.args
        return {
          appId: id.toString(),
          startBlock: startBlock.toString(),
          endBlock: endBlock.toString(),
          blockNumber,
          txOrigin,
        }
      }),
    enabled: !!appId,
  })
