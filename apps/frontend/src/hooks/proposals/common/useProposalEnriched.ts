import { useAllProposalsState } from "@/api"
import { useQuery } from "@tanstack/react-query"
import BigNumber from "bignumber.js"
import { useCallback, useMemo } from "react"

import { GrantProposalEnriched, ProposalEnriched, ProposalState } from "../grants/types"
import { useProposalCreatedEvents } from "./useProposalCreatedEvents"
import {
  EnsureRequired,
  getEnrichedProposalsQueryKey,
  getGrantProposalDetailsWithFallbacks,
  getStandardProposalDetailsWithFallbacks,
  safeFetchIpfsMetadata,
} from "./utils"

/**
 * Hook for enriching proposals with IPFS metadata and state information
 *
 * This hook:
 * 1. Fetches proposal creation events
 * 2. Gets current proposal states
 * 3. Fetches IPFS metadata for each proposal
 * 4. Enriches proposals with fallback data
 * 5. Calculates total grant amounts
 */
export const useProposalEnriched = () => {
  // Fetch proposal creation events
  const { grantProposals, standardProposals } = useProposalCreatedEvents()

  // Extract proposal IDs for state queries
  const grantProposalsIds = useMemo(() => {
    return grantProposals?.map(event => event.id) || []
  }, [grantProposals])

  const standardProposalsIds = useMemo(() => {
    return standardProposals?.map(event => event.id) || []
  }, [standardProposals])

  // Get current proposal states
  const {
    data: { grantsProposalStates, standardProposalStates } = {
      grantsProposalStates: [],
      standardProposalStates: [],
    },
  } = useAllProposalsState({
    grantProposalsIds,
    standardProposalsIds,
  })

  // Main enrichment function with metadata fetching
  const enrichProposals = useCallback(async () => {
    const hasGrants = !!grantProposals && grantProposals?.length > 0
    const hasStandard = !!standardProposals && standardProposals?.length > 0

    // Force retry if no proposals found instead of returning empty data
    if (!hasGrants && !hasStandard) {
      console.error("No proposals found - retrying...")
      throw new Error("No proposals found - retrying...")
    }

    // Fetch IPFS metadata for all proposals in parallel
    const grantProposalsMetadataPromises =
      grantProposals?.map(event => safeFetchIpfsMetadata<GrantProposalEnriched>(event.ipfsDescription, false)) || []

    const standardProposalsMetadataPromises =
      standardProposals?.map(event => safeFetchIpfsMetadata<ProposalEnriched>(event.ipfsDescription, false)) || []

    const [grantProposalsMetadata, standardProposalsMetadata] = await Promise.all([
      Promise.all(grantProposalsMetadataPromises),
      Promise.all(standardProposalsMetadataPromises),
    ])

    // Enrich grant proposals with fetched metadata and fallbacks
    const enrichedGrantProposals: GrantProposalEnriched[] =
      grantProposals?.map((event, index) => {
        const stateData = grantsProposalStates?.find(state => state.proposalId === event.id)
        const state = stateData?.state ?? ProposalState.Pending
        const ipfsMetadata = grantProposalsMetadata[index]

        const enrichedDetails = getGrantProposalDetailsWithFallbacks(event, ipfsMetadata)

        return {
          ...enrichedDetails,
          state,
          id: event.id,
        } as EnsureRequired<
          typeof enrichedDetails & { state: ProposalState },
          "title" | "shortDescription" | "markdownDescription" | "description" | "proposerAddress"
        >
      }) || []

    // Enrich standard proposals with fetched metadata and fallbacks
    const enrichedStandardProposals: ProposalEnriched[] =
      standardProposals?.map((event, index) => {
        const stateData = standardProposalStates?.find(state => state.proposalId === event.id)
        const state = stateData?.state ?? ProposalState.Pending
        const ipfsMetadata = standardProposalsMetadata[index]

        const enrichedDetails = getStandardProposalDetailsWithFallbacks(event, ipfsMetadata)

        return {
          ...enrichedDetails,
          state,
          id: event.id,
        } as EnsureRequired<
          typeof enrichedDetails & { state: ProposalState },
          "title" | "shortDescription" | "markdownDescription" | "description" | "proposerAddress"
        >
      }) || []

    const proposals = [...enrichedGrantProposals, ...enrichedStandardProposals]

    // Calculate total grant amount requested across all grant proposals
    const totalGrantAmount = enrichedGrantProposals.reduce(
      (acc, event) => acc.plus(BigNumber(event?.grantAmountRequested) ?? BigNumber(0)),
      BigNumber(0),
    )

    return {
      enrichedGrantProposals,
      enrichedStandardProposals,
      proposals,
      totalGrantAmount,
    }
  }, [grantProposals, standardProposals, grantsProposalStates, standardProposalStates])

  return useQuery({
    queryKey: getEnrichedProposalsQueryKey(),
    queryFn: enrichProposals,
    retry: (failureCount, error) => {
      // Always retry for "No proposals found" errors up to 5 times
      if (error instanceof Error && error.message.includes("No proposals found")) {
        return failureCount < 5
      }
      // For other errors, retry up to 3 times
      return failureCount < 3
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff with max 30s
  })
}
