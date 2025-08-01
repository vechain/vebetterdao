import { useMemo } from "react"
import { useProposalCreatedEvents } from "./useProposalCreatedEvents"
import { ProposalState, useAllProposalsState } from "@/api"
import { ProposalEnriched } from "../grants/types"
import BigNumber from "bignumber.js"
import { useGrantProposalDetails } from "../grants/useGrantProposalDetails"

export const useProposalEnriched = () => {
  // Step 1: Fetch events
  const { allProposals } = useProposalCreatedEvents()

  // Step 2: Get proposal IDs
  const proposalIds = useMemo(() => {
    return allProposals?.map(event => event.id) || []
  }, [allProposals])

  // Step 3: Get proposal states, details, and voting data
  const { data: proposalStates, isLoading: isLoadingStates } = useAllProposalsState(proposalIds)
  const { data: proposalDetails, isLoading: isLoadingDetails } = useGrantProposalDetails(allProposals || [])

  // Step 4: Merge all the data
  const proposals = useMemo(() => {
    if (!allProposals || isLoadingStates || isLoadingDetails) {
      return []
    }

    return allProposals.map((event): ProposalEnriched => {
      //TODO: IMPROVE THIS, NOT OPTIMIZED
      const state = proposalStates?.find(state => state.proposalId === event.id)?.state ?? ProposalState.Pending
      const details = proposalDetails?.[event.id]
      //TODO: Figure out the grants type and profile picture
      return {
        ...event,
        ...details,
        title: details?.title || "Grant Proposal",
        b3tr: `${event.grantAmount} B3TR`,
        proposer: {
          profilePicture: details?.applicantProfileUrl ?? "",
          addressOrDomain: event.proposerAddress,
        },
        dAppGrant: `${details?.grantType} Grant`,
        state,
        //TODO: Resolve the endAt and startAt or delegate to the component to fetch it
        phases: {
          [ProposalState.Pending]: {
            startAt: event.createdAt.toString(),
            endAt: event.createdAt.toString(),
          },
          [ProposalState.Active]: {
            startAt: event.createdAt.toString(),
            endAt: event.createdAt.toString(),
          },
        },
        description: details?.description || "",
      }
    })
  }, [allProposals, proposalStates, proposalDetails, isLoadingStates, isLoadingDetails])

  // Step 5: Calculate aggregated data
  const totalGrantAmount = useMemo(() => {
    return (
      allProposals?.reduce((acc, event) => acc.plus(event?.grantAmount ?? BigNumber(0)), BigNumber(0)) ?? BigNumber(0)
    )
  }, [allProposals])

  const isLoading = isLoadingStates || isLoadingDetails

  return {
    proposals,
    totalGrantAmount,
    totalProposals: allProposals?.length || 0,
    isLoading,
  }
}
