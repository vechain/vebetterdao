import { useAllocationAmount } from "@/api"
import { B3TRIcon, DotSymbol } from "@/components"
import { VStack, HStack, Heading, useColorModeValue, Text, Box, CardBody, Card, Skeleton } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(2)

type Props = {
  roundId: string
}
export const AllocationRoundBreakdownChart = ({ roundId }: Props) => {
  const { t } = useTranslation()

  //TODO: Handle error
  const { data: roundAmount, isLoading: roundAmountLoading } = useAllocationAmount(roundId)

  //the total amount of B3TR distrivuted in the round between the pools
  const totalDistributed = useMemo(() => {
    if (!roundAmount) return 0
    return Number(roundAmount.treasury) + Number(roundAmount.voteXAllocations) + Number(roundAmount.voteX2Earn)
  }, [roundAmount])

  //the percentage of the total amount of B3TR distrivuted in the round between the pools
  const baseAmountsPercentage = useMemo(() => {
    return {
      treasury: (Number(roundAmount?.treasury) / totalDistributed) * 100,
      voteXAllocations: (Number(roundAmount?.voteXAllocations) / totalDistributed) * 100,
      voteX2Earn: (Number(roundAmount?.voteX2Earn) / totalDistributed) * 100,
    }
  }, [totalDistributed, roundAmount])

  const treasuryColor = useColorModeValue("#203A87", "#203A87")
  const votingRewardsColor = useColorModeValue("#225EED", "#225EED")
  const appsColor = useColorModeValue("#5FA5F9", "#5FA5F9")

  const baseAmountsInfo = useMemo(() => {
    return [
      {
        amount: roundAmount?.treasury,
        percentage: baseAmountsPercentage.treasury,
        color: treasuryColor,
        label: "treasury",
      },
      {
        amount: roundAmount?.voteXAllocations,
        percentage: baseAmountsPercentage.voteXAllocations,
        color: votingRewardsColor,
        label: "voting rewards",
      },
      {
        amount: roundAmount?.voteXAllocations,
        percentage: baseAmountsPercentage.voteX2Earn,
        color: appsColor,
        label: "app rewards",
      },
    ]
  }, [baseAmountsPercentage, roundAmount, treasuryColor, votingRewardsColor, appsColor])

  return (
    <Card variant="filled" w="full" flex={1}>
      <CardBody as={VStack} justify={"space-between"}>
        <Box w="full">
          <HStack spacing={2} align="center">
            <B3TRIcon boxSize="40px" colorVariant="dark" />
            <Skeleton isLoaded={!roundAmountLoading}>
              <Heading size="xl">{compactFormatter.format(totalDistributed)}</Heading>
            </Skeleton>
          </HStack>
          <Text fontSize="md" color="#6A6A6A">
            {t("Total allocation to distribute")}
          </Text>
        </Box>

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
        <VStack w="full" spacing={4}>
          {baseAmountsInfo.map((info, index) => (
            <HStack w="full" spacing={1} color="#252525" key={index}>
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
          ))}
        </VStack>
      </CardBody>
    </Card>
  )
}
