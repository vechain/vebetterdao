import { ProposalState } from "@/api"

export enum ProposalType {
  Standard,
  Grant,
}

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

export type ProposalEnriched = Proposal & {
  title: string
  description: string
  b3tr: string
  dAppGrant: string
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

export type Proposal = {
  id: string
  type: ProposalType
  ipfsDescription: string
  grantAmount?: BigNumber | undefined
  votingRoundId: string
  depositThreshold: string
  proposerAddress: string
  calldatas: readonly `0x${string}`[]
  targets: readonly string[]
  createdAt: number
  createdAtBlock: number
}
