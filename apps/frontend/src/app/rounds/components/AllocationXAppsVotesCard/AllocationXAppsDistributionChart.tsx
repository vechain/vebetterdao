import { useAllocationAmount, useAllocationBaseAmount, useAllocationVoters, useMaxAllocationAmount } from "@/api"
import { B3TRIcon, DotSymbol } from "@/components"
import { VStack, Heading, useColorModeValue, Text, Box, Skeleton, Stack, HStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useRoundXApps, useMultipleXAppRoundEarnings } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(2)
const getSafeScaledPercentage = (percentage: number) => Math.min(percentage, 1) * 100
type Props = {
  roundId: string
}
export const AllocationXAppsDistributionChart = ({ roundId }: Props) => {
  const { t } = useTranslation()

  //TODO: Handle error
  const { data: roundAmount, isLoading: roundAmountLoading } = useAllocationAmount(roundId)

  const { data: baseAmount, isLoading: baseAmountLoading } = useAllocationBaseAmount(roundId)
  const { data: maxAmount, isLoading: maxAmountLoading } = useMaxAllocationAmount(roundId)

  const { data: xApps, isLoading: xAppsLoading } = useRoundXApps(roundId)

  const forecastedEarningsQuery = useMultipleXAppRoundEarnings(roundId, xApps?.map(app => app.id) ?? [])

  const { data: voters, isLoading: votersLoading } = useAllocationVoters(roundId)

  const totalDistributed = useMemo(() => {
    if (!roundAmount) return 0
    return Number(roundAmount.voteXAllocations)
  }, [roundAmount])

  // the total baseAmount distributed in the round
  const totalBaseAmount = useMemo(() => {
    if (!baseAmount || !xApps?.length) return 0
    return Number(baseAmount) * xApps?.length
  }, [baseAmount, xApps])

  // the total amount of B3TR distributed in the round only votes
  const totalEarningsWithoutBase = useMemo(() => {
    if (!forecastedEarningsQuery.data || !baseAmount) return 0
    return forecastedEarningsQuery.data?.reduce((acc, curr) => acc + Number(curr?.amount ?? 0) - Number(baseAmount), 0)
  }, [forecastedEarningsQuery, baseAmount])

  //the percentage of the total amount of B3TR distrivuted in the round between the base and votes
  const baseAmountsPercentage = useMemo(() => {
    return {
      baseAmount: getSafeScaledPercentage(Number(totalBaseAmount) / totalDistributed),
      votesAmount: getSafeScaledPercentage(Number(totalEarningsWithoutBase) / totalDistributed),
    }
  }, [totalBaseAmount, totalEarningsWithoutBase, totalDistributed])

  const votingRewardsColor = useColorModeValue("#225EED", "#225EED")
  const appsColor = useColorModeValue("#5FA5F9", "#5FA5F9")

  const baseAmountsInfo = useMemo(() => {
    return [
      {
        amount: totalBaseAmount,
        isLoading: baseAmountLoading || xAppsLoading,
        percentage: baseAmountsPercentage.baseAmount,
        color: votingRewardsColor,
        label: "base allocation",
      },
      {
        amount: totalEarningsWithoutBase,
        isLoading: baseAmountLoading || forecastedEarningsQuery.isLoading,
        percentage: baseAmountsPercentage.votesAmount,
        color: appsColor,
        label: "votes allocation",
      },
    ]
  }, [
    appsColor,
    votingRewardsColor,
    baseAmountLoading,
    xAppsLoading,
    totalBaseAmount,
    baseAmountsPercentage,
    totalEarningsWithoutBase,
    forecastedEarningsQuery,
  ])

  return (
    <VStack w="full" flex={1} data-testid="allocation-round-xapps-votes-breakdown-chart" spacing={6}>
      <Stack w="full" justify="space-between" direction={["column", "column", "row"]} spacing={8}>
        <VStack spacing={1} align="flex-start">
          <HStack spacing={3} align="center">
            <B3TRIcon boxSize="28px" colorVariant="dark" />
            <Skeleton isLoaded={!roundAmountLoading}>
              <Heading fontSize="28px" fontWeight={700}>
                {compactFormatter.format(totalDistributed)}
              </Heading>
            </Skeleton>
          </HStack>
          <Text fontSize="md" color="#6A6A6A">
            {t("To distribute among apps")}
          </Text>
        </VStack>
        <HStack spacing={8} align="center" w={["full", "full", "auto"]} justify={"space-between"}>
          <VStack spacing={0} align={["flex-start", "flex-start", "flex-end"]}>
            <Skeleton isLoaded={!votersLoading}>
              <Text fontWeight={600} fontSize={"18px"} color="#252525" data-testid={"total-voters"}>
                {compactFormatter.format(Number(voters ?? 0))}
              </Text>
            </Skeleton>
            <Text fontSize="14px" color="#6A6A6A" fontWeight={400}>
              {t("Wallets voted")}
            </Text>
          </VStack>
          <VStack spacing={0} align={["flex-start", "flex-start", "flex-end"]}>
            <Skeleton isLoaded={!xAppsLoading}>
              <Text fontWeight={600} fontSize={"18px"} color="#252525">
                {compactFormatter.format(Number(xApps?.length ?? 0))}
              </Text>
            </Skeleton>
            <Text fontSize="14px" color="#6A6A6A" fontWeight={400}>
              {t("Apps")}
            </Text>
          </VStack>
          <VStack spacing={0} align={["flex-start", "flex-start", "flex-end"]}>
            <Skeleton isLoaded={!maxAmountLoading}>
              <Text fontWeight={600} fontSize={"18px"} color="#252525">
                {compactFormatter.format(Number(maxAmount ?? 0))}
              </Text>
            </Skeleton>
            <Text fontSize="14px" color="#6A6A6A" fontWeight={400}>
              {t("Max app allocation")}
            </Text>
          </VStack>
        </HStack>
      </Stack>

      <VStack spacing={2} color={"#6194F5"} w="full">
        <Skeleton isLoaded={!roundAmountLoading} position="relative" w="full">
          <Box bg="#D5D5D5" h="8px" rounded="full" />
          {baseAmountsInfo.map((info, index) => {
            const left = baseAmountsInfo.slice(0, index).reduce((acc, curr) => acc + curr.percentage, 0)

            const borderRadiusLeft = index === 0 ? "full" : "none"
            const borderRadiusRight = index === baseAmountsInfo.length - 1 ? "full" : "none"
            return (
              <Box
                key={`distribution-chart-amount-${info.amount}-${info.color}`}
                bg={info.color}
                h="8px"
                borderLeftRadius={borderRadiusLeft}
                borderRightRadius={borderRadiusRight}
                left={`${left}%`}
                w={`${info.percentage}%`}
                position="absolute"
                top={0}
              />
            )
          })}
        </Skeleton>
      </VStack>
      <Stack direction={["column", "column", "row"]} w="full" spacing={[4, 4, 8]}>
        {baseAmountsInfo.map(info => (
          <Skeleton isLoaded={!info.isLoading} key={`distribution-chart-amount-${info.amount}-${info.color}`}>
            <HStack w="full" spacing={1} color="#252525">
              <DotSymbol size={4} color={info.color} />
              <Text ml={1} fontSize="md" fontWeight={600}>
                {compactFormatter.format(Number(info.amount))}
              </Text>
              <Text fontSize="md">
                {t("({{percentage}}%) as {{label}}", {
                  percentage: info.percentage.toLocaleString("en", { minimumFractionDigits: 2 }),
                  label: info.label,
                })}
              </Text>
            </HStack>
          </Skeleton>
        ))}
      </Stack>
    </VStack>
  )
}
