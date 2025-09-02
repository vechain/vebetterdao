import { ProposalState } from "@/api"
import { Box, Card, Circle, Flex, HStack, Heading, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { ProposalWithdrawButton } from "../ProposalWithdrawButton"
import { useProposalDetail } from "../../hooks"
import { FaRegHeart } from "react-icons/fa6"

const compactFormatter = getCompactFormatter(1)

export const ProposalWithdrawDeposit = () => {
  const { proposal } = useProposalDetail()
  const { t } = useTranslation()
  return (
    <>
      {proposal.state !== ProposalState.Pending && proposal.userSupport != 0 && (
        <Card.Root
          border={`1px solid ${proposal.isUserSupportLeft ? "#004CFC" : "#D5D5D5"}`}
          rounded="16px"
          p="24px"
          boxShadow={proposal.isUserSupportLeft ? "0px 0px 16px 0px #004CFC59" : undefined}>
          <VStack alignItems={"stretch"} gap={6}>
            <HStack justify="space-between">
              <Heading size="2xl">{t("Community Support")}</Heading>
              <UilInfoCircle size="24px" color={"#004CFC"} />
            </HStack>
            <Text textStyle={"sm"}>
              {t(proposal.isUserSupportLeft ? "This round is ended, claim your tokens back." : "This round is ended.")}
            </Text>
            <VStack alignItems={"stretch"} gap={4}>
              <HStack alignItems={"baseline"} justify={"space-between"}>
                <HStack alignItems={"baseline"}>
                  <Flex position="relative" top="7px" display={"inline-flex"}>
                    <FaRegHeart color={"#004CFC"} size={"36"} />
                  </Flex>
                  <Text textStyle={"3xl"} color={"contrast-fg-on-dark-bg"}>
                    {compactFormatter.format(Number(proposal.communityDeposits))}
                  </Text>
                  <Text textStyle={"xl"} fontWeight="semibold" color={"contrast-fg-on-dark-bg"}>
                    {t("/")}
                  </Text>
                  <Text textStyle={"xl"} fontWeight="semibold" color={"contrast-fg-on-dark-bg"}>
                    {compactFormatter.format(Number(proposal.depositThreshold))}
                  </Text>
                </HStack>
                <Text textStyle={"lg"} color={"#6A6A6A"}>
                  {compactFormatter.format(proposal.communityDepositPercentage * 100)}
                  {t("%")}
                </Text>
              </HStack>
              <Box position="relative">
                <Box bg="#D5D5D5" h="10px" rounded="full" />
                <Box
                  bg={"#004CFC"}
                  h="10px"
                  rounded="full"
                  w={`${proposal.communityDepositChartPercentage}%`}
                  position="absolute"
                  top={0}
                  left={0}
                />
                <Box
                  bg={"#77A0FF"}
                  h="10px"
                  rounded="full"
                  w={`${proposal.othersSupportChartPercentage}%`}
                  position="absolute"
                  top={0}
                  left={0}
                />
              </Box>
              <VStack align={"stretch"}>
                <HStack>
                  <Circle size="12px" bg={"#77A0FF"} />
                  <Text textStyle="sm">
                    {t("From {{users}} users {{vot3}} VOT3.", {
                      vot3: compactFormatter.format(proposal.othersSupport || 0),
                      users: compactFormatter.format(Number(proposal.othersSupportUserCount)),
                    })}
                  </Text>
                </HStack>
                <HStack>
                  <Circle size="12px" bg={"#004CFC"} />
                  <Text textStyle="sm">
                    {t("From you {{vot3}} VOT3.", { vot3: compactFormatter.format(Number(proposal.userSupport)) })}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
            {proposal.isUserSupportLeft && <ProposalWithdrawButton />}
          </VStack>
        </Card.Root>
      )}
    </>
  )
}
