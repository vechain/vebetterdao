import { Arm } from "@/components/Icons/Arm"
import { Box, Card, Circle, Flex, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { CommunitySupportButton } from "./components/CommunitySupportButton"
import { ProposalState } from "@/api"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useMemo } from "react"
import { ProposalWithdrawButton } from "../ProposalWithdrawButton"
import { useProposalDetail } from "../../hooks"

const compactFormatter = getCompactFormatter(2)

export const ProposalCommunitySupport = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()

  const isDepositNotMet = proposal.state === ProposalState.DepositNotMet

  const yourDepositColor = useMemo(() => {
    if (isDepositNotMet) {
      return "#D23F63"
    }
    if (proposal.isDepositReached) {
      return "#6DCB09"
    }
    return "#004CFC"
  }, [isDepositNotMet, proposal.isDepositReached])

  const othersDepositColor = useMemo(() => {
    if (isDepositNotMet) {
      return "#EC9BAF"
    }
    if (proposal.isDepositReached) {
      return "#B1F16C"
    }
    return "#77A0FF"
  }, [isDepositNotMet, proposal.isDepositReached])

  const boxShadow = useMemo(() => {
    if (isDepositNotMet) {
      return "0px 0px 5px 0px rgba(210, 63, 99, 0.40)"
    }
    if (proposal.isDepositReached) {
      return undefined
    }
    return "0px 0px 16px 0px #004CFC59"
  }, [isDepositNotMet, proposal.isDepositReached])

  const borderColor = useMemo(() => {
    if (isDepositNotMet) {
      return "#EC9BAF"
    }
    if (proposal.isDepositReached) {
      return "#6DCB09"
    }
    return "#004CFC"
  }, [isDepositNotMet, proposal.isDepositReached])

  if (proposal.state !== ProposalState.Pending && proposal.state !== ProposalState.DepositNotMet) {
    return null
  }
  return (
    <Card border={`1px solid ${borderColor}`} rounded="16px" p="24px" boxShadow={boxShadow}>
      <VStack alignItems={"stretch"} gap={6}>
        <HStack justify="space-between">
          <Heading fontSize={"24px"} fontWeight={700}>
            {t("Community Support")}
          </Heading>
          <UilInfoCircle size="24px" color={yourDepositColor} />
        </HStack>
        <Text fontSize={"14px"}>
          {isDepositNotMet
            ? t("This proposal won’t reach enough support and it was canceled.")
            : t("This proposal needs to get enough support for the community to be voted on Round {{round}}.", {
                round: proposal.roundIdVoteStart,
              })}
        </Text>
        <VStack alignItems={"stretch"} gap={4}>
          <HStack alignItems={"baseline"} justify={"space-between"}>
            <HStack alignItems={"baseline"}>
              <Flex position="relative" top="7px" display={"inline-flex"}>
                <Arm color={yourDepositColor} size={"36"} />
              </Flex>
              <Text fontSize={"28px"} color={"#252525"} fontWeight={700}>
                {compactFormatter.format(Number(proposal.communityDeposits))}
              </Text>
              <Text fontSize={"20px"} fontWeight={500} color={"#252525"}>
                {t("/")}
              </Text>
              <Text fontSize={"20px"} fontWeight={500} color={"#252525"}>
                {compactFormatter.format(Number(proposal.depositThreshold))}
              </Text>
            </HStack>
            <Text fontSize={"18px"} fontWeight={400} color={"#6A6A6A"}>
              {compactFormatter.format(proposal.communityDepositPercentage * 100)}
              {t("%")}
            </Text>
          </HStack>
          <Box position="relative">
            <Box bg="#D5D5D5" h="10px" rounded="full" />
            <Box
              bg={yourDepositColor}
              h="10px"
              rounded="full"
              w={`${proposal.communityDepositChartPercentage}%`}
              position="absolute"
              top={0}
              left={0}
            />
            <Box
              bg={othersDepositColor}
              h="10px"
              rounded="full"
              w={`${proposal.othersSupportChartPercentage}%`}
              position="absolute"
              top={0}
              left={0}
            />
          </Box>
          <HStack gap={4}>
            <HStack>
              <Circle size="12px" bg={othersDepositColor} />
              <Text fontSize="14px" fontWeight={400}>
                {t("From {{users}} users {{vot3}} VOT3.", {
                  vot3: compactFormatter.format(proposal.othersSupport || 0),
                  users: compactFormatter.format(Number(proposal.othersSupportUserCount)),
                })}
              </Text>
            </HStack>
            <HStack>
              <Circle size="12px" bg={yourDepositColor} />
              <Text fontSize="14px" fontWeight={400}>
                {t("From you {{vot3}} VOT3.", { vot3: compactFormatter.format(Number(proposal.userSupport)) })}
              </Text>
            </HStack>
          </HStack>
        </VStack>
        {isDepositNotMet ? (
          <>
            {proposal.isUserSupportLeft && (
              <HStack justify={"flex-end"}>
                <ProposalWithdrawButton />
              </HStack>
            )}
          </>
        ) : (
          <HStack alignItems={"flex-end"} justify={"space-between"}>
            <Text fontSize="14px" fontWeight={600}>
              {t("You will be able to claim your tokens back when the voting round ends.")}
            </Text>
            <CommunitySupportButton />
          </HStack>
        )}
      </VStack>
    </Card>
  )
}
