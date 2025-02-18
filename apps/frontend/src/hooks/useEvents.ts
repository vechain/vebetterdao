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
  event: EventName<T["getEvent"]>
  filterParams?: Object
  mapResponse: (decoded: abi.Decoded, meta: { blockNumber: number; txOrigin: string }) => R
}

/**
 * Custom hook for fetching contract events.
 */
export const useEvents = <T extends Interface, R>({
  contractInterface,
  contractAddress,
  event,
  filterParams,
  mapResponse,
}: UseEventsParams<T, R>) => {
  const { thor } = useConnex()

  const queryFn = useCallback(async () => {
    if (!thor) return []

    // Get the event ABI
    const eventFragment = contractInterface?.getEvent(event)?.format("json")
    if (!eventFragment) throw new Error(`Event ${event} not found`)

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
        blockNumber: event.meta.blockNumber,
        txOrigin: event.meta.txOrigin,
      })
    })
  }, [thor, contractInterface, event, contractAddress])

  const queryKey = useMemo(() => getEventsKey({ event, filterParams }), [event, filterParams])

  return useQuery({
    queryFn,
    queryKey,
    enabled: !!thor,
  })
}

export type GetEventsKeyParams = {
  event: string
  filterParams?: Object
}

export const getEventsKey = ({ event, filterParams }: GetEventsKeyParams) => {
  return [event, filterParams ? JSON.stringify(filterParams) : "all"]
}
