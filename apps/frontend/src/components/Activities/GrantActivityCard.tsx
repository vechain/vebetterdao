import { Text, Card, VStack, Badge } from "@chakra-ui/react"
import dayjs from "dayjs"
import React from "react"
import { useTranslation } from "react-i18next"

import { ActivityItem, ActivityType } from "@/hooks/activities/types"

type Props = {
  activity: ActivityItem & {
    type: ActivityType.GRANT_APPROVED | ActivityType.GRANT_MILESTONE_APPROVED
  }
}

export const GrantActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()

  const isApproved = activity.type === ActivityType.GRANT_APPROVED
  const badgeText = isApproved ? t("Grant approved") : t("Grant milestone approved")

  return (
    <Card.Root variant="subtle" rounded="lg" w="full" p="4">
      <Card.Body p="0">
        <VStack gap="3" align="flex-start">
          <Badge variant="positive" rounded="full">
            {badgeText}
          </Badge>
          <VStack gap="1" align="flex-start">
            <Text textStyle="sm" fontWeight="semibold">
              {activity.metadata.proposalTitle}
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
