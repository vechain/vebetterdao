import { getConfig } from "@repo/config"
import { useQuery } from "@tanstack/react-query"
import { formatEther } from "ethers"

export type NavigatorEntity = {
  address: string
  status: "ACTIVE" | "EXITING" | "DEACTIVATED"
  stake: string // wei string
  citizenCount: number
  totalDelegated: string // wei string
  metadataURI: string | null
  registeredAt: number
  exitAnnouncedRound: string | null
  exitEffectiveRound: string | null
  lastReportRound: string | null
  lastReportURI: string | null
}

export type NavigatorEntityFormatted = NavigatorEntity & {
  stakeFormatted: string
  totalDelegatedFormatted: string
}

type PaginatedResponse = {
  data: NavigatorEntity[]
  pagination: {
    hasNext: boolean
    cursor: string | null
  }
}

const baseUrl = getConfig().indexerUrl?.replace("/api/v1", "") || "http://localhost:8080"

const fetchNavigators = async (params?: {
  navigator?: string
  status?: string[]
  size?: number
}): Promise<PaginatedResponse> => {
  const searchParams = new URLSearchParams()
  if (params?.navigator) searchParams.set("navigator", params.navigator)
  if (params?.status) params.status.forEach(s => searchParams.append("status", s))
  if (params?.size) searchParams.set("size", params.size.toString())
  searchParams.set("direction", "DESC")

  const url = `${baseUrl}/api/v1/b3tr/navigators?${searchParams.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Indexer error: ${res.status}`)
  return res.json()
}

const formatNavigator = (nav: NavigatorEntity): NavigatorEntityFormatted => ({
  ...nav,
  stakeFormatted: formatEther(nav.stake),
  totalDelegatedFormatted: formatEther(nav.totalDelegated),
})

export const useNavigators = (params?: { status?: string[]; size?: number }) =>
  useQuery({
    queryKey: ["indexer", "navigators", params?.status, params?.size],
    queryFn: () => fetchNavigators({ status: params?.status, size: params?.size ?? 50 }),
    staleTime: 30_000,
    select: data => data.data.map(formatNavigator),
  })

export const useNavigatorByAddress = (address: string) =>
  useQuery({
    queryKey: ["indexer", "navigators", "byAddress", address],
    queryFn: () => fetchNavigators({ navigator: address }),
    enabled: !!address,
    staleTime: 30_000,
    select: data => (data.data.length > 0 ? formatNavigator(data.data[0]) : null),
  })

// Keep backward compat export name
export const useNavigatorRegistrations = () => useNavigators({ status: ["ACTIVE", "EXITING"] })

export type NavigatorOverview = {
  activeNavigators: number
  totalStaked: string
  totalCitizens: number
  totalDelegated: string
}

export type NavigatorOverviewFormatted = NavigatorOverview & {
  totalStakedFormatted: string
  totalDelegatedFormatted: string
}

export const useNavigatorOverview = () =>
  useQuery({
    queryKey: ["indexer", "navigators", "overview"],
    queryFn: async (): Promise<NavigatorOverview> => {
      const res = await fetch(`${baseUrl}/api/v1/b3tr/navigators/overview`)
      if (!res.ok) throw new Error(`Indexer error: ${res.status}`)
      return res.json()
    },
    staleTime: 30_000,
    select: (data): NavigatorOverviewFormatted => ({
      ...data,
      totalStakedFormatted: formatEther(data.totalStaked),
      totalDelegatedFormatted: formatEther(data.totalDelegated),
    }),
  })
