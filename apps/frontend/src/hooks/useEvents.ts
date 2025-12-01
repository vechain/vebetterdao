import { useQuery } from "@tanstack/react-query"
import { EventLogs } from "@vechain/sdk-network"
import { useThor, useWallet } from "@vechain/vechain-kit"
import { Abi } from "abitype"
import { useCallback } from "react"
import { ContractEventName, decodeEventLog as viemDecodeEventLog } from "viem"

import { fetchContractEvents } from "../api/contracts/governance/fetchContractEvents"

type FilterParams = Record<string, unknown> | unknown[] | undefined

export type UseEventsParams<T extends Abi, K extends ContractEventName<T>, R> = {
  abi: T
  contractAddress: string
  eventName: K
  filterParams?: FilterParams
  mapResponse: ({
    meta,
    decodedData,
  }: {
    meta: EventLogs["meta"]
    decodedData: ReturnType<typeof viemDecodeEventLog<T, K>>
  }) => R
}

/**
 * Custom hook for fetching contract events (client-side).
 * For server-side usage, use fetchContractEvents directly.
 */
export const useEvents = <T extends Abi, K extends ContractEventName<T>, R>({
  abi,
  contractAddress,
  eventName,
  filterParams,
  mapResponse,
}: UseEventsParams<T, K, R>) => {
  const thor = useThor()
  const { account } = useWallet()

  const queryFn = useCallback(async () => {
    if (!thor) return []

    return await fetchContractEvents({
      thor,
      abi,
      contractAddress,
      eventName,
      filterParams,
      mapResponse,
    })
  }, [thor, contractAddress, abi, eventName, filterParams, mapResponse])

  return useQuery({
    queryFn,
    queryKey: getEventsKey({ eventName, filterParams }),
    enabled: !!thor && !!account?.address,
  })
}

export type GetEventsKeyParams = {
  eventName: string
  filterParams?: FilterParams
}

export const getEventsKey = ({ eventName, filterParams }: GetEventsKeyParams) => {
  // no need for JSON.stringify wagmi hashFn is used in react-query client
  return [eventName, filterParams ? filterParams : "all"]
}
