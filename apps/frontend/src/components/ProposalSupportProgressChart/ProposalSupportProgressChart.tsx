import { Box, Circle, Flex, HStack, Text, VStack } from "@chakra-ui/react"
import { t } from "i18next"
import { Arm } from "../Icons/Arm"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
const compactFormatter = getCompactFormatter(2)

const getSafeScaledPercentage = (percentage: number) => Math.min(percentage, 1) * 100

type Props = {
  isDepositThresholdReached?: boolean
  isFailedDueToDeposit?: boolean
  depositThreshold: number
  userDeposits: number
  othersDeposits: number
  otherDepositsUsersCount: number
  renderVotesDistributionLabel?: boolean
}
/**
 * Renders the proposal support progress chart
 * @returns  JSX.Element
 */
export const ProposalSupportProgressChart = ({
  isDepositThresholdReached,
  isFailedDueToDeposit,
  depositThreshold,
  userDeposits,
  othersDeposits,
  otherDepositsUsersCount,
  renderVotesDistributionLabel = true,
}: Props) => {
  const yourDepositColor = useMemo(() => {
    if (isFailedDueToDeposit) {
      return "#D23F63"
    }
    if (isDepositThresholdReached) {
      return "#6DCB09"
    }
    return "#004CFC"
  }, [isFailedDueToDeposit, isDepositThresholdReached])

  const othersDepositColor = useMemo(() => {
    if (isFailedDueToDeposit) {
      return "#EC9BAF"
    }
    if (isDepositThresholdReached) {
      return "#B1F16C"
    }
    return "#77A0FF"
  }, [isFailedDueToDeposit, isDepositThresholdReached])

  const totalDeposits = useMemo(() => userDeposits + othersDeposits, [userDeposits, othersDeposits])

  const totalDepositsPercentage = useMemo(() => totalDeposits / depositThreshold, [totalDeposits, depositThreshold])

  const userDepositsPercentage = useMemo(() => userDeposits / depositThreshold, [userDeposits, depositThreshold])

  const othersDepositsPercentage = useMemo(() => othersDeposits / depositThreshold, [othersDeposits, depositThreshold])

  return (
    <VStack alignItems={"stretch"} spacing={2} w="full">
      <HStack alignItems={"baseline"} justify={"space-between"}>
        <HStack alignItems={"baseline"}>
          <Flex position="relative" top="7px" display={"inline-flex"}>
            <Arm color={yourDepositColor} size={"36"} />
          </Flex>
          <Text fontSize={"28px"} color={"#252525"} fontWeight={700}>
            {compactFormatter.format(totalDeposits)}
          </Text>
          <Text fontSize={"20px"} fontWeight={500} color={"#252525"}>
            {t("/")}
          </Text>
          <Text fontSize={"20px"} fontWeight={500} color={"#252525"}>
            {compactFormatter.format(depositThreshold)}
          </Text>
        </HStack>
        <Text fontSize={"18px"} fontWeight={400} color={"#6A6A6A"}>
          {compactFormatter.format(getSafeScaledPercentage(totalDepositsPercentage))}
          {t("%")}
        </Text>
      </HStack>
      <Box position="relative">
        <Box bg="#D5D5D5" h="10px" rounded="full" />
        <Box
          bg={yourDepositColor}
          h="10px"
          rounded="full"
          w={`${getSafeScaledPercentage(userDepositsPercentage)}%`}
          position="absolute"
          top={0}
          left={0}
        />
        <Box
          bg={othersDepositColor}
          h="10px"
          rounded="full"
          w={`${getSafeScaledPercentage(othersDepositsPercentage)}%`}
          position="absolute"
          top={0}
          left={0}
        />
      </Box>
      {renderVotesDistributionLabel && (
        <HStack gap={4}>
          <HStack>
            <Circle size="12px" bg={othersDepositColor} />
            <Text fontSize="14px" fontWeight={400}>
              {t("From {{users}} users {{vot3}} V3.", {
                vot3: othersDeposits || 0,
                users: compactFormatter.format(otherDepositsUsersCount),
              })}
            </Text>
          </HStack>
          <HStack>
            <Circle size="12px" bg={yourDepositColor} />
            <Text fontSize="14px" fontWeight={400}>
              {t("From you {{vot3}} V3.", { vot3: compactFormatter.format(Number(userDeposits)) })}
            </Text>
          </HStack>
        </HStack>
      )}
    </VStack>
  )
}
