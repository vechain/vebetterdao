import { useQuery } from "@tanstack/react-query"
import { EventLogs } from "@vechain/sdk-network"
import { useThor } from "@vechain/vechain-kit"
import { Abi } from "abitype"
import { ContractEventArgs, ContractEventName, decodeEventLog as viemDecodeEventLog } from "viem"

import { GetEventQueryOptions } from "@/api/contracts/governance/getEvents"

import { fetchContractEvents } from "../api/contracts/governance/fetchContractEvents"

import { useContractDeployBlock } from "./useContractDeployBlock"

export type EventResult<T extends Abi, K extends ContractEventName<T>> = {
  meta: EventLogs["meta"]
  decodedData: ReturnType<typeof viemDecodeEventLog<T, K>>
}

export type UseEventsParams<T extends Abi, K extends ContractEventName<T>, TSelect = EventResult<T, K>[]> = {
  abi: T
  contractAddress: string
  eventName: K
  filterParams?: ContractEventArgs<T, K>
  select?: (data: EventResult<T, K>[]) => TSelect
  enabled?: boolean
} & Omit<GetEventQueryOptions, "from" | "to">

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
  ...queryOptions
}: UseEventsParams<T, K, TSelect>) => {
  const thor = useThor()
  const { data: from } = useContractDeployBlock(contractAddress)
  return useQuery({
    queryKey: getEventsKey({ eventName, filterParams: filterParams as Record<string, unknown>, queryOptions }),
    queryFn: () =>
      fetchContractEvents({
        thor,
        abi,
        contractAddress,
        eventName,
        filterParams,
        from,
        ...queryOptions,
      }),
    select,
    enabled: enabled && from !== undefined,
    staleTime: 5 * 1000 * 60,
  })
}

export type GetEventsKeyParams = {
  eventName: string
  filterParams?: Record<string, unknown>
  queryOptions?: Omit<GetEventQueryOptions, "from" | "to">
}

export const getEventsKey = ({ eventName, filterParams, queryOptions }: GetEventsKeyParams) =>
  [
    eventName,
    Array.isArray(filterParams)
      ? filterParams
      : filterParams && Object.values(filterParams).length > 0
        ? Object.values(filterParams)
        : "all",
  ].concat(queryOptions ? Object.values(queryOptions) : [])
