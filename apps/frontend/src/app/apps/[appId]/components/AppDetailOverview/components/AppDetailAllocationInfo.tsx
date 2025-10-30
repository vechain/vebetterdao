import { Card, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useParams } from "next/navigation"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAppEarnings } from "@/api/indexer/xallocations/useAppEarnings"

const compactFormatter = getCompactFormatter(2)
export const AppDetailAllocationInfo = () => {
  const { appId } = useParams<{ appId: string }>()
  const { data: earningsData } = useAppEarnings(appId)
  const { t } = useTranslation()

  const { totalAllocationReceived, lastRoundAllocationReceived, averageAllocationReceived } = useMemo(() => {
    if (!earningsData || !Array.isArray(earningsData)) {
      return {
        totalAllocationReceived: 0,
        lastRoundAllocationReceived: 0,
        averageAllocationReceived: 0,
      }
    }

    // Calculate total allocation across all rounds
    const total = earningsData.reduce((sum, earning) => sum + (earning.totalAmount || 0), 0)

    // Get last round allocation (earnings are sorted by roundId)
    const lastRound = earningsData[earningsData.length - 1]
    const lastRoundAmount = lastRound?.totalAmount || 0

    // Calculate average
    const average = earningsData.length > 0 ? total / earningsData.length : 0

    return {
      totalAllocationReceived: total,
      lastRoundAllocationReceived: lastRoundAmount,
      averageAllocationReceived: average,
    }
  }, [earningsData])
  return (
    <Card.Root bg="card.subtle" h={"full"} rounded="8px" flex={1.5}>
      <Card.Body gap={6}>
        <VStack alignItems={"stretch"} gap={0}>
          <HStack>
            <Image h="36px" w="36px" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
            <Text textStyle={"4xl"} fontWeight="bold">
              {compactFormatter.format(totalAllocationReceived)}
            </Text>
          </HStack>
          <Text color="text.subtle">{t("Total B3TR received in allocations")}</Text>
        </VStack>
        <VStack alignItems={"stretch"} gap={0}>
          <HStack>
            <Image h="18px" w="18px" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
            <Text textStyle={"lg"} fontWeight="semibold">
              {compactFormatter.format(lastRoundAllocationReceived)}
            </Text>
          </HStack>
          <Text color="text.subtle" textStyle="sm">
            {t("Received in latest allocation")}
          </Text>
        </VStack>
        <VStack alignItems={"stretch"} gap={0}>
          <HStack>
            <Image h="18px" w="18px" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
            <Text textStyle={"lg"} fontWeight="semibold">
              {compactFormatter.format(averageAllocationReceived)}
            </Text>
          </HStack>
          <Text color="text.subtle" textStyle="sm">
            {t("Average allocation distribution")}
          </Text>
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
