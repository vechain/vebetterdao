import BigNumber from "bignumber.js"
import { useMemo } from "react"

import { useAllProposalsState } from "../../../api/contracts/governance/hooks/useAllProposalsState"
import { GrantProposalEnriched, ProposalEnriched, ProposalState } from "../grants/types"
import { useStandardOrGrantProposalDetails } from "../grants/useStandardOrGrantProposalDetails"

import { useProposalCreatedEvents } from "./useProposalCreatedEvents"

// Utility type to ensure required fields stay required after spreading
type EnsureRequired<T, K extends keyof T> = T & Required<Pick<T, K>>
export const useProposalEnriched = () => {
  // Step 1: Fetch events
  const { grantProposals, standardProposals, allProposals } = useProposalCreatedEvents()
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
    isLoading: isDetailsLoading,
  } = useStandardOrGrantProposalDetails({ standardProposals, grantProposals })
  const {
    data: { grantsProposalStates, standardProposalStates } = {
      grantsProposalStates: [],
      standardProposalStates: [],
    },
    isLoading: isStatesLoading,
  } = useAllProposalsState({
    grantProposalsIds,
    standardProposalsIds,
  })
  // Step 4: Reactively enrich grant proposals using useMemo
  const enrichedGrantProposals = useMemo((): GrantProposalEnriched[] => {
    if (!grantProposals?.length) return []
    return grantProposals.map(event => {
      const stateData = grantsProposalStates?.find(state => state.proposalId === event.id)
      const state = stateData?.state ?? ProposalState.Pending
      const details = grantProposalsDetailsMap?.[event.id]

      return {
        ...event,
        ...details,
        state,
        // Use the fallback logic from getGrantProposalMetadataOrReturnDefault if title is missing
        title: details?.title || details?.projectName || details?.shortDescription || "Grant Proposal",
      } as EnsureRequired<
        typeof event & typeof details & { state: ProposalState },
        "title" | "shortDescription" | "ipfsDescription" | "markdownDescription" | "description" | "proposerAddress"
      >
    })
  }, [grantProposals, grantsProposalStates, grantProposalsDetailsMap])

  // Step 5: Reactively enrich standard proposals using useMemo
  const enrichedStandardProposals = useMemo((): ProposalEnriched[] => {
    if (!standardProposals?.length) return []

    return standardProposals.map(event => {
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
        "title" | "shortDescription" | "ipfsDescription" | "markdownDescription" | "description" | "proposerAddress"
      >
    })
  }, [standardProposals, standardProposalStates, standardProposalsDetailsMap])

  // Step 6: Combine all proposals using useMemo
  const proposals = useMemo(() => {
    return [...enrichedGrantProposals, ...enrichedStandardProposals]
  }, [enrichedGrantProposals, enrichedStandardProposals])

  // Step 7: Calculate total grant amount using useMemo
  const totalGrantAmount = useMemo(() => {
    return enrichedGrantProposals.reduce(
      (acc, event) => acc.plus(new BigNumber(event?.grantAmountRequested) ?? new BigNumber(0)),
      new BigNumber(0),
    )
  }, [enrichedGrantProposals])

  // Return both basic and enriched data - this gives maximum flexibility
  return {
    data: {
      // Basic proposal events (fast, no dependencies)
      grantProposals,
      standardProposals,
      proposals: allProposals,

      // Enriched proposals (reactive to state/metadata changes)
      enrichedGrantProposals,
      enrichedStandardProposals,
      enrichedProposals: proposals,
      totalGrantAmount,
    },
    isLoading: isDetailsLoading || isStatesLoading,
  }
}
