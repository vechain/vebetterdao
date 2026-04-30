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

export const EmissionsActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const {
    currentTotal,
    previousTotal,
    appsAmount,
    treasuryAmount,
    votersAmount,
    percentageChange,
    nextDecreaseRound,
    nextDecreasePercentage,
  } = activity.metadata

  const formatter = getCompactFormatter(1)
  const fmtPrevious = formatter.format(Number(previousTotal || "0"))
  const fmtCurrent = formatter.format(Number(currentTotal || "0"))
  const fmtApps = formatter.format(Number(appsAmount || "0"))
  const fmtTreasury = formatter.format(Number(treasuryAmount || "0"))
  const fmtVoters = formatter.format(Number(votersAmount || "0"))

  return (
    <Card.Root variant="outline" rounded="lg" w="full" p="4">
      <Card.Body p="0">
        <VStack gap="3" align="flex-start" w="full">
          <HStack gap="3" align="flex-start" w="full">
            <Icon as={LuTrendingDown} color="status.negative.strong" boxSize="5" mt="0.5" flexShrink={0} />
            <VStack gap="1" align="flex-start" flex="1" minW="0">
              <Text textStyle="sm" fontWeight="bold">
                {t("Emissions decreased")}
              </Text>
              <Text textStyle="sm" color="text.subtle">
                {t("emissions_decreased_description", {
                  percentage: Math.abs(percentageChange).toFixed(1),
                  previous: fmtPrevious,
                  current: fmtCurrent,
                  apps: fmtApps,
                  treasury: fmtTreasury,
                  voters: fmtVoters,
                })
                  .split(/(<bold>.*?<\/bold>)/g)
                  .map((segment, i) => {
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

          <Text textStyle="sm" color="text.subtle" pl="8">
            {t("emissions_next_decrease", {
              round: nextDecreaseRound,
              percentage: nextDecreasePercentage,
            })}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
