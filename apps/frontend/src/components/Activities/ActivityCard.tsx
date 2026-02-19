import React from "react"

import { ActivityItem, ActivityType } from "@/hooks/activities/types"

import { GrantActivityCard } from "./GrantActivityCard"
import { ProposalActivityCard } from "./ProposalActivityCard"

type Props = {
  activity: ActivityItem
}

export const ActivityCard: React.FC<Props> = ({ activity }) => {
  switch (activity.type) {
    case ActivityType.PROPOSAL_CANCELLED:
    case ActivityType.PROPOSAL_LOOKING_FOR_SUPPORT:
    case ActivityType.PROPOSAL_IN_DEVELOPMENT:
    case ActivityType.PROPOSAL_EXECUTED:
    case ActivityType.PROPOSAL_VOTED_FOR:
    case ActivityType.PROPOSAL_VOTED_AGAINST:
    case ActivityType.PROPOSAL_QUORUM_NOT_REACHED:
    case ActivityType.PROPOSAL_SUPPORT_NOT_REACHED:
    case ActivityType.PROPOSAL_SUPPORTED:
      return <ProposalActivityCard activity={activity} />
    case ActivityType.GRANT_APPROVED:
    case ActivityType.GRANT_MILESTONE_APPROVED:
      return <GrantActivityCard activity={activity} />
    default:
      return null
  }
}
