import { useQuery } from "@tanstack/react-query"
import { EventLogs } from "@vechain/sdk-network"
import { useThor } from "@vechain/vechain-kit"
import { Abi } from "abitype"
import { ContractEventName, decodeEventLog as viemDecodeEventLog } from "viem"

import { fetchContractEvents } from "../api/contracts/governance/fetchContractEvents"

type FilterParams = Record<string, unknown> | unknown[] | undefined

export type EventResult<T extends Abi, K extends ContractEventName<T>> = {
  meta: EventLogs["meta"]
  decodedData: ReturnType<typeof viemDecodeEventLog<T, K>>
}

export type UseEventsParams<T extends Abi, K extends ContractEventName<T>, TSelect = EventResult<T, K>[]> = {
  abi: T
  contractAddress: string
  eventName: K
  filterParams?: FilterParams
  select?: (data: EventResult<T, K>[]) => TSelect
  enabled?: boolean
}

/**
 * Custom hook for fetching contract events (client-side).
 * For server-side usage, use fetchContractEvents directly.
 */
export const useEvents = <T extends Abi, K extends ContractEventName<T>, TSelect = EventResult<T, K>[]>({
  abi,
  contractAddress,
  eventName,
  filterParams,
  select,
  enabled = true,
}: UseEventsParams<T, K, TSelect>) => {
  const thor = useThor()

  return useQuery({
    queryKey: getEventsKey({ eventName, filterParams }),
    queryFn: () =>
      fetchContractEvents({
        thor,
        abi,
        contractAddress,
        eventName,
        filterParams,
      }),
    select,
    enabled,
    staleTime: 5 * 1000 * 60,
  })
}

export type GetEventsKeyParams = {
  eventName: string
  filterParams?: FilterParams
}

export const getEventsKey = ({ eventName, filterParams }: GetEventsKeyParams) => [
  "abcd",
  eventName,
  Array.isArray(filterParams)
    ? filterParams
    : filterParams && Object.values(filterParams).length > 0
      ? Object.values(filterParams)
      : "all",
  // filterParams && Object.values(filterParams).length > 0 ? Object.values(filterParams) : "all",
]
