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
  const { currentAmount, previousAmount, percentageChange, nextDecreaseRound } = activity.metadata
  const formatter = getCompactFormatter(1)
  const formattedCurrent = formatter.format(Number(currentAmount || "0"))
  const formattedPrevious = formatter.format(Number(previousAmount || "0"))

  return (
    <Card.Root variant="subtle" rounded="lg" w="full" p="4">
      <Card.Body p="0">
        <VStack gap="3" align="flex-start" w="full">
          <HStack gap="3" align="flex-start" w="full">
            <Icon as={LuTrendingDown} color="status.positive.strong" boxSize="5" mt="0.5" flexShrink={0} />
            <VStack gap="1" align="flex-start" flex="1" minW="0">
              <Text textStyle="sm" fontWeight="bold">
                {t("Emissions decreased")}
              </Text>
              <Text textStyle="sm" color="text.subtle">
                {t("B3TR emissions reduced by {{percentage}}%", {
                  percentage: Math.abs(percentageChange).toFixed(1),
                })}
              </Text>
            </VStack>
            <Text textStyle="xs" color="text.subtle" flexShrink={0}>
              {dayjs.unix(activity.date).format("MMM D, YYYY")}
            </Text>
          </HStack>

          <HStack gap="4" pl="8" flexWrap="wrap">
            <Text textStyle="sm" color="text.subtle">
              {t("Previous:")}{" "}
              <Text as="span" fontWeight="bold">
                {formattedPrevious}
                {" B3TR"}
              </Text>
            </Text>
            <Text textStyle="sm" color="text.subtle">
              {t("Current:")}{" "}
              <Text as="span" fontWeight="bold">
                {formattedCurrent}
                {" B3TR"}
              </Text>
            </Text>
            <HStack gap="1">
              <Icon as={LuTrendingDown} color="status.positive.strong" boxSize="4" />
              <Text textStyle="sm" color="status.positive.strong" fontWeight="semibold">
                {Math.abs(percentageChange).toFixed(1)}
                {"%"}
              </Text>
            </HStack>
          </HStack>

          <Text textStyle="xs" color="text.subtle" pl="8">
            {t("Next decrease in round #{{round}}", { round: nextDecreaseRound })}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
