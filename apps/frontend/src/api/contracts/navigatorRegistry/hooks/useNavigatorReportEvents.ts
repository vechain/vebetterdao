import { getConfig } from "@repo/config"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"

import { getEventsKey, useEvents } from "@/hooks/useEvents"

const abi = NavigatorRegistry__factory.abi
const contractAddress = getConfig().navigatorRegistryContractAddress as `0x${string}`
const eventName = "ReportSubmitted" as const

// Normalize address case so the React Query key is canonical regardless of whether
// the caller passes a checksummed or lowercased address. Without this, the cache key
// produced by callers (URL params, wallet account, indexer payload, etc.) can diverge
// and `invalidateQueries` after a new report submission silently misses.
const normalize = (navigator?: string) => (navigator ? navigator.toLowerCase() : "")

export const getNavigatorReportEventsKey = (navigator?: string) =>
  getEventsKey({ eventName, filterParams: { navigator: normalize(navigator) } })

export const useNavigatorReportEvents = (navigator?: string) => {
  return useEvents({
    abi,
    contractAddress,
    eventName,
    filterParams: { navigator: normalize(navigator) as `0x${string}` },
    select: events =>
      events.map(({ decodedData }) => ({
        navigator: decodedData.args.navigator,
        roundId: decodedData.args.roundId.toString(),
        reportURI: decodedData.args.reportURI,
      })),
    enabled: !!navigator,
  })
}
