import { Text, Card, VStack, HStack, Icon } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuTrendingDown } from "react-icons/lu"

import { ActivityItem, ActivityType } from "@/hooks/activities/types"

type AllocationDecreasedType =
  | ActivityType.APP_REWARDS_DECREASED
  | ActivityType.VOTER_REWARDS_DECREASED
  | ActivityType.TREASURY_REWARDS_DECREASED
  | ActivityType.GM_REWARDS_DECREASED

type Props = {
  activity: ActivityItem & { type: AllocationDecreasedType }
}

export const AllocationDecreasedActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { currentAmount, previousAmount, percentageChange, nextDecreaseRound, nextDecreasePercentage } =
    activity.metadata

  const formatter = getCompactFormatter(1)
  const fmtPrevious = formatter.format(Number(previousAmount || "0"))
  const fmtCurrent = formatter.format(Number(currentAmount || "0"))

  const title = useMemo(() => {
    switch (activity.type) {
      case ActivityType.APP_REWARDS_DECREASED:
        return t("App rewards decreased")
      case ActivityType.VOTER_REWARDS_DECREASED:
        return t("Voter rewards decreased")
      case ActivityType.TREASURY_REWARDS_DECREASED:
        return t("Treasury allocation decreased")
      case ActivityType.GM_REWARDS_DECREASED:
        return t("GM rewards decreased")
    }
  }, [activity.type, t])

  const description = useMemo(() => {
    const opts = {
      percentage: Math.abs(percentageChange).toFixed(1),
      previous: fmtPrevious,
      current: fmtCurrent,
    }
    switch (activity.type) {
      case ActivityType.APP_REWARDS_DECREASED:
        return t("app_rewards_decreased_description", opts)
      case ActivityType.VOTER_REWARDS_DECREASED:
        return t("voter_rewards_decreased_description", opts)
      case ActivityType.TREASURY_REWARDS_DECREASED:
        return t("treasury_rewards_decreased_description", opts)
      case ActivityType.GM_REWARDS_DECREASED:
        return t("gm_rewards_decreased_description", opts)
    }
  }, [activity.type, percentageChange, fmtPrevious, fmtCurrent, t])

  const showNextDecrease = nextDecreaseRound !== undefined && nextDecreasePercentage !== undefined

  return (
    <Card.Root variant="outline" rounded="lg" w="full" p="4">
      <Card.Body p="0">
        <VStack gap="3" align="flex-start" w="full">
          <HStack gap="3" align="flex-start" w="full">
            <Icon as={LuTrendingDown} color="status.negative.strong" boxSize="5" mt="0.5" flexShrink={0} />
            <VStack gap="1" align="flex-start" flex="1" minW="0">
              <Text textStyle="sm" fontWeight="bold">
                {title}
              </Text>
              <Text textStyle="sm" color="text.subtle">
                {description.split(/(<bold>.*?<\/bold>)/g).map((segment, i) => {
                  const match = segment.match(/^<bold>(.*)<\/bold>$/)
                  if (match)
                    return (
                      <Text as="span" fontWeight="bold" key={i}>
                        {match[1]}
                      </Text>
                    )
                  return <React.Fragment key={i}>{segment}</React.Fragment>
                })}
              </Text>
            </VStack>
            <Text textStyle="xs" color="text.subtle" flexShrink={0}>
              {dayjs.unix(activity.date).format("MMM D, YYYY")}
            </Text>
          </HStack>

          {showNextDecrease && (
            <Text textStyle="sm" color="text.subtle" pl="8">
              {t("allocation_next_decrease", {
                round: nextDecreaseRound,
                percentage: nextDecreasePercentage,
              })}
            </Text>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
