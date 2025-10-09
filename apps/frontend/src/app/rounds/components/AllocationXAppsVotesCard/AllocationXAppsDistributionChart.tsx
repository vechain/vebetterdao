import {
  useAllocationAmount,
  useAllocationBaseAmount,
  useAllocationVoters,
  useMaxAllocationAmount,
  useMultipleXAppRoundEarnings,
  useRoundXApps,
} from "@/api"
import { B3TRIcon, DotSymbol } from "@/components"
import { VStack, Heading, Text, Box, Skeleton, Stack, HStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
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

  const baseAmountsInfo = useMemo(() => {
    return [
      {
        amount: totalBaseAmount,
        isLoading: baseAmountLoading || xAppsLoading,
        percentage: baseAmountsPercentage.baseAmount,
        color: "status.info.primary",
        label: "base allocation",
      },
      {
        amount: totalEarningsWithoutBase,
        isLoading: baseAmountLoading || forecastedEarningsQuery.isLoading,
        percentage: baseAmountsPercentage.votesAmount,
        color: "graph.4",
        label: "votes allocation",
      },
    ]
  }, [
    baseAmountLoading,
    xAppsLoading,
    totalBaseAmount,
    baseAmountsPercentage,
    totalEarningsWithoutBase,
    forecastedEarningsQuery,
  ])

  return (
    <VStack w="full" flex={1} data-testid="allocation-round-xapps-votes-breakdown-chart" gap={6}>
      <Stack w="full" justify="space-between" direction={["column", "column", "row"]} gap={8}>
        <VStack gap={1} align="flex-start">
          <HStack gap={3} align="center">
            <B3TRIcon boxSize="28px" colorVariant="dark" />
            <Skeleton loading={roundAmountLoading}>
              <Heading size="3xl">{compactFormatter.format(totalDistributed)}</Heading>
            </Skeleton>
          </HStack>
          <Text textStyle="md" color="text.subtle">
            {t("To distribute among apps")}
          </Text>
        </VStack>
        <HStack gap={8} align="center" w={["full", "full", "auto"]} justify={"space-between"}>
          <VStack gap={0} align={["flex-start", "flex-start", "flex-end"]}>
            <Skeleton loading={votersLoading}>
              <Text fontWeight="semibold" textStyle="lg" data-testid={"total-voters"}>
                {compactFormatter.format(Number(voters ?? 0))}
              </Text>
            </Skeleton>
            <Text textStyle="sm" color="text.subtle">
              {t("Wallets voted")}
            </Text>
          </VStack>
          <VStack gap={0} align={["flex-start", "flex-start", "flex-end"]}>
            <Skeleton loading={xAppsLoading}>
              <Text fontWeight="semibold" textStyle="lg">
                {compactFormatter.format(Number(xApps?.length ?? 0))}
              </Text>
            </Skeleton>
            <Text textStyle="sm" color="text.subtle">
              {t("Apps")}
            </Text>
          </VStack>
          <VStack gap={0} align={["flex-start", "flex-start", "flex-end"]}>
            <Skeleton loading={maxAmountLoading}>
              <Text fontWeight="semibold" textStyle="lg">
                {compactFormatter.format(Number(maxAmount ?? 0))}
              </Text>
            </Skeleton>
            <Text textStyle="sm" color="text.subtle">
              {t("Max app allocation")}
            </Text>
          </VStack>
        </HStack>
      </Stack>

      <VStack gap={2} color={"status.info.primary"} w="full">
        <Skeleton loading={roundAmountLoading} position="relative" w="full">
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
      <Stack direction={["column", "column", "row"]} w="full" gap={[4, 4, 8]}>
        {baseAmountsInfo.map(info => (
          <Skeleton loading={info.isLoading} key={`distribution-chart-amount-${info.amount}-${info.color}`}>
            <HStack w="full" gap={1}>
              <DotSymbol size={4} color={info.color} />
              <Text ml={1} textStyle="md" fontWeight="semibold">
                {compactFormatter.format(Number(info.amount))}
              </Text>
              <Text textStyle="md">
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
