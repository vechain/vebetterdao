import { useMemo } from "react"
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

  // Step 4: Merge all the data
  const enrichedGrantProposals: GrantProposalEnriched[] = useMemo(() => {
    return grantProposals.map(event => {
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
  }, [grantProposals, grantsProposalStates, grantProposalsDetailsMap])

  const enrichedStandardProposals: ProposalEnriched[] = useMemo(() => {
    return standardProposals.map(event => {
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
  }, [standardProposals, standardProposalStates, standardProposalsDetailsMap])

  const proposals = useMemo(() => {
    return [...enrichedGrantProposals, ...enrichedStandardProposals]
  }, [enrichedGrantProposals, enrichedStandardProposals])

  // Step 5: Calculate aggregated data
  const totalGrantAmount = useMemo(() => {
    return (
      enrichedGrantProposals?.reduce(
        (acc, event) => acc.plus(BigNumber(event?.grantAmount) ?? BigNumber(0)),
        BigNumber(0),
      ) ?? BigNumber(0)
    )
  }, [enrichedGrantProposals])

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
