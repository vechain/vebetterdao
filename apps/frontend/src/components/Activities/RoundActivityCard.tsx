import { Text, Card, VStack, Badge, HStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import React from "react"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { OverlappedAppsImages } from "@/components/OverlappedAppsImages"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

type Props = {
  activity: ActivityItem & { type: ActivityType.ROUND_ENDED }
}

export const RoundActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { votersCount, vot3Total, topApps } = activity.metadata
  const formatter = getCompactFormatter(1)
  const formattedVot3 = formatter.format(Number(formatEther(BigInt(vot3Total || "0"))))

  return (
    <Card.Root variant="subtle" rounded="lg" w="full" p="4">
      <Card.Body p="0">
        <VStack gap="3" align="flex-start">
          <Badge variant="info" rounded="full">
            {t("Round ended")}
          </Badge>
          <VStack gap="1" align="flex-start" w="full">
            <Text textStyle="sm" fontWeight="semibold">
              {t("Round {{roundId}}", { roundId: activity.roundId })}
            </Text>
            <HStack gap="4">
              <Text textStyle="xs" color="text.subtle">
                {t("{{count}} voters", { count: votersCount })}
              </Text>
              <Text textStyle="xs" color="text.subtle">
                {formattedVot3} {t("VOT3")}
              </Text>
            </HStack>
            {topApps.length > 0 && (
              <HStack gap="2" pt="1">
                <OverlappedAppsImages appsIds={topApps.map(a => a.appId)} maxAppsToShow={3} iconSize={24} />
                <Text textStyle="xs" color="text.subtle">
                  {t("Top apps")}
                </Text>
              </HStack>
            )}
            <Text textStyle="xs" color="text.subtle">
              {dayjs.unix(activity.date).fromNow()}
            </Text>
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
