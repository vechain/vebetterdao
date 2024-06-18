import {
  useAllocationAmount,
  useAllocationBaseAmount,
  useAllocationVoters,
  useMultipleXAppRoundEarnings,
  useRoundXApps,
  useXAppsVotes,
} from "@/api"
import { B3TRIcon, DotSymbol } from "@/components"
import { VStack, HStack, Heading, useColorModeValue, Text, Box, CardBody, Card, Skeleton } from "@chakra-ui/react"
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

  const { data: xApps, isLoading: xAppsLoading } = useRoundXApps(roundId)

  const xAppsVotes = useXAppsVotes(xApps?.map(app => app.id) ?? [], roundId)

  const forecastedEarningsQueries = useMultipleXAppRoundEarnings(roundId, xApps?.map(app => app.id) ?? [])

  const { data: voters, isLoading: votersLoading } = useAllocationVoters(roundId)

  const totalDistributed = useMemo(() => {
    if (!roundAmount) return 0
    return Number(roundAmount.voteXAllocations)
  }, [roundAmount])

  // the total amount of B3TR distributed in the round only votes
  const totalEarningsWithoutBase = useMemo(() => {
    if (!forecastedEarningsQueries || !baseAmount) return 0
    return forecastedEarningsQueries.reduce(
      (acc, curr) => acc + Number(curr?.data?.amount ?? 0) - Number(baseAmount),
      0,
    )
  }, [forecastedEarningsQueries, baseAmount])

  //the percentage of the total amount of B3TR distrivuted in the round between the base and votes
  const baseAmountsPercentage = useMemo(() => {
    return {
      baseAmount: getSafeScaledPercentage(Number(baseAmount) / totalDistributed),
      votesAmount: getSafeScaledPercentage(Number(totalEarningsWithoutBase) / totalDistributed),
    }
  }, [baseAmount, totalEarningsWithoutBase, totalDistributed])

  const votingRewardsColor = useColorModeValue("#225EED", "#225EED")
  const appsColor = useColorModeValue("#5FA5F9", "#5FA5F9")

  const baseAmountsInfo = useMemo(() => {
    return [
      {
        amount: baseAmount,
        percentage: baseAmountsPercentage.baseAmount,
        color: votingRewardsColor,
        label: "base allocation",
      },
      {
        amount: totalEarningsWithoutBase,
        percentage: baseAmountsPercentage.votesAmount,
        color: appsColor,
        label: "votes allocation",
      },
    ]
  }, [baseAmountsPercentage, totalEarningsWithoutBase, appsColor, votingRewardsColor, baseAmount])

  return (
    <VStack w="full" flex={1} data-testid="allocation-round-xapps-votes-breakdown-chart" spacing={8}>
      <HStack w="full" justify="space-between">
        <VStack spacing={1} align="flex-start">
          <HStack spacing={2} align="center">
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
        <HStack spacing={8} align="center">
          <VStack spacing={1} align="flex-end">
            <Skeleton isLoaded={!votersLoading}>
              <Text fontWeight={600} fontSize={"16px"} color="#252525">
                {compactFormatter.format(Number(voters ?? 0))}
              </Text>
            </Skeleton>
            <Text fontSize="14px" color="#6A6A6A" fontWeight={400}>
              {t("Voters")}
            </Text>
          </VStack>
          <VStack spacing={1} align="flex-end">
            <Skeleton isLoaded={!xAppsLoading}>
              <Text fontWeight={600} fontSize={"16px"} color="#252525">
                {compactFormatter.format(Number(xApps?.length ?? 0))}
              </Text>
            </Skeleton>
            <Text fontSize="14px" color="#6A6A6A" fontWeight={400}>
              {t("Apps")}
            </Text>
          </VStack>
          <VStack spacing={1} align="flex-end">
            <Skeleton isLoaded={!votersLoading}>
              <Text fontWeight={600} fontSize={"16px"} color="#252525">
                {compactFormatter.format(Number(voters ?? 0))}
              </Text>
            </Skeleton>
            <Text fontSize="14px" color="#6A6A6A" fontWeight={400}>
              {t("Max app allocation")}
            </Text>
          </VStack>
        </HStack>
      </HStack>

      <VStack spacing={2} color={"#6194F5"} w="full">
        <Skeleton isLoaded={!roundAmountLoading} position="relative" w="full">
          <Box bg="#D5D5D5" h="8px" rounded="full" />
          {baseAmountsInfo.map((info, index) => {
            const left = baseAmountsInfo.slice(0, index).reduce((acc, curr) => acc + curr.percentage, 0)

            const borderRadiusLeft = index === 0 ? "full" : "none"
            const borderRadiusRight = index === baseAmountsInfo.length - 1 ? "full" : "none"
            return (
              <Box
                key={index}
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
      <HStack w="full" spacing={8}>
        {baseAmountsInfo.map((info, index) => (
          <Skeleton isLoaded={!roundAmountLoading} key={index}>
            <HStack w="full" spacing={1} color="#252525">
              <DotSymbol size={4} color={info.color} />
              <Text ml={1} fontSize="md" fontWeight={600}>
                {compactFormatter.format(Number(info.amount))}
              </Text>
              <Text fontSize="md">
                {t("({{percentage}}%) as {{label}}", {
                  percentage: info.percentage,
                  label: info.label,
                })}
              </Text>
            </HStack>
          </Skeleton>
        ))}
      </HStack>
    </VStack>
  )
}
