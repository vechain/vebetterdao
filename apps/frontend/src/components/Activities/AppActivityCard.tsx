import { Text, Card, VStack, HStack, Icon, LinkBox, LinkOverlay } from "@chakra-ui/react"
import dayjs from "dayjs"
import NextLink from "next/link"
import React from "react"
import { useTranslation } from "react-i18next"
import { FaRegCircleXmark, FaStar } from "react-icons/fa6"
import { LuShieldCheck } from "react-icons/lu"

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

const getIcon = (type: Props["activity"]["type"]) => {
  switch (type) {
    case ActivityType.APP_NEW:
      return { icon: FaStar, color: "blue.500" }
    case ActivityType.APP_ENDORSEMENT_REACHED:
      return { icon: LuShieldCheck, color: "green.500" }
    case ActivityType.APP_ENDORSEMENT_LOST:
    case ActivityType.APP_BANNED:
      return { icon: FaRegCircleXmark, color: "red.500" }
  }
}

const getTitle = (type: Props["activity"]["type"], t: (key: string) => string) => {
  switch (type) {
    case ActivityType.APP_NEW:
      return t("New app registered")
    case ActivityType.APP_ENDORSEMENT_REACHED:
      return t("App reached endorsement threshold")
    case ActivityType.APP_ENDORSEMENT_LOST:
      return t("App lost endorsement")
    case ActivityType.APP_BANNED:
      return t("App banned")
  }
}

export const AppActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { icon, color } = getIcon(activity.type)

  return (
    <LinkBox as={Card.Root} variant="subtle" rounded="lg" w="full" p="4" cursor="pointer">
      <Card.Body p="0">
        <HStack gap="3" align="flex-start" w="full">
          <Icon as={icon} color={color} boxSize="5" mt="0.5" flexShrink={0} />
          <AppImage appId={activity.metadata.appId} boxSize="40px" borderRadius="10px" flexShrink={0} />
          <VStack gap="1" align="flex-start" flex="1" minW="0">
            <LinkOverlay asChild>
              <NextLink href={`/apps/${activity.metadata.appId}`}>
                <Text textStyle="sm" fontWeight="bold">
                  {getTitle(activity.type, t)}
                </Text>
              </NextLink>
            </LinkOverlay>
            <Text textStyle="sm" color="text.subtle">
              {activity.metadata.appName}
            </Text>
          </VStack>
          <Text textStyle="xs" color="text.subtle" flexShrink={0}>
            {dayjs.unix(activity.date).fromNow()}
          </Text>
        </HStack>
      </Card.Body>
    </LinkBox>
  )
}
