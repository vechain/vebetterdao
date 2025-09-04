import { useAllProposalsState } from "@/api"
import { useQuery } from "@tanstack/react-query"
import BigNumber from "bignumber.js"
import { useCallback, useMemo } from "react"

import { GrantProposalEnriched, ProposalEnriched, ProposalState } from "../grants/types"
import { useStandardOrGrantProposalDetails } from "../grants/useStandardOrGrantProposalDetails"
import { useProposalCreatedEvents } from "./useProposalCreatedEvents"

// Utility type to ensure required fields stay required after spreading
type EnsureRequired<T, K extends keyof T> = T & Required<Pick<T, K>>

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
    // Early return if no proposals
    if (!grantProposals.length && !standardProposals.length) {
      throw new Error("No proposals found")
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

  // Step 5: Caching the enriched data with a simple query key
  const getEnrichedProposalsQueryKey = () => ["enriched-proposals"]

  return useQuery({
    queryKey: getEnrichedProposalsQueryKey(),
    queryFn: enrichProposals,
    retry: 3, //Since events could take longer, we retry 3 times
  })
}
