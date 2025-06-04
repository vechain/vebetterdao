import { useQuery } from "@tanstack/react-query"
import { useThor, getAllEventLogs } from "@vechain/vechain-kit"
import { FilterCriteria } from "@vechain/sdk-network"
import { useCallback, useMemo } from "react"

export type UseEventsParams<T> = {
  contractAddress: string
  contractAbi: any[]
  eventName: string
  filterParams?: Record<string, any>
  mapResponse: (decoded: any[], meta: { blockNumber: number; txOrigin: string; txId: string }) => T
  fromBlock?: number
  toBlock?: number
}

/**
 * Custom hook for fetching contract events using VeChain Kit.
 */
export const useEvents = <T>({
  contractAddress,
  contractAbi,
  eventName,
  filterParams = {},
  mapResponse,
  fromBlock = 0,
  toBlock,
}: UseEventsParams<T>) => {
  const thor = useThor()

  const queryFn = useCallback(async (): Promise<T[]> => {
    if (!thor) return []

    // Load the contract and get the event ABI
    const contract = thor.contracts.load(contractAddress, contractAbi)
    const eventAbi = contract.getEventAbi(eventName)

    if (!eventAbi) {
      throw new Error(`Event ${eventName} not found in contract ABI`)
    }

    // Encode filter topics
    const topics = eventAbi.encodeFilterTopicsNoNull(filterParams)

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

    // Fetch events using getAllEventLogs
    const events = await getAllEventLogs({
      nodeUrl: thor.httpClient.baseURL,
      thor,
      from: fromBlock,
      to: toBlock,
      filterCriteria,
    })

    // Map and decode the events
    return events.map(event => {
      if (!event.decodedData) {
        throw new Error("Event data not decoded")
      }

      return mapResponse(event.decodedData as any[], {
        blockNumber: event.meta.blockNumber,
        txOrigin: event.meta.txOrigin,
        txId: event.meta.txID,
      })
    })
  }, [thor, contractAddress, contractAbi, eventName, filterParams, mapResponse, fromBlock, toBlock])

  const queryKey = useMemo(
    () => getEventsKey({ eventName, filterParams, fromBlock, toBlock }),
    [eventName, filterParams, fromBlock, toBlock],
  )

  return useQuery({
    queryFn,
    queryKey,
    enabled: !!thor,
  })
}

export type GetEventsKeyParams = {
  eventName: string
  filterParams?: Record<string, any>
  fromBlock?: number
  toBlock?: number
}

export const getEventsKey = ({ eventName, filterParams, fromBlock, toBlock }: GetEventsKeyParams) => {
  return [
    "vechain-kit-events",
    eventName,
    filterParams ? JSON.stringify(filterParams) : "all",
    fromBlock ?? "genesis",
    toBlock ?? "latest",
  ]
}
