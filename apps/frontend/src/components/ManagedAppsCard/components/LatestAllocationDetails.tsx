import { HStack, Heading, Image, Skeleton, Stat } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { useAllocationPoolEvents } from "@/api/contracts/xAllocationPool/hooks/useAllocationPoolEvents"

const compactFormatter = getCompactFormatter(2)

export const LatestAllocationDetails = ({ appId }: { appId: string }) => {
  const { t } = useTranslation()
  const { data: appAllocations = [], isLoading } = useAllocationPoolEvents({ appId, limit: 3 })
  const lastRoundAllocationReceived = Number(formatEther(appAllocations?.[0]?.totalAmount ?? 0n)) || 0
  const secondLastRoundAllocationReceived = Number(formatEther(appAllocations?.[1]?.totalAmount ?? 0n)) || 0
  const percentageChange = useMemo(
    () =>
      // cannot divide by 0
      secondLastRoundAllocationReceived === 0
        ? 0
        : ((lastRoundAllocationReceived - secondLastRoundAllocationReceived) / secondLastRoundAllocationReceived) * 100,
    [lastRoundAllocationReceived, secondLastRoundAllocationReceived],
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
                {compactFormatter.format(lastRoundAllocationReceived)}
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
