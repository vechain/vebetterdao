import { Text, Card, VStack, Badge, HStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import React from "react"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { ActivityItem, ActivityType } from "@/hooks/activities/types"

type Props = {
  activity: ActivityItem & { type: ActivityType.EMISSIONS_DECREASED }
}

export const EmissionsActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { currentAmount, percentageChange, nextDecreaseRound } = activity.metadata
  const formatter = getCompactFormatter(1)
  const formattedAmount = formatter.format(Number(formatEther(BigInt(currentAmount || "0"))))

  return (
    <Card.Root variant="subtle" rounded="lg" w="full" p="4">
      <Card.Body p="0">
        <VStack gap="3" align="flex-start">
          <Badge variant="warning" rounded="full">
            {t("Emissions decreased")}
          </Badge>
          <VStack gap="1" align="flex-start">
            <Text textStyle="sm" fontWeight="semibold">
              {percentageChange.toFixed(1)}
              {"%"}
            </Text>
            <HStack gap="4">
              <Text textStyle="xs" color="text.subtle">
                {formattedAmount} {t("B3TR")}
              </Text>
              <Text textStyle="xs" color="text.subtle">
                {t("Next decrease round {{round}}", { round: nextDecreaseRound })}
              </Text>
            </HStack>
            <Text textStyle="xs" color="text.subtle">
              {dayjs.unix(activity.date).fromNow()}
            </Text>
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
