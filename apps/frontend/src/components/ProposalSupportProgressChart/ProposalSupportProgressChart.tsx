import { Box, Circle, Flex, HStack, Text, VStack } from "@chakra-ui/react"
import { t } from "i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { FaRegHeart } from "react-icons/fa6"

const getSafeScaledPercentage = (percentage: number) => Math.min(percentage, 1) * 100

const compactFormatter = getCompactFormatter(1)

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
 * @param {Props} props
 * @param {boolean} props.isDepositThresholdReached - Whether the deposit threshold is reached
 * @param {boolean} props.isFailedDueToDeposit - Whether the proposal failed due to deposit
 * @param {number} props.depositThreshold - The deposit threshold
 * @param {number} props.userDeposits - The user deposits
 * @param {number} props.othersDeposits - The others deposits
 * @param {number} props.otherDepositsUsersCount - The other deposits users count
 * @param {boolean} props.renderVotesDistributionLabel - Whether to render the votes distribution label
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

  const totalDepositsPercentage = useMemo(() => {
    const percentage = (totalDeposits / depositThreshold) * 100
    return percentage < 100 ? percentage.toFixed(2) : 100
  }, [totalDeposits, depositThreshold])

  const userDepositsPercentage = useMemo(
    () => getSafeScaledPercentage(userDeposits / depositThreshold),
    [userDeposits, depositThreshold],
  )

  const othersDepositsPercentage = useMemo(
    () => getSafeScaledPercentage(othersDeposits / depositThreshold),
    [othersDeposits, depositThreshold],
  )

  return (
    <VStack alignItems={"stretch"} spacing={3} w="full" data-testid="proposal-support-progress-chart">
      <HStack alignItems={"baseline"} justify={"space-between"}>
        <HStack alignItems={"baseline"}>
          <Flex position="relative" top="7px" display={"inline-flex"}>
            <FaRegHeart color={yourDepositColor} size={"36"} />
          </Flex>
          <Text fontSize={"28px"} fontWeight={700}>
            {compactFormatter.format(totalDeposits)}
          </Text>
          <Text fontSize={"20px"} fontWeight={500}>
            {t("/")}
          </Text>
          <Text fontSize={"20px"} fontWeight={500}>
            {compactFormatter.format(depositThreshold)}
          </Text>
        </HStack>
        <Text fontSize={"18px"} fontWeight={400} color={"#6A6A6A"}>
          {totalDepositsPercentage}
          {t("%")}
        </Text>
      </HStack>
      <Box position="relative">
        <Box bg="#D5D5D5" h="10px" rounded="full" />
        <Box
          bg={yourDepositColor}
          h="10px"
          roundedLeft={"full"}
          roundedRight={userDepositsPercentage === 100 ? "full" : 0}
          w={`${userDepositsPercentage}%`}
          position="absolute"
          top={0}
          left={0}
        />
        <Box
          bg={othersDepositColor}
          h="10px"
          roundedLeft={userDepositsPercentage === 0 ? "full" : 0}
          roundedRight={"full"}
          w={`${othersDepositsPercentage}%`}
          position="absolute"
          top={0}
          left={`${userDepositsPercentage}%`}
        />
      </Box>
      {renderVotesDistributionLabel && (
        <HStack gap={4}>
          <HStack>
            <Circle size="12px" bg={othersDepositColor} />
            <Text fontSize="14px" fontWeight={400}>
              {t("From {{users}} users {{vot3}} VOT3.", {
                vot3: compactFormatter.format(othersDeposits),
                users: compactFormatter.format(otherDepositsUsersCount),
              })}
            </Text>
          </HStack>
          <HStack>
            <Circle size="12px" bg={yourDepositColor} />
            <Text fontSize="14px" fontWeight={400}>
              {t("From you {{vot3}} VOT3.", { vot3: compactFormatter.format(Number(userDeposits)) })}
            </Text>
          </HStack>
        </HStack>
      )}
    </VStack>
  )
}
