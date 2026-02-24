import { Text, Card, VStack, HStack, Icon, LinkBox, LinkOverlay } from "@chakra-ui/react"
import dayjs from "dayjs"
import { DesignNibSolid } from "iconoir-react"
import NextLink, { type LinkProps } from "next/link"
import React from "react"
import { useTranslation } from "react-i18next"

import { AppImage } from "@/components/AppImage/AppImage"
import { OverlappedAppsImages } from "@/components/OverlappedAppsImages"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

const TypedNextLink = NextLink as React.FC<React.PropsWithChildren<LinkProps>>

type Props = {
  activity: ActivityItem & { type: ActivityType.USER_ALLOCATION_VOTE_CAST }
}

export const UserAllocationVoteCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { apps } = activity.metadata
  const isSingle = apps.length === 1
  const href = `/allocations?round=${activity.roundId}`

  return (
    <LinkBox asChild>
      <Card.Root variant="subtle" rounded="lg" w="full" p="4" cursor="pointer">
        <Card.Body p="0">
          <VStack gap="3" align="flex-start" w="full">
            <HStack gap="3" align="flex-start" w="full">
              <Icon as={DesignNibSolid} color="status.neutral.strong" boxSize="5" mt="0.5" flexShrink={0} />
              <VStack gap="1" align="flex-start" flex="1" minW="0">
                <LinkOverlay textStyle="sm" fontWeight="bold" asChild>
                  <TypedNextLink href={href}>
                    {t("You voted in round {{roundId}}", { roundId: activity.roundId })}
                  </TypedNextLink>
                </LinkOverlay>
                <Text textStyle="sm" color="text.subtle" lineClamp={2}>
                  {apps.length === 0
                    ? t("No apps")
                    : apps
                        .slice(0, 3)
                        .map(a => `${a.appName || a.appId}`)
                        .join(", ")}
                  {apps.length > 3 && ` ${t("+ {{count}} more", { count: apps.length - 3 })}`}
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
