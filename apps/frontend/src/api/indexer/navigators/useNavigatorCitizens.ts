import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { formatEther } from "ethers"

export type CitizenEntity = {
  address: string
  delegatedAt: number
  amount: string
  navigator: string
  active: boolean
}

export type CitizenEntityFormatted = CitizenEntity & {
  amountFormatted: string
}

type PaginatedResponse = {
  data: CitizenEntity[]
  pagination: {
    hasNext: boolean
    cursor: string | null
  }
}

const baseUrl = getConfig().indexerUrl?.replace("/api/v1", "") || "http://localhost:8080"

export const useNavigatorCitizens = (navigatorAddress: string, size = 50) =>
  useQuery({
    queryKey: ["indexer", "navigators", "citizens", navigatorAddress, size],
    queryFn: async (): Promise<PaginatedResponse> => {
      const params = new URLSearchParams()
      params.set("navigator", navigatorAddress)
      params.set("size", size.toString())
      params.set("direction", "DESC")

      const res = await fetch(`${baseUrl}/api/v1/b3tr/navigators/citizens?${params.toString()}`)
      if (!res.ok) throw new Error(`Indexer error: ${res.status}`)
      return res.json()
    },
    enabled: !!navigatorAddress,
    staleTime: 30_000,
    select: (data): CitizenEntityFormatted[] =>
      data.data.map(c => ({
        ...c,
        amountFormatted: formatEther(c.amount),
      })),
  })
