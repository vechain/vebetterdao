import { useMemo } from "react"
import { useGrantProposalEvents } from "./useGrantProposalEvents"
import { useGrantProposalStates } from "./useGrantProposalStates"
import { useGrantProposalDetails } from "./useGrantProposalDetails"
import { ProposalState } from "@/api"
import { Proposal } from "./types"
import BigNumber from "bignumber.js"

export const useGrantProposals = () => {
  // Step 1: Fetch events
  const { data: events, isLoading: isLoadingEvents } = useGrantProposalEvents()

  // Step 2: Get proposal IDs
  const proposalIds = useMemo(() => {
    return events?.map(event => event.id) || []
  }, [events])

  // Step 3: Get proposal states, details, and voting data
  const { data: proposalStates, isLoading: isLoadingStates } = useGrantProposalStates(proposalIds)
  const { data: proposalDetails, isLoading: isLoadingDetails } = useGrantProposalDetails(events || [])

  // Step 4: Merge all the data
  const proposals = useMemo(() => {
    if (!events || isLoadingStates || isLoadingDetails) {
      return []
    }

    return events.map((event): Proposal => {
      const state = proposalStates?.[event.id] ?? ProposalState.Pending
      const details = proposalDetails?.[event.id]
      //TODO: Figure out the grants type and profile picture
      return {
        id: event.id,
        title: details?.title || "Grant Proposal",
        b3tr: `${event.grantAmount} B3TR`,
        dAppGrant: "dApp Grant",
        proposer: {
          profilePicture: details?.image || "https://via.placeholder.com/150",
          addressOrDomain: details?.proposerDomain || event.proposerAddress,
        },
        state,
        //TODO: Figure out how to get the phases
        phases: {
          [ProposalState.Pending]: {
            startAt: event.createdAt.toString(),
            endAt: event.votingRoundId.toString(),
          },
          [ProposalState.Active]: {
            startAt: event.votingRoundId.toString(),
            endAt: event.votingRoundId.toString(),
          },
        },
        // Additional enriched data
        description: details?.description || "",
        //TODO: Figure out how to get the deposit reached and voting power
        isDepositReached: false,
        votingPower: { against: BigNumber(0), for: BigNumber(0), abstain: BigNumber(0) },
      }
    })
  }, [events, proposalStates, proposalDetails, isLoadingStates, isLoadingDetails])

  // Step 5: Calculate aggregated data
  const totalGrantAmount = useMemo(() => {
    return events?.reduce((acc, event) => acc.plus(event.grantAmount), BigNumber(0)) ?? BigNumber(0)
  }, [events])

  const isLoading = isLoadingEvents || isLoadingStates || isLoadingDetails

  return {
    proposals,
    totalGrantAmount,
    totalProposals: events?.length || 0,
    isLoading,
  }
}
