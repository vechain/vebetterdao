export enum ProposalType {
  Standard,
  Grant,
}

export type CommunityInteraction = {
  percentage: number
}

export type ProposalEnriched = ProposalCreatedEvent & {
  title: string
  shortDescription: string
  markdownDescription: string
  description: string
  proposerAddress: string
  state: ProposalState
}

export type GrantProposalEnriched = ProposalEnriched &
  Omit<GrantFormData, "termsOfService"> & {
    grantType: string
    grantAmountRequested: number // Amount requested by the grantee
  }

export type ProposalCreatedEvent = {
  id: string
  type: ProposalType
  ipfsDescription: string
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
  // About company
  companyName: string
  companyRegisteredNumber: string
  companyIntro: string
  companyEmail: string
  companyTelegram: string
  grantsReceiverAddress: string
  // About project
  projectName: string
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
  outcomesAttachment?: File[]
  // Milestones
  milestones: Array<{
    description: string
    fundingAmount: number
    durationFrom: number //Unix timestamp in seconds
    durationTo: number //Unix timestamp in seconds
  }>
  // Voting round ID (Deadline round + 1 for the support phase)
  votingRoundId: string
  // Terms of service
  termsOfService: boolean
}

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
