import { ProposalState } from "@/hooks/proposals/grants/types"

export enum ActivityType {
  PROPOSAL_CANCELLED = "PROPOSAL_CANCELLED",
  PROPOSAL_LOOKING_FOR_SUPPORT = "PROPOSAL_LOOKING_FOR_SUPPORT",
  PROPOSAL_IN_DEVELOPMENT = "PROPOSAL_IN_DEVELOPMENT",
  PROPOSAL_EXECUTED = "PROPOSAL_EXECUTED",
  PROPOSAL_VOTED_FOR = "PROPOSAL_VOTED_FOR",
  PROPOSAL_VOTED_AGAINST = "PROPOSAL_VOTED_AGAINST",
  PROPOSAL_QUORUM_NOT_REACHED = "PROPOSAL_QUORUM_NOT_REACHED",
  PROPOSAL_SUPPORT_NOT_REACHED = "PROPOSAL_SUPPORT_NOT_REACHED",
  PROPOSAL_SUPPORTED = "PROPOSAL_SUPPORTED",
  GRANT_APPROVED = "GRANT_APPROVED",
  GRANT_MILESTONE_APPROVED = "GRANT_MILESTONE_APPROVED",
  APP_ENDORSEMENT_LOST = "APP_ENDORSEMENT_LOST",
  APP_ENDORSEMENT_REACHED = "APP_ENDORSEMENT_REACHED",
  APP_NEW = "APP_NEW",
  APP_BANNED = "APP_BANNED",
  ROUND_ENDED = "ROUND_ENDED",
  EMISSIONS_DECREASED = "EMISSIONS_DECREASED",
  GM_UPGRADED = "GM_UPGRADED",
  USER_ALLOCATION_VOTE_CAST = "USER_ALLOCATION_VOTE_CAST",
  USER_PROPOSAL_VOTE_CAST = "USER_PROPOSAL_VOTE_CAST",
  USER_PROPOSAL_SUPPORT = "USER_PROPOSAL_SUPPORT",
  NAVIGATOR_JOINED = "NAVIGATOR_JOINED",
  NAVIGATOR_EXIT_ANNOUNCED = "NAVIGATOR_EXIT_ANNOUNCED",
  NAVIGATOR_EXITED = "NAVIGATOR_EXITED",
  USER_NAVIGATOR_EXIT_ANNOUNCED = "USER_NAVIGATOR_EXIT_ANNOUNCED",
  USER_NAVIGATOR_EXITED = "USER_NAVIGATOR_EXITED",
}

export type ProposalActivityMeta = {
  proposalId: string
  proposalTitle: string
  state: ProposalState
  cancelReason?: string
}

export type AppActivityMeta = {
  apps: { appId: string; appName: string }[]
}

export type RoundActivityMeta = {
  votersCount: number
  vot3Total: string
  topApps: { appId: string; appName: string; percentage: number }[]
}

export type EmissionsActivityMeta = {
  currentTotal: string
  previousTotal: string
  appsAmount: string
  treasuryAmount: string
  votersAmount: string
  gmAmount: string
  percentageChange: number
  nextDecreaseRound: string
  nextDecreasePercentage: number
}

export type GrantActivityMeta = {
  proposalId: string
  proposalTitle: string
}

export type GmUpgradeEntry = {
  userAddress: string
  tokenId: string
  oldLevel: number
  newLevel: number
  timestamp: number
}

export type GmUpgradeActivityMeta = {
  upgrades: GmUpgradeEntry[]
}

export type UserAllocationVoteEntry = {
  appId: string
  appName: string
  voteWeight: string
}

export type UserAllocationVoteMeta = {
  apps: UserAllocationVoteEntry[]
}

export type UserProposalVoteMeta = {
  proposalId: string
  proposalTitle: string
  support: number
  proposalType: "grant" | "proposal"
}

export type UserProposalSupportMeta = {
  proposalId: string
  proposalTitle: string
  amount: string
  proposalType: "grant" | "proposal"
}

export type NavigatorGlobalActivityMeta = {
  count: number
  navigators: { address: string }[]
  totalStake?: string
  effectiveDeadlineRoundId?: string
}

export type NavigatorPersonalActivityMeta = {
  navigatorAddress: string
  effectiveDeadlineRoundId?: string
}

export type ActivityItem =
  | {
      type:
        | ActivityType.PROPOSAL_CANCELLED
        | ActivityType.PROPOSAL_LOOKING_FOR_SUPPORT
        | ActivityType.PROPOSAL_IN_DEVELOPMENT
        | ActivityType.PROPOSAL_EXECUTED
        | ActivityType.PROPOSAL_VOTED_FOR
        | ActivityType.PROPOSAL_VOTED_AGAINST
        | ActivityType.PROPOSAL_QUORUM_NOT_REACHED
        | ActivityType.PROPOSAL_SUPPORT_NOT_REACHED
        | ActivityType.PROPOSAL_SUPPORTED
      date: number
      roundId: string
      title: string
      description?: string
      metadata: ProposalActivityMeta
    }
  | {
      type: ActivityType.GRANT_APPROVED | ActivityType.GRANT_MILESTONE_APPROVED
      date: number
      roundId: string
      title: string
      description?: string
      metadata: GrantActivityMeta
    }
  | {
      type:
        | ActivityType.APP_ENDORSEMENT_LOST
        | ActivityType.APP_ENDORSEMENT_REACHED
        | ActivityType.APP_NEW
        | ActivityType.APP_BANNED
      date: number
      roundId: string
      title: string
      description?: string
      metadata: AppActivityMeta
    }
  | {
      type: ActivityType.ROUND_ENDED
      date: number
      roundId: string
      title: string
      description?: string
      metadata: RoundActivityMeta
    }
  | {
      type: ActivityType.EMISSIONS_DECREASED
      date: number
      roundId: string
      title: string
      description?: string
      metadata: EmissionsActivityMeta
    }
  | {
      type: ActivityType.GM_UPGRADED
      date: number
      roundId: string
      title: string
      description?: string
      metadata: GmUpgradeActivityMeta
    }
  | {
      type: ActivityType.USER_ALLOCATION_VOTE_CAST
      date: number
      roundId: string
      title: string
      description?: string
      metadata: UserAllocationVoteMeta
    }
  | {
      type: ActivityType.USER_PROPOSAL_VOTE_CAST
      date: number
      roundId: string
      title: string
      description?: string
      metadata: UserProposalVoteMeta
    }
  | {
      type: ActivityType.USER_PROPOSAL_SUPPORT
      date: number
      roundId: string
      title: string
      description?: string
      metadata: UserProposalSupportMeta
    }
  | {
      type: ActivityType.NAVIGATOR_JOINED | ActivityType.NAVIGATOR_EXIT_ANNOUNCED | ActivityType.NAVIGATOR_EXITED
      date: number
      roundId: string
      title: string
      description?: string
      metadata: NavigatorGlobalActivityMeta
    }
  | {
      type: ActivityType.USER_NAVIGATOR_EXIT_ANNOUNCED | ActivityType.USER_NAVIGATOR_EXITED
      date: number
      roundId: string
      title: string
      description?: string
      metadata: NavigatorPersonalActivityMeta
    }
