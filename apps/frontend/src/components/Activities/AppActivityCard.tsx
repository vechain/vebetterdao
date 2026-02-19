import { Text, Card, VStack, Badge, BadgeProps, HStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import React from "react"
import { useTranslation } from "react-i18next"

import { AppImage } from "@/components/AppImage/AppImage"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

type Props = {
  activity: ActivityItem & {
    type:
      | ActivityType.APP_ENDORSEMENT_LOST
      | ActivityType.APP_ENDORSEMENT_REACHED
      | ActivityType.APP_NEW
      | ActivityType.APP_BANNED
  }
}

const getBadgeVariant = (type: Props["activity"]["type"]): BadgeProps["variant"] => {
  switch (type) {
    case ActivityType.APP_ENDORSEMENT_REACHED:
    case ActivityType.APP_NEW:
      return "positive"
    case ActivityType.APP_ENDORSEMENT_LOST:
    case ActivityType.APP_BANNED:
      return "negative"
  }
}

export const AppActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const variant = getBadgeVariant(activity.type)

  const badgeText = {
    [ActivityType.APP_ENDORSEMENT_LOST]: t("Endorsement lost"),
    [ActivityType.APP_ENDORSEMENT_REACHED]: t("Endorsement reached"),
    [ActivityType.APP_NEW]: t("New app"),
    [ActivityType.APP_BANNED]: t("App banned"),
  }[activity.type]

  return (
    <Card.Root variant="subtle" rounded="lg" w="full" p="4">
      <Card.Body p="0">
        <VStack gap="3" align="flex-start">
          <Badge variant={variant} rounded="full">
            {badgeText}
          </Badge>
          <HStack gap="3">
            <AppImage appId={activity.metadata.appId} boxSize="40px" borderRadius="10px" />
            <VStack gap="1" align="flex-start">
              <Text textStyle="sm" fontWeight="semibold">
                {activity.metadata.appName}
              </Text>
              <Text textStyle="xs" color="text.subtle">
                {dayjs.unix(activity.date).fromNow()}
              </Text>
            </VStack>
          </HStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
