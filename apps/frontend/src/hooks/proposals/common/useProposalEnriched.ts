import { useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useProposalCreatedEvents } from "./useProposalCreatedEvents"
import { useAllProposalsState } from "@/api"
import BigNumber from "bignumber.js"
import { useGrantProposalDetails } from "../grants/useGrantProposalDetails"
import { GrantProposalEnriched, ProposalEnriched, ProposalState } from "../grants/types"

// Utility type to ensure required fields stay required after spreading
type EnsureRequired<T, K extends keyof T> = T & Required<Pick<T, K>>

type UseProposalEnrichedReturn = {
  proposals: (GrantProposalEnriched | ProposalEnriched)[]
  enrichedGrantProposals: GrantProposalEnriched[]
  enrichedStandardProposals: ProposalEnriched[]
  totalGrantAmount: BigNumber
  totalProposals: number
  isLoading: boolean
}
// Generate a stable query key for the enriched proposals cache
const getEnrichedProposalsQueryKey = (
  allProposalsLength?: number,
  grantProposalsIds?: string[],
  standardProposalsIds?: string[],
) => [
  "enrichedProposals",
  allProposalsLength || 0,
  grantProposalsIds?.join(",") || "",
  standardProposalsIds?.join(",") || "",
]

export const useProposalEnriched = (): UseProposalEnrichedReturn => {
  // Step 1: Fetch events
  const { allProposals, grantProposals, standardProposals } = useProposalCreatedEvents()

  // Step 2: Get proposal IDs
  const grantProposalsIds = useMemo(() => {
    return grantProposals?.map(event => event.id) || []
  }, [grantProposals])

  const standardProposalsIds = useMemo(() => {
    return standardProposals?.map(event => event.id) || []
  }, [standardProposals])

  // Step 3: Get proposal states, details, and voting data
  const {
    data: { grantProposalsDetailsMap, standardProposalsDetailsMap } = {
      grantProposalsDetailsMap: {},
      standardProposalsDetailsMap: {},
    },
    isLoading: isLoadingDetails,
  } = useGrantProposalDetails({ standardProposals, grantProposals })

  const {
    data: { grantsProposalStates, standardProposalStates } = {
      grantsProposalStates: [],
      standardProposalStates: [],
    },
    isLoading: isLoadingStates,
  } = useAllProposalsState({
    grantProposalsIds,
    standardProposalsIds,
  })

  // Step 4: Create enrichment function with useCallback for stability
  const enrichProposals = useCallback(() => {
    // Early return if no proposals
    if (!grantProposals.length && !standardProposals.length) {
      return {
        enrichedGrantProposals: [],
        enrichedStandardProposals: [],
        proposals: [],
        totalGrantAmount: BigNumber(0),
      }
    }

    // Enrich grant proposals
    const enrichedGrantProposals: GrantProposalEnriched[] = grantProposals.map(event => {
      const state = grantsProposalStates?.find(state => state.proposalId === event.id)?.state ?? ProposalState.Pending
      const details = grantProposalsDetailsMap?.[event.id]
      return {
        ...event,
        ...details,
        state,
      } as EnsureRequired<
        typeof event & typeof details & { state: ProposalState },
        "title" | "shortDescription" | "markdownDescription" | "description" | "proposerAddress"
      >
    })

    // Enrich standard proposals
    const enrichedStandardProposals: ProposalEnriched[] = standardProposals.map(event => {
      const state = standardProposalStates?.find(state => state.proposalId === event.id)?.state ?? ProposalState.Pending
      const details = standardProposalsDetailsMap?.[event.id]
      return {
        ...event,
        ...details,
        state,
      } as EnsureRequired<
        typeof event & typeof details & { state: ProposalState },
        "title" | "shortDescription" | "markdownDescription" | "description" | "proposerAddress"
      >
    })

    const proposals = [...enrichedGrantProposals, ...enrichedStandardProposals]

    // Calculate total grant amount
    const totalGrantAmount = enrichedGrantProposals.reduce(
      (acc, event) => acc.plus(BigNumber(event?.grantAmount) ?? BigNumber(0)),
      BigNumber(0),
    )

    return {
      enrichedGrantProposals,
      enrichedStandardProposals,
      proposals,
      totalGrantAmount,
    }
  }, [
    grantProposals,
    standardProposals,
    grantsProposalStates,
    standardProposalStates,
    grantProposalsDetailsMap,
    standardProposalsDetailsMap,
  ])

  // Step 5: Caching the enriched data
  const { data: enrichedData, isLoading: isLoadingEnrichment } = useQuery({
    queryKey: getEnrichedProposalsQueryKey(allProposals?.length, grantProposalsIds, standardProposalsIds),
    queryFn: enrichProposals,
    enabled: !isLoadingDetails && !isLoadingStates,
  })

  const isLoading = isLoadingStates || isLoadingDetails || isLoadingEnrichment

  return {
    proposals: enrichedData?.proposals || [],
    enrichedGrantProposals: enrichedData?.enrichedGrantProposals || [],
    enrichedStandardProposals: enrichedData?.enrichedStandardProposals || [],
    totalGrantAmount: enrichedData?.totalGrantAmount || BigNumber(0),
    totalProposals: allProposals?.length || 0,
    isLoading,
  }
}
