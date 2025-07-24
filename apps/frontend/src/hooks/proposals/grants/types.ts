import { ProposalState } from "@/api"
import { GrantProposalVotingData } from "./useGrantProposalVotingData"

export type PhaseInfo = {
  startAt: string
  endAt: string
}

export type CommunityInteraction = {
  percentage: number
  icon: JSX.Element
}

export type ProposalPhases = {
  [key in ProposalState]?: PhaseInfo
}

export type ProposalInteractions = {
  [key in ProposalState]?: CommunityInteraction[]
}

export type Proposal = {
  id: string
  title: string
  description: string
  b3tr: string
  dAppGrant: string
  isDepositReached: boolean
  votingPower: GrantProposalVotingData["votingPower"]
  proposer: {
    profilePicture: string
    addressOrDomain: string
  }
  state: ProposalState
  phases: {
    [ProposalState.Pending]: PhaseInfo
    [ProposalState.Active]: PhaseInfo
  }
  // communityInteractions: ProposalInteractions
}
