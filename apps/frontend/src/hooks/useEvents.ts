import { useQuery } from "@tanstack/react-query"
import { getAllEventLogs, useThor } from "@vechain/vechain-kit"
import { EventLogs, FilterCriteria } from "@vechain/sdk-network"
import { useCallback, useMemo } from "react"
import { Abi } from "abitype"
import { getConfig } from "@repo/config"
import { decodeEventLog } from "@/api"
import { ContractEventName, decodeEventLog as viemDecodeEventLog } from "viem"

export type UseEventsParams<T extends Abi, K extends ContractEventName<T>, R> = {
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
 * Custom hook for fetching contract events.
 */
export const useEvents = <T extends Abi, K extends ContractEventName<T>, R>({
  abi,
  contractAddress,
  eventName,
  filterParams,
  mapResponse,
}: UseEventsParams<T, K, R>) => {
  const thor = useThor()

  const queryFn = useCallback(async () => {
    if (!thor) return []

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

    const events = (await getAllEventLogs({ thor, nodeUrl: getConfig().nodeUrl, filterCriteria })).map(event =>
      decodeEventLog(event, abi),
    )

    if (events.some(({ decodedData }) => decodedData.eventName !== eventName)) throw new Error(`Unknown event`)

    return events.map(event =>
      mapResponse({
        meta: event.meta,
        decodedData: event.decodedData as ReturnType<typeof viemDecodeEventLog<T, K>>,
      }),
    )
  }, [thor, contractAddress, abi, eventName, filterParams, mapResponse])

  const queryKey = useMemo(() => getEventsKey({ eventName, filterParams }), [eventName, filterParams])

  return useQuery({
    queryFn,
    queryKey,
    enabled: !!thor,
  })
}

export type GetEventsKeyParams = {
  eventName: string
  filterParams?: Object
}

export const getEventsKey = ({ eventName, filterParams }: GetEventsKeyParams) => {
  return [eventName, filterParams ? JSON.stringify(filterParams) : "all"]
}
