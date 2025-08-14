import { useMemo } from "react"
import { useProposalCreatedEvents } from "./useProposalCreatedEvents"
import { useAllProposalsState } from "@/api"
import BigNumber from "bignumber.js"
import { useGrantProposalDetails } from "../grants/useGrantProposalDetails"
import { ProposalState } from "../grants/types"

export const useProposalEnriched = () => {
  // Step 1: Fetch events
  const { allProposals, grantProposals, standardProposals } = useProposalCreatedEvents()

  // Step 2: Get proposal IDs
  const grantProposalsProposalIds = useMemo(() => {
    return grantProposals?.map(event => event.id) || []
  }, [grantProposals])

  const standardProposalsProposalIds = useMemo(() => {
    return standardProposals?.map(event => event.id) || []
  }, [standardProposals])

  // Step 3: Get proposal states, details, and voting data
  const {
    data: { grantProposalsDetailsMap, standardProposalsDetailsMap } = {
      grantProposalsDetailsMap: {},
      standardProposalsDetailsMap: {},
    },
    isLoading: isLoadingDetails,
  } = useGrantProposalDetails(standardProposals, grantProposals)
  const {
    data: { grantsProposalStates, standardProposalStates } = {
      grantsProposalStates: [],
      standardProposalStates: [],
    },
    isLoading: isLoadingStates,
  } = useAllProposalsState(standardProposalsProposalIds, grantProposalsProposalIds)

  // Step 4: Merge all the data

  const enrichedGrantProposals = useMemo(() => {
    return grantProposals.map(event => {
      const state = grantsProposalStates?.find(state => state.proposalId === event.id)?.state ?? ProposalState.Pending
      const details = grantProposalsDetailsMap?.[event.id]
      return {
        ...event,
        ...details,
        state,
      }
    })
  }, [grantProposals, grantsProposalStates, grantProposalsDetailsMap])

  const enrichedStandardProposals = useMemo(() => {
    return standardProposals.map(event => {
      const state = standardProposalStates?.find(state => state.proposalId === event.id)?.state ?? ProposalState.Pending
      const details = standardProposalsDetailsMap?.[event.id]
      return {
        ...event,
        ...details,
        state,
      }
    })
  }, [standardProposals, standardProposalStates, standardProposalsDetailsMap])

  const proposals = useMemo(() => {
    return [...enrichedGrantProposals, ...enrichedStandardProposals]
  }, [enrichedGrantProposals, enrichedStandardProposals])

  // Step 5: Calculate aggregated data
  const totalGrantAmount = useMemo(() => {
    return (
      allProposals?.reduce((acc, event) => acc.plus(event?.grantAmount ?? BigNumber(0)), BigNumber(0)) ?? BigNumber(0)
    )
  }, [allProposals])

  const isLoading = isLoadingStates || isLoadingDetails

  return {
    proposals,
    enrichedGrantProposals,
    enrichedStandardProposals,
    totalGrantAmount,
    totalProposals: allProposals?.length || 0,
    isLoading,
  }
}
