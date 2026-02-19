import React from "react"

import { ActivityItem, ActivityType } from "@/hooks/activities/types"

import { AppActivityCard } from "./AppActivityCard"
import { EmissionsActivityCard } from "./EmissionsActivityCard"
import { GrantActivityCard } from "./GrantActivityCard"
import { ProposalActivityCard } from "./ProposalActivityCard"
import { RoundActivityCard } from "./RoundActivityCard"

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
    case ActivityType.APP_ENDORSEMENT_LOST:
    case ActivityType.APP_ENDORSEMENT_REACHED:
    case ActivityType.APP_NEW:
    case ActivityType.APP_BANNED:
      return <AppActivityCard activity={activity} />
    case ActivityType.ROUND_ENDED:
      return <RoundActivityCard activity={activity} />
    case ActivityType.EMISSIONS_DECREASED:
      return <EmissionsActivityCard activity={activity} />
  }
}
