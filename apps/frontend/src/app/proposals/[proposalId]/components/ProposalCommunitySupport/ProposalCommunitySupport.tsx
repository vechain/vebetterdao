import { Arm } from "@/components/Icons/Arm"
import { Box, Button, Card, Circle, Flex, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"

export const ProposalCommunitySupport = () => {
  const proposal = {
    isDepositReached: true,
    roundIdVoteStart: 1,
    communityDeposits: 0,
    depositThreshold: 10000,
    communityDepositPercentage: 0.8,
    supportingUserCount: 20,
    yourSupport: 20,
    othersSupport: 500,
    othersSupportPercentage: 0.7,
  }
  const { t } = useTranslation()

  const yourDepositColor = proposal.isDepositReached ? "#6DCB09" : "#004CFC"
  const othersDepositColor = proposal.isDepositReached ? "#B1F16C" : "#77A0FF"
  return (
    <Card
      border={`1px solid ${proposal.isDepositReached ? "#D5D5D5" : "#004CFC"}`}
      rounded="16px"
      p="24px"
      boxShadow={proposal.isDepositReached ? undefined : "0px 0px 16px 0px #004CFC59"}>
      <VStack alignItems={"stretch"} gap={6}>
        <HStack justify="space-between">
          <Heading fontSize={"24px"} fontWeight={700}>
            {t("Community Support")}
          </Heading>
          <UilInfoCircle size="24px" color={yourDepositColor} />
        </HStack>
        <Text fontSize={"14px"}>
          {t("This proposal needs to get enough support for the community to be voted on Round {{round}}.", {
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
                {proposal.communityDeposits}
              </Text>
              <Text fontSize={"20px"} fontWeight={500} color={"#252525"}>
                {t("/")}
              </Text>
              <Text fontSize={"20px"} fontWeight={500} color={"#252525"}>
                {proposal.depositThreshold}
              </Text>
            </HStack>
            <Text fontSize={"18px"} fontWeight={400} color={"#6A6A6A"}>
              {proposal.communityDepositPercentage * 100}
              {t("%")}
            </Text>
          </HStack>
          <Box position="relative">
            <Box bg="#D5D5D5" h="10px" rounded="full" />
            <Box
              bg={yourDepositColor}
              h="10px"
              rounded="full"
              w={`${proposal.communityDepositPercentage * 100 || 0}%`}
              position="absolute"
              top={0}
              left={0}
            />
            <Box
              bg={othersDepositColor}
              h="10px"
              rounded="full"
              w={`${proposal.othersSupportPercentage * 100 || 0}%`}
              position="absolute"
              top={0}
              left={0}
            />
          </Box>
          <HStack gap={4}>
            <HStack>
              <Circle size="12px" bg={othersDepositColor} />
              <Text fontSize="14px" fontWeight={400}>
                {t("From {{users}} users {{vot3}} V3.", {
                  vot3: proposal.othersSupport || 0,
                  users: proposal.supportingUserCount,
                })}
              </Text>
            </HStack>
            <HStack>
              <Circle size="12px" bg={yourDepositColor} />
              <Text fontSize="14px" fontWeight={400}>
                {t("From you {{vot3}} V3.", { vot3: proposal.yourSupport || 0 })}
              </Text>
            </HStack>
          </HStack>
        </VStack>
        <HStack alignItems={"flex-end"} justify={"space-between"}>
          <Text fontSize="14px" fontWeight={600}>
            {t("You will be able to claim your tokens back when the voting round ends.")}
          </Text>
          <Button
            bgColor={proposal.isDepositReached ? "#E1E1E1" : "#004CFC"}
            disabled={proposal.isDepositReached}
            color={"#FFFFFF"}
            rounded={"full"}
            fontSize={"16px"}
            fontWeight={500}>
            {t("Support this proposal")}
          </Button>
        </HStack>
      </VStack>
    </Card>
  )
}
