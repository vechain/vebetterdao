import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { formatEther } from "ethers"

export type DelegationEvent = {
  txId: string
  navigator: string
  citizen: string
  eventType: "B3TR_DelegationCreated" | "B3TR_DelegationUpdated" | "B3TR_DelegationRemoved"
  amount: string
  delta: string
  blockTimestamp: number
}

export type DelegationEventFormatted = DelegationEvent & {
  amountFormatted: string
  deltaFormatted: string
}

type PaginatedResponse = {
  data: DelegationEvent[]
  pagination: {
    hasNext: boolean
    cursor: string | null
  }
}

const baseUrl = getConfig().indexerUrl?.replace("/api/v1", "") || "http://localhost:8080"

export const useNavigatorDelegations = (filters: { navigator?: string; citizen?: string }, size = 50) =>
  useQuery({
    queryKey: ["indexer", "navigators", "delegations", filters.navigator, filters.citizen, size],
    queryFn: async (): Promise<PaginatedResponse> => {
      const params = new URLSearchParams()
      if (filters.navigator) params.set("navigator", filters.navigator)
      if (filters.citizen) params.set("citizen", filters.citizen)
      params.set("size", size.toString())
      params.set("direction", "DESC")

      const res = await fetch(`${baseUrl}/api/v1/b3tr/navigators/delegations?${params.toString()}`)
      if (!res.ok) throw new Error(`Indexer error: ${res.status}`)
      return res.json()
    },
    enabled: true,
    staleTime: 30_000,
    select: (data): DelegationEventFormatted[] =>
      data.data.map(e => ({
        ...e,
        amountFormatted: formatEther(e.amount),
        deltaFormatted: formatEther(e.delta),
      })),
  })
