import { Card, HStack, Icon, LinkBox, LinkOverlay, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import NextLink from "next/link"
import React from "react"
import { useTranslation } from "react-i18next"
import { FaRegCalendar } from "react-icons/fa6"
import { LuUsers } from "react-icons/lu"

import { AppImage } from "@/components/AppImage/AppImage"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

type Props = {
  activity: ActivityItem & { type: ActivityType.ROUND_ENDED }
}

export const RoundActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { votersCount, vot3Total, topApps } = activity.metadata
  const formatter = getCompactFormatter(1)
  const formattedVot3 = formatter.format(Number(vot3Total || "0"))

  return (
    <LinkBox asChild>
      <Card.Root variant="subtle" rounded="lg" w="full" p="4" cursor="pointer">
        <Card.Body p="0">
          <VStack gap="3" align="flex-start" w="full">
            <HStack gap="3" align="flex-start" w="full">
              <Icon as={FaRegCalendar} color="status.info.strong" boxSize="5" mt="0.5" flexShrink={0} />
              <VStack gap="1" align="flex-start" flex="1" minW="0">
                <LinkOverlay asChild>
                  <NextLink href={`/allocations?round=${activity.roundId}`}>
                    <Text textStyle="sm" fontWeight="bold">
                      {t("Allocation round ended")}
                    </Text>
                  </NextLink>
                </LinkOverlay>
                <Text textStyle="sm" color="text.subtle">
                  {t("Round #{{roundId}} completed", { roundId: activity.roundId })}
                </Text>
              </VStack>

              <Text textStyle="xs" color="text.subtle">
                {dayjs.unix(activity.date).format("MMM D, YYYY")}
              </Text>
            </HStack>

            <HStack gap="4" pl="8">
              <HStack gap="1">
                <Icon as={LuUsers} boxSize="4" color="text.subtle" />
                <Text textStyle="sm" color="text.subtle">
                  {votersCount.toLocaleString()} {t("voters")}
                </Text>
              </HStack>
              <Text textStyle="sm" fontWeight="bold">
                {formattedVot3}
                {" VOT3 "}
                {t("total")}
              </Text>
            </HStack>

            {topApps.length > 0 && (
              <HStack gap="2" pl="8">
                <Text textStyle="xs" color="text.subtle">
                  {t("Most voted apps")}
                </Text>
                <HStack gap="-2">
                  {topApps.map(app => (
                    <AppImage key={app.appId} appId={app.appId} boxSize="24px" borderRadius="full" />
                  ))}
                </HStack>
              </HStack>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
