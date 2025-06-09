import { useAllocationPoolEvents } from "@/api"
import { HStack, Heading, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { ethers } from "ethers"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"

const compactFormatter = getCompactFormatter(2)

export const LatestAllocationDetails = ({ appId }: { appId: string }) => {
  const { t } = useTranslation()
  const { data, isLoading } = useAllocationPoolEvents()

  const appAllocations = useMemo(
    () =>
      data?.claimedRewards
        ?.filter(allocation => compareAddresses(allocation.appId, appId))
        .sort((a, b) => Number(a.roundId) - Number(b.roundId))
        .map(allocation => {
          return {
            ...allocation,
            scaledAmount: ethers.formatEther(allocation.totalAmount),
          }
        }) || [],
    [data, appId],
  )
  const lastRoundAllocationReceived = useMemo(
    () => Number(appAllocations[appAllocations.length - 1]?.scaledAmount) || 0,
    [appAllocations],
  )
  const secondLastRoundAllocationReceived = useMemo(
    () => Number(appAllocations[appAllocations.length - 2]?.scaledAmount) || 0,
    [appAllocations],
  )

  const percentageChange = useMemo(
    () =>
      // cannot divide by 0
      secondLastRoundAllocationReceived === 0
        ? 0
        : ((lastRoundAllocationReceived - secondLastRoundAllocationReceived) / secondLastRoundAllocationReceived) * 100,
    [lastRoundAllocationReceived, secondLastRoundAllocationReceived],
  )

  return (
    <Skeleton isLoaded={!isLoading} w={"full"}>
      <HStack
        bg={"info-bg"}
        py={6}
        px={3}
        h="full"
        w="full"
        borderRadius={"2xl"}
        justify={"space-between"}
        alignItems={"center"}>
        <VStack align="self-start" spacing={0}>
          <HStack>
            <Image h="24px" w="24px" src="/assets/tokens/b3tr-token.svg" alt="b3tr-token" />
            <Heading fontSize="24px">{compactFormatter.format(lastRoundAllocationReceived)}</Heading>
          </HStack>
          <Text fontSize={"sm"} color={"gray.500"}>
            {t("Latest allocation")}
          </Text>
        </VStack>

        <VStack align="self-start" color={percentageChange >= 0 ? "#3DBA67" : "#C84968"} fontSize="14px" spacing={0}>
          <Text>
            {percentageChange >= 0 ? "+" : ""}
            {compactFormatter.format(percentageChange)}
            {"% than "}
          </Text>
          <Text>{t("previous round")}</Text>
        </VStack>
      </HStack>
    </Skeleton>
  )
}
