import { getConfig } from "@repo/config"
import { EventLogs, FilterCriteria, ThorClient } from "@vechain/sdk-network"
import { Abi, ContractEventArgs, ContractEventName, decodeEventLog as viemDecodeEventLog } from "viem"

import { decodeEventLog, getEventLogs, GetEventQueryOptions } from "./getEvents"

export type FetchContractEventsParams<T extends Abi, K extends ContractEventName<T>> = {
  thor: ThorClient
  abi: T
  contractAddress: string
  eventName: K
  filterParams?: ContractEventArgs<T, K>
} & GetEventQueryOptions

const B3TR_GOVERNOR_CREATION_BLOCK = 18868872

/**
 * Fetch and decode contract events from blockchain.
 * Works in both Node.js and browser environments (when thor client is provided).
 * Server-side compatible version of useEvents hook.
 */
export const fetchContractEvents = async <T extends Abi, K extends ContractEventName<T>>({
  thor,
  abi,
  contractAddress,
  eventName,
  filterParams,
  from = B3TR_GOVERNOR_CREATION_BLOCK,
  to,
  order = "desc",
  offset,
  limit,
}: FetchContractEventsParams<T, K>) => {
  const eventAbi = thor.contracts.load(contractAddress, abi).getEventAbi(eventName)
  const topics = eventAbi.encodeFilterTopicsNoNull(filterParams ?? {})

  // Construct filter criteria
  const filterCriteria: FilterCriteria[] = [
    {
      criteria: {
        address: contractAddress,
        topic0: topics[0] ?? undefined,
        topic1: topics[1] ?? undefined,
        topic2: topics[2] ?? undefined,
        topic3: topics[3] ?? undefined,
        topic4: topics[4] ?? undefined,
      },
      eventAbi,
    },
  ]

  const events = (
    await getEventLogs({
      thor,
      nodeUrl: getConfig().nodeUrl,
      filterCriteria,
      from,
      to,
      order,
      offset,
      limit,
    })
  ).map(event => decodeEventLog(event, abi))

  if (events.some(({ decodedData }) => decodedData.eventName !== eventName)) {
    throw new Error(`Unknown event`)
  }

  return events.map(event => ({
    meta: event.meta as EventLogs["meta"],
    decodedData: event.decodedData as ReturnType<typeof viemDecodeEventLog<T, K>>,
  }))
}
