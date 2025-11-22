import { ProposalType } from "@/hooks/proposals/grants/types"

import { ProposalCreatedEvent } from "../proposals/types"

export interface GrantDetail extends ProposalCreatedEvent {
  type: ProposalType.Grant
  state: number
  votes: VoteEntry[]
  metadata: GrantMetadata
  depositReached: boolean
  communityDeposits: number
  supportingUserCount: number
  interactionDates: {
    supportEndDate: number | null
    votingEndDate: number | null
  }
}

export type VoteSupport = "FOR" | "AGAINST" | "ABSTAIN"

export interface VoteEntry {
  proposalId: string
  support: VoteSupport
  voters: number
  totalWeight: bigint
  totalPower: bigint
}

export interface GrantMetadata {
  grantType: string
  proposerAddress: string
  projectName: string
  companyName: string
  appTestnetUrl: string
  projectWebsite: string
  githubUsername: string
  twitterUsername: string
  discordUsername: string
  discordUserId: string

  problemDescription: string
  solutionDescription: string
  targetUsers: string
  competitiveEdge: string
  companyRegisteredNumber: string
  projectIntro: string
  teamOverview: string

  companyLinkedin: string
  companyEmail: string
  companyTelegram: string

  benefitsToUsers: string
  benefitsToDApps: string
  benefitsToVeChainEcosystem: string

  x2EModel: string
  revenueModel: string
  highLevelRoadmap: string

  milestones: GrantMilestone[]

  termsOfService: boolean
  votingRoundId: string
  grantsReceiverAddress: string

  outcomesAttachment: OutcomeAttachment[]

  title: string
  shortDescription: string
}

export interface GrantMilestone {
  description: string
  fundingAmount: number
  fundingAmountUsd: number
  durationFrom: number // unix timestamp (seconds)
  durationTo: number // unix timestamp (seconds)
}

export interface OutcomeAttachment {
  type: string // e.g. "application/pdf"
  ipfs: string // ipfs hash
  name: string
}
