import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"

import { getEventsKey, useEvents } from "@/hooks/useEvents"

const abi = NavigatorRegistry__factory.abi
const contractAddress = getConfig().navigatorRegistryContractAddress as `0x${string}`
const eventName = "AllocationPreferencesSet" as const

export const getNavigatorPreferenceEventsKey = (navigator?: string) =>
  getEventsKey({ eventName, filterParams: { navigator } })

export const useNavigatorPreferenceEvents = (navigator?: string) => {
  return useEvents({
    abi,
    contractAddress,
    eventName,
    filterParams: { navigator: (navigator ?? "") as `0x${string}` },
    select: events =>
      events.map(({ decodedData, meta }) => ({
        navigator: decodedData.args.navigator,
        roundId: decodedData.args.roundId.toString(),
        appIds: [...decodedData.args.appIds],
        blockNumber: meta.blockNumber,
      })),
    enabled: !!navigator,
  })
}
