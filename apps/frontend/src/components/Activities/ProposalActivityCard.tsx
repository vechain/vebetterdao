import { Text, Card, VStack, Badge, BadgeProps } from "@chakra-ui/react"
import dayjs from "dayjs"
import React from "react"
import { useTranslation } from "react-i18next"

import { ActivityItem, ActivityType } from "@/hooks/activities/types"

type Props = {
  activity: ActivityItem & {
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
  }
}

const getBadgeVariant = (type: Props["activity"]["type"]): BadgeProps["variant"] => {
  switch (type) {
    case ActivityType.PROPOSAL_VOTED_FOR:
    case ActivityType.PROPOSAL_SUPPORTED:
    case ActivityType.PROPOSAL_EXECUTED:
      return "positive"
    case ActivityType.PROPOSAL_VOTED_AGAINST:
    case ActivityType.PROPOSAL_CANCELLED:
    case ActivityType.PROPOSAL_QUORUM_NOT_REACHED:
    case ActivityType.PROPOSAL_SUPPORT_NOT_REACHED:
      return "negative"
    case ActivityType.PROPOSAL_LOOKING_FOR_SUPPORT:
      return "warning"
    case ActivityType.PROPOSAL_IN_DEVELOPMENT:
      return "info"
  }
}

export const ProposalActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const variant = getBadgeVariant(activity.type)

  const badgeText = {
    [ActivityType.PROPOSAL_VOTED_FOR]: t("Approved"),
    [ActivityType.PROPOSAL_VOTED_AGAINST]: t("Rejected"),
    [ActivityType.PROPOSAL_CANCELLED]: t("Canceled"),
    [ActivityType.PROPOSAL_QUORUM_NOT_REACHED]: t("Quorum not reached yet"),
    [ActivityType.PROPOSAL_SUPPORT_NOT_REACHED]: t("Support not reached"),
    [ActivityType.PROPOSAL_LOOKING_FOR_SUPPORT]: t("Looking for support"),
    [ActivityType.PROPOSAL_SUPPORTED]: t("Supported"),
    [ActivityType.PROPOSAL_IN_DEVELOPMENT]: t("In development"),
    [ActivityType.PROPOSAL_EXECUTED]: t("Executed"),
  }[activity.type]

  const descriptionText = {
    [ActivityType.PROPOSAL_VOTED_FOR]: t("Proposal approved by voting"),
    [ActivityType.PROPOSAL_VOTED_AGAINST]: t("Proposal rejected by voting"),
    [ActivityType.PROPOSAL_CANCELLED]: t("Proposal canceled by creator or VeBetter"),
    [ActivityType.PROPOSAL_QUORUM_NOT_REACHED]: t("Proposal quorum not reached"),
    [ActivityType.PROPOSAL_SUPPORT_NOT_REACHED]: t("Proposal support not reached"),
    [ActivityType.PROPOSAL_LOOKING_FOR_SUPPORT]: t("Proposal looking for support"),
    [ActivityType.PROPOSAL_SUPPORTED]: t("Proposal supported"),
    [ActivityType.PROPOSAL_IN_DEVELOPMENT]: t("Proposal in development"),
    [ActivityType.PROPOSAL_EXECUTED]: t("Proposal executed"),
  }[activity.type]

  return (
    <Card.Root variant="subtle" rounded="lg" w="full" p="4">
      <Card.Body p="0">
        <VStack gap="3" align="flex-start">
          <Badge variant={variant} rounded="full">
            {badgeText}
          </Badge>
          <VStack gap="1" align="flex-start">
            <Text textStyle="sm" fontWeight="semibold">
              {activity.metadata.proposalTitle}
            </Text>
            <Text textStyle="xs" color="text.subtle">
              {descriptionText}
            </Text>
            <Text textStyle="xs" color="text.subtle">
              {dayjs.unix(activity.date).fromNow()}
            </Text>
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
