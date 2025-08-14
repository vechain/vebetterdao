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
  proposerAddress: string
  state: ProposalState
  phases: {
    [ProposalState.Pending]: PhaseInfo
    [ProposalState.Active]: PhaseInfo
  }
  communityInteractions?: ProposalInteractions
}

export type Proposal = {
  id: string
  description?: string
  state: ProposalState
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
  proposerAddress: string
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
export type GrantProposalMetadata = Omit<GrantFormData, "termsOfService"> & {
  title: string
  shortDescription: string
}

export type StandardProposalMetadata = Proposal & {
  title: string
  shortDescription: string
  markdownDescription: string
}

type GrantProposalMilestones = GrantFormData["milestones"]

export type GrantProposalMetadataOptions = GrantProposalMetadata | GrantProposalMilestones
export type ProposalDetails = Record<string, GrantProposalMetadata & Proposal>

export enum ProposalState {
  // Extend Standard states
  Pending, // 0
  Active, // 1
  Canceled, // 2
  Defeated,
  Succeeded, // 4
  Queued, // 5
  Executed, // 6
  DepositNotMet, // 7
  // Grant-specific states
  InDevelopment, // 8
  Completed, // 9
}
