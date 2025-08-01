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

export type GrantFormData = {
  grantType: string
  // About applicant
  applicantName: string
  applicantSurname: string
  applicantRole: string
  applicantProfileUrl: string
  applicantCountry?: string
  applicantCity?: string
  applicantStreet?: string
  applicantPostalCode?: string
  applicantBackground?: string
  // About project
  projectName: string
  companyName: string
  appTestnetUrl: string
  projectWebsite: string
  githubUsername: string
  twitterUsername: string
  discordUsername: string
  // Project details
  problemDescription: string
  solutionDescription: string
  targetUsers: string
  competitiveEdge: string
  // Outcomes
  benefitsToUsers: string
  benefitsToDApps: string
  benefitsToVeChainEcosystem: string
  x2EModel: string
  revenueModel: string
  highLevelRoadmap: string
  // Milestones
  milestones: Array<{
    description: string
    fundingAmount: number
    durationFrom: number //Unix timestamp in seconds
    durationTo: number //Unix timestamp in seconds
  }>
  // Terms of service
  termsOfService: boolean
}
