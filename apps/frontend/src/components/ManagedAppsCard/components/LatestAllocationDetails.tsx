import { HStack, Heading, Image, Skeleton, Stat } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useAppEarnings } from "@/api/indexer/xallocations/useAppEarnings"

const compactFormatter = getCompactFormatter(2)

export const LatestAllocationDetails = ({ appId }: { appId: string }) => {
  const { t } = useTranslation()
  const { data: earningsData, isLoading } = useAppEarnings(appId)

  const { lastRound, secondLastRound } = useMemo(() => {
    if (!earningsData || !Array.isArray(earningsData) || earningsData.length === 0) {
      return { lastRound: 0, secondLastRound: 0 }
    }
    return {
      lastRound: earningsData[earningsData.length - 1]?.totalAmount || 0,
      secondLastRound: earningsData.length > 1 ? earningsData[earningsData.length - 2]?.totalAmount || 0 : 0,
    }
  }, [earningsData])

  const percentageChange = useMemo(
    () =>
      // cannot divide by 0
      secondLastRound === 0 ? 0 : ((lastRound - secondLastRound) / secondLastRound) * 100,
    [lastRound, secondLastRound],
  )

  return (
    <Skeleton loading={isLoading} w={"full"}>
      <Stat.Root>
        <Stat.Label>{t("Latest allocation")}</Stat.Label>
        <HStack alignItems="center" justifyContent="space-between">
          <Stat.ValueText>
            <HStack>
              <Image aspectRatio="square" w="6" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
              <Heading size="2xl" color="text.default">
                {compactFormatter.format(lastRound)}
              </Heading>
            </HStack>
          </Stat.ValueText>
          <Stat.HelpText color={percentageChange >= 0 ? "status.positive.primary" : "status.negative.primary"}>
            {percentageChange >= 0 ? "+" : ""}
            {compactFormatter.format(percentageChange)}
            {"% than "} <br />
            {t("previous round")}
          </Stat.HelpText>
        </HStack>
      </Stat.Root>
    </Skeleton>
  )
}
