import { useQuery } from "@tanstack/react-query"
import { getAllEventLogs, useThor } from "@vechain/vechain-kit"
import { FilterCriteria } from "@vechain/sdk-network"
import { useCallback, useMemo } from "react"
import { Abi, ExtractAbiEventNames } from "abitype"
import { getConfig } from "@repo/config"
import { ExtractEventParams } from "@/api"

export type UseEventsParams<T extends Abi, K extends ExtractAbiEventNames<T>, R> = {
  abi: T
  contractAddress: string
  eventName: K
  filterParams?: Record<string, unknown> | unknown[] | undefined
  mapResponse: (decoded: ExtractEventParams<T, K>, meta: { blockNumber: number; txOrigin: string; txId: string }) => R
}

/**
 * Custom hook for fetching contract events.
 */
export const useEvents = <T extends Abi, K extends ExtractAbiEventNames<T>, R>({
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

    const events = await getAllEventLogs({ thor, nodeUrl: getConfig().nodeUrl, filterCriteria })

    return events.map(event => {
      const decoded = event.decodedData as ExtractEventParams<T, K>
      return mapResponse(decoded, {
        blockNumber: event.meta.blockNumber,
        txOrigin: event.meta.txOrigin,
        txId: event.meta.txID,
      })
    })
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
