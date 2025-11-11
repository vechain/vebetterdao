import { getConfig } from "@repo/config"
import { EventLogs, FilterCriteria, ThorClient } from "@vechain/sdk-network"
import { Abi, ContractEventName, decodeEventLog as viemDecodeEventLog } from "viem"

import { decodeEventLog, getAllEventLogs } from "./getEvents"

export type FetchContractEventsParams<T extends Abi, K extends ContractEventName<T>, R> = {
  thor: ThorClient
  abi: T
  contractAddress: string
  eventName: K
  filterParams?: Record<string, unknown> | unknown[] | undefined
  mapResponse: ({
    meta,
    decodedData,
  }: {
    meta: EventLogs["meta"]
    decodedData: ReturnType<typeof viemDecodeEventLog<T, K>>
  }) => R
}

/**
 * Fetch and decode contract events from blockchain.
 * Works in both Node.js and browser environments (when thor client is provided).
 * Server-side compatible version of useEvents hook.
 */
export const fetchContractEvents = async <T extends Abi, K extends ContractEventName<T>, R>({
  thor,
  abi,
  contractAddress,
  eventName,
  filterParams,
  mapResponse,
}: FetchContractEventsParams<T, K, R>): Promise<R[]> => {
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
    await getAllEventLogs({
      thor,
      nodeUrl: getConfig().nodeUrl,
      filterCriteria,
    })
  ).map(event => decodeEventLog(event, abi))

  if (events.some(({ decodedData }) => decodedData.eventName !== eventName)) {
    throw new Error(`Unknown event`)
  }

  return events.map(event =>
    mapResponse({
      meta: event.meta,
      decodedData: event.decodedData as ReturnType<typeof viemDecodeEventLog<T, K>>,
    }),
  )
}
