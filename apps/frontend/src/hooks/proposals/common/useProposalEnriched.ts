import { useMemo, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useProposalCreatedEvents } from "./useProposalCreatedEvents"
import { useAllProposalsState } from "@/api"
import BigNumber from "bignumber.js"
import { useGrantProposalDetails } from "../grants/useGrantProposalDetails"
import { useMilestoneClaimedEvents } from "../grants/useMilestoneClaimedEvents"
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
  // Grant Analytics
  grantAnalytics: {
    totalDistributedAmount: BigNumber
    grantsApproved: number
    grantsByState: Record<ProposalState, number>
    grantsInDevelopment: number
    grantsCompleted: number
  }
}
export const useProposalEnriched = (): UseProposalEnrichedReturn => {
  // Step 1: Fetch events
  const { allProposals, grantProposals, standardProposals } = useProposalCreatedEvents()

  // Step 1.5: Fetch milestone claimed events for analytics
  const { claimedAmountsByProposal } = useMilestoneClaimedEvents()

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

      // Get actual distributed amount from claimed events (calculated here, not in useGrantProposalDetails)
      const claimedAmount = claimedAmountsByProposal[event.id]
      const grantAmountDistributed = claimedAmount ? parseFloat(claimedAmount.totalClaimed) : 0

      return {
        ...event,
        ...details,
        state,
        grantAmountDistributed,
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
    claimedAmountsByProposal,
  ])

  // Step 5: Caching the enriched data with a simple query key
  const getEnrichedProposalsQueryKey = (totalProposals: number, grantIds: string[], standardIds: string[]) => [
    "enriched-proposals",
    totalProposals,
    grantIds.join(","),
    standardIds.join(","),
  ]

  const { data: enrichedData, isLoading: isLoadingEnrichment } = useQuery({
    queryKey: getEnrichedProposalsQueryKey(allProposals?.length || 0, grantProposalsIds, standardProposalsIds),
    queryFn: enrichProposals,
    enabled: !isLoadingDetails && !isLoadingStates,
  })

  // Step 6: Calculate Grant Analytics directly from milestone events
  const grantAnalytics = useMemo(() => {
    const grantsByState: Record<ProposalState, number> = {
      [ProposalState.Pending]: 0,
      [ProposalState.Active]: 0,
      [ProposalState.Canceled]: 0,
      [ProposalState.Defeated]: 0,
      [ProposalState.Succeeded]: 0,
      [ProposalState.Queued]: 0,
      [ProposalState.Executed]: 0,
      [ProposalState.DepositNotMet]: 0,
      [ProposalState.InDevelopment]: 0,
      [ProposalState.Completed]: 0,
    }

    let grantsApproved = 0
    let grantsInDevelopment = 0
    let grantsCompleted = 0

    // Calculate total distributed amount directly from milestone claimed events
    let totalDistributedAmount = BigNumber(0)
    Object.values(claimedAmountsByProposal).forEach(claimedData => {
      totalDistributedAmount = totalDistributedAmount.plus(BigNumber(claimedData.totalClaimed))
    })

    // Use the enriched data from the query if available
    const enrichedGrants = enrichedData?.enrichedGrantProposals || []
    enrichedGrants.forEach(grant => {
      // Count by state
      grantsByState[grant.state] = (grantsByState[grant.state] || 0) + 1

      // Count approved grants (state >= Succeeded) TODO: Double check this ( DepositNotMet > Succeeded )
      if (grant.state >= ProposalState.Succeeded) {
        grantsApproved++
      }

      // Count grants in development
      if (grant.state === ProposalState.InDevelopment) {
        grantsInDevelopment++
      }

      // Count completed grants
      if (grant.state === ProposalState.Completed) {
        grantsCompleted++
      }
    })

    return {
      totalDistributedAmount,
      grantsApproved,
      grantsByState, // Useful to filter by state later on
      grantsInDevelopment, // Useful to filter by state later on
      grantsCompleted, // Useful to filter by state later on
    }
  }, [enrichedData?.enrichedGrantProposals, claimedAmountsByProposal])

  const isLoading = isLoadingStates || isLoadingDetails || isLoadingEnrichment

  return {
    proposals: enrichedData?.proposals || [],
    enrichedGrantProposals: enrichedData?.enrichedGrantProposals || [],
    enrichedStandardProposals: enrichedData?.enrichedStandardProposals || [],
    totalGrantAmount: enrichedData?.totalGrantAmount || BigNumber(0),
    totalProposals: allProposals?.length || 0,
    isLoading,
    grantAnalytics,
  }
}
