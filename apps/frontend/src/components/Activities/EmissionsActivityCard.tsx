import { Text, Card, VStack, HStack, Icon } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import React from "react"
import { useTranslation } from "react-i18next"
import { LuTrendingDown } from "react-icons/lu"

import { ActivityItem, ActivityType } from "@/hooks/activities/types"

type Props = {
  activity: ActivityItem & { type: ActivityType.EMISSIONS_DECREASED }
}

const renderMarkup = (text: string) =>
  text.split(/(<bold>.*?<\/bold>)/g).map((segment, i) => {
    const match = segment.match(/^<bold>(.*)<\/bold>$/)
    if (match)
      return (
        <Text as="span" fontWeight="bold" key={i}>
          {match[1]}
        </Text>
      )
    return <React.Fragment key={i}>{segment}</React.Fragment>
  })

export const EmissionsActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const {
    previousAppsAmount,
    previousVotersAmount,
    previousTreasuryAmount,
    previousGmAmount,
    currentAppsAmount,
    currentVotersAmount,
    currentTreasuryAmount,
    currentGmAmount,
    previousTotal,
    currentTotal,
    nextEmissionsDecreaseRound,
    nextEmissionsDecreasePercentage,
    nextVoterShiftRound,
    nextVoterShiftPercentage,
  } = activity.metadata

  const formatter = getCompactFormatter(1)
  const fmt = (v: string) => formatter.format(Number(v || "0"))

  const totalDecreased = parseFloat(currentTotal) < parseFloat(previousTotal)
  const title = totalDecreased ? t("Emissions decreased") : t("Voter rewards decreased")

  const description = t("emissions_decreased_description", {
    previousTotal: fmt(previousTotal),
    currentTotal: fmt(currentTotal),
    appsPrev: fmt(previousAppsAmount),
    appsCurr: fmt(currentAppsAmount),
    votersPrev: fmt(previousVotersAmount),
    votersCurr: fmt(currentVotersAmount),
    treasuryPrev: fmt(previousTreasuryAmount),
    treasuryCurr: fmt(currentTreasuryAmount),
    gmPrev: fmt(previousGmAmount),
    gmCurr: fmt(currentGmAmount),
  })

  const showEmissionsDecreasePrediction = nextEmissionsDecreaseRound !== "0" && nextEmissionsDecreasePercentage > 0
  const showVoterShiftPrediction = nextVoterShiftRound !== "0" && nextVoterShiftPercentage > 0

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
                {renderMarkup(description)}
              </Text>
            </VStack>
            <Text textStyle="xs" color="text.subtle" flexShrink={0}>
              {dayjs.unix(activity.date).format("MMM D, YYYY")}
            </Text>
          </HStack>

          {(showEmissionsDecreasePrediction || showVoterShiftPrediction) && (
            <VStack gap="1" align="flex-start" pl="8" w="full">
              {showEmissionsDecreasePrediction && (
                <Text textStyle="sm" color="text.subtle">
                  {t("emissions_next_decrease", {
                    round: nextEmissionsDecreaseRound,
                    percentage: nextEmissionsDecreasePercentage,
                  })}
                </Text>
              )}
              {showVoterShiftPrediction && (
                <Text textStyle="sm" color="text.subtle">
                  {t("emissions_next_voter_shift", {
                    round: nextVoterShiftRound,
                    percentage: nextVoterShiftPercentage,
                  })}
                </Text>
              )}
            </VStack>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
