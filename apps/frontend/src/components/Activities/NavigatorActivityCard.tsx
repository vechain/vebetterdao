import { Avatar, AvatarGroup, Card, HStack, Icon, LinkBox, LinkOverlay, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import NextLink, { type LinkProps } from "next/link"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuCompass } from "react-icons/lu"
import { formatEther } from "viem"

import { useAllocationsRound } from "@/api/contracts/xAllocations/hooks/useAllocationsRound"
import { AddressIcon } from "@/components/AddressIcon"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

const TypedNextLink = NextLink as React.FC<React.PropsWithChildren<LinkProps>>

type GlobalNavigatorActivity = ActivityItem & {
  type: ActivityType.NAVIGATOR_JOINED | ActivityType.NAVIGATOR_EXIT_ANNOUNCED | ActivityType.NAVIGATOR_EXITED
}

type PersonalNavigatorActivity = ActivityItem & {
  type: ActivityType.USER_NAVIGATOR_EXIT_ANNOUNCED | ActivityType.USER_NAVIGATOR_EXITED
}

type Props = {
  activity: GlobalNavigatorActivity | PersonalNavigatorActivity
}

const formatter = getCompactFormatter(1)

const getColor = (type: Props["activity"]["type"]) => {
  switch (type) {
    case ActivityType.NAVIGATOR_JOINED:
      return "status.positive.strong"
    case ActivityType.NAVIGATOR_EXIT_ANNOUNCED:
    case ActivityType.USER_NAVIGATOR_EXIT_ANNOUNCED:
      return "status.warning.strong"
    case ActivityType.NAVIGATOR_EXITED:
    case ActivityType.USER_NAVIGATOR_EXITED:
      return "status.negative.strong"
  }
}

const getDeadlineRoundId = (activity: Props["activity"]): string | undefined => {
  return activity.metadata.effectiveDeadlineRoundId
}

const getAddresses = (activity: Props["activity"]): string[] => {
  if ("navigators" in activity.metadata) {
    return activity.metadata.navigators.map(n => n.address)
  }
  return [activity.metadata.navigatorAddress]
}

const getHref = (activity: Props["activity"]) => {
  if (
    activity.type === ActivityType.USER_NAVIGATOR_EXIT_ANNOUNCED ||
    activity.type === ActivityType.USER_NAVIGATOR_EXITED
  ) {
    return `/navigators/${activity.metadata.navigatorAddress}`
  }
  return "/navigators"
}

export const NavigatorActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const color = getColor(activity.type)
  const addresses = getAddresses(activity)
  const deadlineRoundId = getDeadlineRoundId(activity)
  const { data: deadlineRound } = useAllocationsRound(deadlineRoundId)
  const deadlineDate = deadlineRound?.voteEndTimestamp?.format("Do [of] MMMM, YYYY")

  const title = useMemo(() => {
    switch (activity.type) {
      case ActivityType.NAVIGATOR_JOINED:
        return t("navigatorJoinedTitle")
      case ActivityType.NAVIGATOR_EXIT_ANNOUNCED:
        return activity.metadata.count === 1 ? t("navigatorExitingTitle") : t("navigatorsExitingTitle")
      case ActivityType.NAVIGATOR_EXITED:
        return activity.metadata.count === 1
          ? t("navigatorExitedSingle")
          : t("navigatorExitedMultiple", { count: activity.metadata.count })
      case ActivityType.USER_NAVIGATOR_EXIT_ANNOUNCED:
        return t("yourNavigatorAnnouncedExit")
      case ActivityType.USER_NAVIGATOR_EXITED:
        return t("yourNavigatorExited")
    }
  }, [activity, t])

  const description = useMemo(() => {
    switch (activity.type) {
      case ActivityType.NAVIGATOR_JOINED: {
        const count = activity.metadata.count
        const stake = activity.metadata.totalStake
        if (stake) {
          const formatted = formatter.format(Number(formatEther(BigInt(stake))))
          return count === 1
            ? t("navigatorJoinedDescSingleWithStake", { stake: formatted })
            : t("navigatorJoinedDescMultipleWithStake", { count, stake: formatted })
        }
        return count === 1 ? t("navigatorJoinedDescSingle") : t("navigatorJoinedDescMultiple", { count })
      }
      case ActivityType.NAVIGATOR_EXIT_ANNOUNCED:
        return deadlineDate
          ? t("navigatorExitAnnouncedDescWithDate", { count: activity.metadata.count, date: deadlineDate })
          : t("navigatorExitAnnouncedDesc")
      case ActivityType.NAVIGATOR_EXITED:
        return t("navigatorExitedDesc")
      case ActivityType.USER_NAVIGATOR_EXIT_ANNOUNCED:
        return deadlineDate
          ? t("yourNavigatorAnnouncedExitDescWithDate", { date: deadlineDate })
          : t("yourNavigatorAnnouncedExitDesc")
      case ActivityType.USER_NAVIGATOR_EXITED:
        return t("yourNavigatorExitedDesc")
    }
  }, [activity, t, deadlineDate])

  return (
    <LinkBox asChild>
      <Card.Root variant="subtle" rounded="lg" w="full" p="4" cursor="pointer">
        <Card.Body p="0">
          <VStack gap="3" align="flex-start" w="full">
            <HStack gap="3" align="flex-start" w="full">
              <Icon as={LuCompass} color={color} boxSize="5" mt="0.5" flexShrink={0} />
              <VStack gap="1" align="flex-start" flex="1" minW="0">
                <LinkOverlay textStyle="sm" fontWeight="bold" asChild>
                  <TypedNextLink href={getHref(activity)}>{title}</TypedNextLink>
                </LinkOverlay>
                <Text textStyle="sm" color="text.subtle">
                  {description}
                </Text>
              </VStack>
              <Text textStyle="xs" color="text.subtle" flexShrink={0}>
                {dayjs.unix(activity.date).fromNow()}
              </Text>
            </HStack>

            <HStack gap="2" pl="8">
              {addresses.length === 1 ? (
                <AddressIcon address={addresses[0]!} boxSize="28px" borderRadius="full" flexShrink={0} />
              ) : (
                <AvatarGroup size="sm" stacking="last-on-top" spaceX="-3">
                  {addresses.slice(0, 4).map(addr => (
                    <Avatar.Root key={addr} boxSize="28px" minW="28px" borderRadius="full" flexShrink={0}>
                      <AddressIcon address={addr} borderRadius="full" />
                    </Avatar.Root>
                  ))}
                  {addresses.length > 4 && (
                    <Avatar.Root boxSize="28px" minW="28px" borderRadius="full" flexShrink={0}>
                      <Avatar.Fallback>
                        <Text textStyle="xs" fontWeight="semibold">
                          {"+"}
                          {addresses.length - 4}
                        </Text>
                      </Avatar.Fallback>
                    </Avatar.Root>
                  )}
                </AvatarGroup>
              )}
            </HStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
