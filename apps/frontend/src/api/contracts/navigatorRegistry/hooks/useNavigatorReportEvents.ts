import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"

import { getEventsKey, useEvents } from "@/hooks/useEvents"

const abi = NavigatorRegistry__factory.abi
const contractAddress = getConfig().navigatorRegistryContractAddress as `0x${string}`
const eventName = "ReportSubmitted" as const

export const getNavigatorReportEventsKey = (navigator?: string) =>
  getEventsKey({ eventName, filterParams: { navigator } })

export const useNavigatorReportEvents = (navigator?: string) => {
  return useEvents({
    abi,
    contractAddress,
    eventName,
    filterParams: { navigator: (navigator ?? "") as `0x${string}` },
    select: events =>
      events.map(({ decodedData }) => ({
        navigator: decodedData.args.navigator,
        roundId: decodedData.args.roundId.toString(),
        reportURI: decodedData.args.reportURI,
      })),
    enabled: !!navigator,
  })
}
