import type { AttachmentFile } from "../../grants/types"

/**
 * Fallback constants for missing grant proposal data
 * Ensures we always have sensible defaults when IPFS metadata is unavailable
 */
export const GRANT_PROPOSAL_FALLBACKS = {
  title: "Grant Proposal",
  shortDescription: "Grant proposal details unavailable",
  markdownDescription: "",
  description: "Grant proposal details unavailable",
  projectName: "",
  companyName: "",
  grantAmountRequested: 0,
  milestones: [] as Array<{
    description: string
    fundingAmount: number
    fundingAmountUsd: number
    durationFrom: number
    durationTo: number
  }>,
  grantType: "",
  problemDescription: "",
  solutionDescription: "",
  targetUsers: "",
  competitiveEdge: "",
  benefitsToUsers: "",
  benefitsToDApps: "",
  x2EModel: "",
  revenueModel: "",
  highLevelRoadmap: "",
  benefitsToVeChainEcosystem: "",
  companyRegisteredNumber: "",
  companyIntro: "",
  companyEmail: "",
  companyTelegram: "",
  grantsReceiverAddress: "",
  outcomesAttachment: [] as AttachmentFile[],
  appTestnetUrl: "",
  projectWebsite: "",
  githubUsername: "",
  twitterUsername: "",
  discordUsername: "",
  discourseUrl: "",
} as const

/**
 * Fallback constants for missing standard proposal data
 * Ensures we always have sensible defaults when IPFS metadata is unavailable
 */
export const STANDARD_PROPOSAL_FALLBACKS = {
  title: "Standard Proposal",
  shortDescription: "Standard proposal details unavailable",
  markdownDescription: "",
  description: "Standard proposal details unavailable",
  ipfsDescription: "",
  discourseUrl: "",
} as const
