import { useQuery } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { Interface } from "ethers"
import { useCallback, useMemo } from "react"
import { abi } from "thor-devkit"
import { getAllEvents } from "@/api/blockchain/getEvents"

type EventName<T> = T extends (nameOrSignature: infer U) => any ? U : never

export type UseEventsParams<T extends Interface, R> = {
  contractInterface: T
  contractAddress: string
  eventName: EventName<T["getEvent"]>
  filterParams?: Object
  mapResponse: (decoded: abi.Decoded, meta: Connex.Thor.Filter.WithMeta["meta"]) => R
}

/**
 * Custom hook for fetching contract events.
 */
export const useEvents = <T extends Interface, R>({
  contractInterface,
  contractAddress,
  eventName,
  filterParams,
  mapResponse,
}: UseEventsParams<T, R>) => {
  const { thor } = useConnex()

  const queryFn = useCallback(async () => {
    if (!thor) return []

    // Get the event ABI
    const eventFragment = contractInterface?.getEvent(eventName)?.format("json")
    if (!eventFragment) throw new Error(`Event ${eventName} not found`)

    const eventAbi = new abi.Event(JSON.parse(eventFragment) as abi.Event.Definition)
    const topics = eventAbi.encode(filterParams ?? {})

    // Construct filter criteria
    const filterCriteria = [
      {
        address: contractAddress,
        topic0: topics[0] ?? undefined,
        topic1: topics[1] ?? undefined,
        topic2: topics[2] ?? undefined,
        topic3: topics[3] ?? undefined,
        topic4: topics[4] ?? undefined,
      },
    ]

    const events = await getAllEvents({ thor, filterCriteria })

    return events.map(event => {
      const decoded = eventAbi.decode(event.data, event.topics)
      return mapResponse(decoded, {
        blockID: event.meta.blockID,
        blockNumber: event.meta.blockNumber,
        blockTimestamp: event.meta.blockTimestamp,
        txID: event.meta.txID,
        txOrigin: event.meta.txOrigin,
        clauseIndex: event.meta.clauseIndex,
      })
    })
  }, [thor, contractInterface, eventName, filterParams, contractAddress, mapResponse])

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
