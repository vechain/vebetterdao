import { useMemo } from "react"

import {
  NavigatorEntity,
  NavigatorEntityFormatted,
  NavigatorOrderBy,
  SortDirection,
} from "@/api/indexer/navigators/useNavigators"
import { useGetVetDomains } from "@/hooks/useGetVetDomains"

export type NavigatorStatusFilter = "all" | "ACTIVE" | "EXITING" | "DEACTIVATED"

type NavigatorStatus = NavigatorEntity["status"]

type NavigatorFilterValues = {
  orderBy: NavigatorOrderBy
  direction: SortDirection
  status: NavigatorStatus[]
}

const STATUS_TO_API: Record<NavigatorStatusFilter, NavigatorStatus[]> = {
  all: [],
  ACTIVE: ["ACTIVE"],
  EXITING: ["EXITING"],
  DEACTIVATED: ["DEACTIVATED"],
}

export const useNavigatorFilterValues = (
  orderBy: NavigatorOrderBy,
  statusFilter: NavigatorStatusFilter,
): NavigatorFilterValues =>
  useMemo(
    () => ({
      orderBy,
      direction: "DESC",
      status: STATUS_TO_API[statusFilter],
    }),
    [orderBy, statusFilter],
  )

// Client-side substring filter on the already-loaded page.
// Backend only supports exact address match, so we filter by:
//  - case-insensitive substring of the navigator address, OR
//  - case-insensitive substring of the reverse-resolved .vet domain (when a search term is present).
// Domain reverse-resolution is only triggered when there's a search term to avoid
// running 50 vns lookups on initial page load.
export const useFilteredNavigators = (
  navigators: NavigatorEntityFormatted[] | undefined,
  searchTerm: string,
): NavigatorEntityFormatted[] | undefined => {
  const term = searchTerm.trim().toLowerCase()

  const addresses = useMemo(() => navigators?.map(n => n.address), [navigators])
  const { data: domains } = useGetVetDomains(term && addresses?.length ? addresses : undefined)

  return useMemo(() => {
    if (!navigators) return navigators
    if (!term) return navigators
    return navigators.filter((n, i) => {
      if (n.address.toLowerCase().includes(term)) return true
      const domain = domains?.[i]?.toLowerCase()
      return !!domain && domain.includes(term)
    })
  }, [navigators, term, domains])
}
