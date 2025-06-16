import { useAllocationAmount } from "@/api"
import { B3TRIcon, DotSymbol } from "@/components"
import {
  VStack,
  HStack,
  Heading,
  useColorModeValue,
  Text,
  Box,
  CardBody,
  Card,
  Skeleton,
  useMediaQuery,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(2)

type Props = {
  roundId: string
}

export const AllocationRoundBreakdownChart = ({ roundId }: Props) => {
  const { t } = useTranslation()
  const [isDesktop] = useMediaQuery("(min-width: 800px)")

  const { data: roundAmount, isLoading: roundAmountLoading } = useAllocationAmount(roundId)

  const totalDistributed = useMemo(() => {
    if (!roundAmount) return 0
    return (
      Number(roundAmount.treasury) +
      Number(roundAmount.voteXAllocations) +
      Number(roundAmount.voteX2Earn) +
      Number(roundAmount.gm)
    )
  }, [roundAmount])

  const baseAmountsPercentage = useMemo(() => {
    return {
      treasury: (Number(roundAmount?.treasury) / totalDistributed) * 100,
      voteXAllocations: (Number(roundAmount?.voteXAllocations) / totalDistributed) * 100,
      voteX2Earn: (Number(roundAmount?.voteX2Earn) / totalDistributed) * 100,
      gm: (Number(roundAmount?.gm) / totalDistributed) * 100,
    }
  }, [totalDistributed, roundAmount])

  const treasuryColor = useColorModeValue("#203A87", "#203A87")
  const votingRewardsColor = useColorModeValue("#225EED", "#225EED")
  const appsColor = useColorModeValue("#5FA5F9", "#5FA5F9")
  const gmColor = useColorModeValue("#4A6FA5", "#4A6FA5")

  const baseAmountsInfo = useMemo(() => {
    return [
      {
        amount: roundAmount?.treasury,
        percentage: baseAmountsPercentage.treasury,
        color: treasuryColor,
        label: t("treasury"),
      },
      {
        amount: roundAmount?.voteXAllocations,
        percentage: baseAmountsPercentage.voteXAllocations,
        color: votingRewardsColor,
        label: t("voting rewards"),
      },
      {
        amount: roundAmount?.voteX2Earn,
        percentage: baseAmountsPercentage.voteX2Earn,
        color: appsColor,
        label: t("app rewards"),
      },
      {
        amount: roundAmount?.gm,
        percentage: baseAmountsPercentage.gm,
        color: gmColor,
        label: t("gm rewards"),
      },
    ]
  }, [baseAmountsPercentage, roundAmount, treasuryColor, votingRewardsColor, appsColor, gmColor, t])

  const Wrapper = useCallback(
    ({ children }: { children: React.ReactNode }) => {
      if (isDesktop)
        return (
          <Card variant="filled" w="full" flex={1} data-testid="allocation-round-breakdown-chart">
            <CardBody as={VStack} justify={"space-between"}>
              {children}
            </CardBody>
          </Card>
        )
      return (
        <VStack w="full" flex={1} data-testid="allocation-round-breakdown-chart" spacing={6}>
          {children}
        </VStack>
      )
    },
    [isDesktop],
  )

  return (
    <Wrapper>
      <Box w="full">
        <HStack spacing={3} align="center">
          <B3TRIcon boxSize="36px" colorVariant="dark" />
          <Skeleton isLoaded={!roundAmountLoading}>
            <Heading fontSize="36px" fontWeight={700}>
              {compactFormatter.format(totalDistributed)}
            </Heading>
          </Skeleton>
        </HStack>
        <Text fontSize="md" color="#6A6A6A">
          {t("Total allocation to distribute")}
        </Text>
      </Box>

      {/* FIX: Constrain progress bar in relative container */}
      <Box position="relative" w="full" h="8px" rounded="full" bg="#D5D5D5" overflow="hidden">
        {!roundAmountLoading &&
          baseAmountsInfo.map((info, index) => {
            const left = baseAmountsInfo.slice(0, index).reduce((acc, curr) => acc + curr.percentage, 0)

            const borderRadiusLeft = index === 0 ? "full" : "none"
            const borderRadiusRight = index === baseAmountsInfo.length - 1 ? "full" : "none"

            return (
              <Box
                key={`allocation-bar-${info.label}`}
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
      </Box>

      <VStack w="full" spacing={4}>
        {baseAmountsInfo.map(info => (
          <Skeleton
            isLoaded={!roundAmountLoading}
            key={`allocation-chart-amount-${info.amount}-${info.color}`}
            w="full">
            <HStack w="full" spacing={1}>
              <DotSymbol size={4} color={info.color} />
              <Text ml={1} fontSize="md" fontWeight={600}>
                {compactFormatter.format(Number(info.amount))}
              </Text>
              <Text fontSize="md">
                {t("({{percentage}}%) as {{label}}", {
                  percentage: info.percentage.toLocaleString("en", {
                    minimumFractionDigits: 2,
                  }),
                  label: info.label,
                })}
              </Text>
            </HStack>
          </Skeleton>
        ))}
      </VStack>
    </Wrapper>
  )
}
