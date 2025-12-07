import { EventLogs, FilterEventLogsOptions, ThorClient } from "@vechain/sdk-network"
import { Abi, decodeEventLog as viemDecodeEventLog, Hex as ViemHex } from "viem"

type Topics = [] | [signature: ViemHex, ...args: ViemHex[]]
export const decodeEventLog = <TAbi extends Abi>(
  event: EventLogs,
  abi: TAbi,
): {
  meta: EventLogs["meta"]
  decodedData: ReturnType<typeof viemDecodeEventLog<TAbi>>
} => {
  const decodedData = viemDecodeEventLog({
    abi,
    data: event.data.toString() as ViemHex,
    topics: event.topics.map(topic => topic.toString()) as Topics,
  })
  return {
    meta: event.meta,
    decodedData,
  }
}
const MAX_EVENTS_PER_QUERY = 1000
/**
 * Params for getEvents function
 * @param nodeUrl the node url
 * @param thor the thor client
 * @param auctionId  the auction id to get the events
 * @param order  the order of the events (asc or desc)
 * @param offset  the offset of the events
 * @param limit  the limit of the events (max 256)
 * @param from  the block number to start from
 * @param filterCriteria  the filter criteria for the events
 * @returns  the encoded events
 */
export type GetEventsProps = {
  nodeUrl: string
  thor: ThorClient
  order?: "asc" | "desc"
  offset?: number
  limit?: number
  from?: number
  to?: number
  filterCriteria: FilterEventLogsOptions["criteriaSet"]
}

export type GetEventQueryOptions = Pick<GetEventsProps, "order" | "offset" | "limit" | "from" | "to">

/**
 * Get events from blockchain (auction created, auction successful, auction cancelled)
 * @param order
 * @param offset
 * @param limit
 * @param from block parse start from
 */
export const getEventLogs = async ({
  thor,
  order = "asc",
  offset = 0,
  limit = MAX_EVENTS_PER_QUERY,
  from = 0,
  to = thor.blocks.getHeadBlock()?.number,
  filterCriteria,
}: GetEventsProps) => {
  const response = await thor.logs.filterEventLogs({
    range: {
      from,
      to,
      unit: "block",
    },
    options: {
      offset,
      limit,
    },
    order,
    criteriaSet: filterCriteria,
  })

  if (!response) throw new Error("Failed to fetch events")

  return response
}
