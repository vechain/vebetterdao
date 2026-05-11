import { Card, HStack, Icon, LinkBox, LinkOverlay, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import React from "react"
import { useTranslation } from "react-i18next"
import { LuTrendingDown } from "react-icons/lu"

import { ActivityItem, ActivityType } from "@/hooks/activities/types"

const EMISSIONS_DOCS_URL = "https://docs.vebetterdao.org/vebetter/b3tr-emissions"

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
    currentTotal,
    previousTotal,
    appsAmount,
    treasuryAmount,
    votersAmount,
    gmAmount,
    percentageChange,
    nextEmissionsDecreaseRound,
    nextEmissionsDecreasePercentage,
    nextVoterShiftRound,
    nextVoterShiftPercentage,
  } = activity.metadata

  const formatter = getCompactFormatter(1)
  const fmt = (v: string) => formatter.format(Number(v || "0"))

  const description = t("emissions_decreased_description", {
    percentage: Math.abs(percentageChange).toFixed(1),
    previous: fmt(previousTotal),
    current: fmt(currentTotal),
    apps: fmt(appsAmount),
    treasury: fmt(treasuryAmount),
    voters: fmt(votersAmount),
    gm: fmt(gmAmount),
  })

  const showEmissionsDecreasePrediction = nextEmissionsDecreaseRound !== "0" && nextEmissionsDecreasePercentage > 0
  const showVoterShiftPrediction = nextVoterShiftRound !== "0" && nextVoterShiftPercentage > 0

  return (
    <LinkBox asChild>
      <Card.Root variant="outline" rounded="lg" w="full" p="4" cursor="pointer">
        <Card.Body p="0">
          <VStack gap="3" align="flex-start" w="full">
            <HStack gap="3" align="flex-start" w="full">
              <Icon as={LuTrendingDown} color="status.negative.strong" boxSize="5" mt="0.5" flexShrink={0} />
              <VStack gap="1" align="flex-start" flex="1" minW="0">
                <LinkOverlay
                  href={EMISSIONS_DOCS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  textStyle="sm"
                  fontWeight="bold">
                  {t("Emissions decreased")}
                </LinkOverlay>
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
    </LinkBox>
  )
}
