import { useAllProposalsState } from "@/api"
import { useQuery } from "@tanstack/react-query"
import BigNumber from "bignumber.js"
import { useCallback, useMemo } from "react"

import { GrantProposalEnriched, ProposalEnriched, ProposalState } from "../grants/types"
import { useStandardOrGrantProposalDetails } from "../grants/useStandardOrGrantProposalDetails"
import { useProposalCreatedEvents } from "./useProposalCreatedEvents"

// Utility type to ensure required fields stay required after spreading
type EnsureRequired<T, K extends keyof T> = T & Required<Pick<T, K>>
// Step 5: Caching the enriched data with a simple query key
export const getEnrichedProposalsQueryKey = () => ["enriched-proposals"]

export const useProposalEnriched = () => {
  // Step 1: Fetch events
  const { grantProposals, standardProposals } = useProposalCreatedEvents()

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
  } = useStandardOrGrantProposalDetails({ standardProposals, grantProposals })

  const {
    data: { grantsProposalStates, standardProposalStates } = {
      grantsProposalStates: [],
      standardProposalStates: [],
    },
  } = useAllProposalsState({
    grantProposalsIds,
    standardProposalsIds,
  })
  // Step 4: Create enrichment function with useCallback for stability
  const enrichProposals = useCallback(() => {
    const hasGrants = !!grantProposals && grantProposals?.length > 0
    const hasStandard = !!standardProposals && standardProposals?.length > 0

    // Early return if no proposals
    if (!hasGrants && !hasStandard) {
      throw new Error("No proposals found")
    }

    //If has grant but no grant details, throw an error
    if (hasGrants && !grantProposalsDetailsMap) {
      throw new Error("No grant proposal details found")
    }

    //If has standard but no standard details, throw an error
    if (hasStandard && !standardProposalsDetailsMap) {
      throw new Error("No standard proposal details found")
    }

    //If has grant but no grant states, throw an error
    if (hasGrants && !grantsProposalStates) {
      throw new Error("No grant proposal states found")
    }

    //If has standard but no standard states, throw an error
    if (hasStandard && !standardProposalStates) {
      throw new Error("No standard proposal states found")
    }

    // Enrich grant proposals
    const enrichedGrantProposals: GrantProposalEnriched[] = grantProposals.map(event => {
      const stateData = grantsProposalStates?.find(state => state.proposalId === event.id)
      const state = stateData?.state ?? ProposalState.Pending
      const details = grantProposalsDetailsMap?.[event.id]

      return {
        ...event,
        ...details,
        state,
        // Use the fallback logic from getGrantProposalMetadataOrReturnDefault if title is missing
        title: details?.title || details?.projectName || details?.shortDescription,
      } as EnsureRequired<
        typeof event & typeof details & { state: ProposalState },
        "title" | "shortDescription" | "markdownDescription" | "description" | "proposerAddress"
      >
    })

    // Enrich standard proposals
    const enrichedStandardProposals: ProposalEnriched[] = standardProposals.map(event => {
      const stateData = standardProposalStates?.find(state => state.proposalId === event.id)
      const state = stateData?.state ?? ProposalState.Pending
      const details = standardProposalsDetailsMap?.[event.id]
      return {
        ...event,
        ...details,
        state,
        // Use fallback logic for standard proposals as well
        title: details?.title || details?.shortDescription || "Standard Proposal",
      } as EnsureRequired<
        typeof event & typeof details & { state: ProposalState },
        "title" | "shortDescription" | "markdownDescription" | "description" | "proposerAddress"
      >
    })

    const proposals = [...enrichedGrantProposals, ...enrichedStandardProposals]

    // Calculate total grant amount
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
  }, [
    grantProposals,
    standardProposals,
    grantsProposalStates,
    standardProposalStates,
    grantProposalsDetailsMap,
    standardProposalsDetailsMap,
  ])

  return useQuery({
    queryKey: getEnrichedProposalsQueryKey(),
    queryFn: enrichProposals,
    retry: 5, //Since events could take longer, we retry 5 times
  })
}
