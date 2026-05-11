import { Text, Card, VStack, HStack, Icon, LinkBox, LinkOverlay } from "@chakra-ui/react"
import dayjs from "dayjs"
import { TFunction } from "i18next"
import NextLink, { type LinkProps } from "next/link"
import React from "react"
import { useTranslation } from "react-i18next"
import { FaStar, FaStarHalfStroke } from "react-icons/fa6"
import { LuInfo } from "react-icons/lu"

import { AppImage } from "@/components/AppImage/AppImage"
import { OverlappedAppsImages } from "@/components/OverlappedAppsImages"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

const TypedNextLink = NextLink as React.FC<React.PropsWithChildren<LinkProps>>

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
      return { icon: FaStar, color: "status.info.strong" }
    case ActivityType.APP_ENDORSEMENT_REACHED:
      return { icon: FaStar, color: "status.positive.strong" }
    case ActivityType.APP_ENDORSEMENT_LOST:
      return { icon: FaStarHalfStroke, color: "status.warning.strong" }
    case ActivityType.APP_BANNED:
      return { icon: LuInfo, color: "status.info.strong" }
  }
}

const getTitle = (type: Props["activity"]["type"], t: TFunction) => {
  switch (type) {
    case ActivityType.APP_NEW:
      return t("New app registered")
    case ActivityType.APP_ENDORSEMENT_REACHED:
      return t("App reached endorsement threshold")
    case ActivityType.APP_ENDORSEMENT_LOST:
      return t("App lost endorsement")
    case ActivityType.APP_BANNED:
      return t("App Status Update")
  }
}

const formatNames = (apps: { appName: string }[], t: TFunction) => {
  if (apps.length === 1) return apps[0]?.appName ?? ""
  if (apps.length === 2) return `${apps[0]?.appName} ${t("and")} ${apps[1]?.appName}`
  return `${apps[0]?.appName}, ${apps[1]?.appName} ${t("and")} ${t("{{count}} more", { count: apps.length - 2 })}`
}

const getDescription = (type: Props["activity"]["type"], apps: { appName: string }[], t: TFunction) => {
  const names = formatNames(apps, t)
  switch (type) {
    case ActivityType.APP_NEW:
      return t("appActivityNewDesc", { names })
    case ActivityType.APP_ENDORSEMENT_REACHED:
      return t("appActivityEndorsedDesc", { names })
    case ActivityType.APP_ENDORSEMENT_LOST:
      return t("appActivityLostDesc", { names })
    case ActivityType.APP_BANNED:
      return t("appActivityBannedDesc", { names })
  }
}

export const AppActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { icon, color } = getIcon(activity.type)
  const { apps } = activity.metadata
  const isSingle = apps.length === 1
  const href = isSingle ? `/apps/${apps[0]?.appId}` : "/apps"

  return (
    <LinkBox asChild>
      <Card.Root variant="subtle" rounded="lg" w="full" p="4" cursor="pointer">
        <Card.Body p="0">
          <VStack gap="3" align="flex-start" w="full">
            <HStack gap="3" align="flex-start" w="full">
              <Icon as={icon} color={color} boxSize="5" mt="0.5" flexShrink={0} />
              <VStack gap="1" align="flex-start" flex="1" minW="0">
                <LinkOverlay textStyle="sm" fontWeight="bold" asChild>
                  <TypedNextLink href={href}>{getTitle(activity.type, t)}</TypedNextLink>
                </LinkOverlay>
                <Text textStyle="sm" color="text.subtle">
                  {getDescription(activity.type, apps, t)}
                </Text>
              </VStack>

              <Text textStyle="xs" color="text.subtle">
                {dayjs.unix(activity.date).fromNow()}
              </Text>
            </HStack>

            <HStack gap="2" pl="8">
              {isSingle && !!apps[0]?.appId ? (
                <AppImage appId={apps[0].appId} boxSize="28px" borderRadius="10px" flexShrink={0} />
              ) : (
                <OverlappedAppsImages appsIds={apps.map(a => a.appId)} maxAppsToShow={4} iconSize={28} />
              )}
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
