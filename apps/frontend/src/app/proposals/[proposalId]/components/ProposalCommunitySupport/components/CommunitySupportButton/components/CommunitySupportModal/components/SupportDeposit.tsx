import { useCurrentProposal, useVot3Balance } from "@/api"
import { filterAmountInput } from "@/utils"
import { Box, Button, Divider, HStack, Image, Input, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/dapp-kit-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { ProposalSupportProgressChart } from "@/components/ProposalSupportProgressChart/ProposalSupportProgressChart"

export const SupportDeposit = ({ onSubmit }: { onSubmit: (amount: string) => void }) => {
  const { t } = useTranslation()
  const { proposal } = useCurrentProposal()
  const [amount, setAmount] = useState("")
  const { account } = useWallet()
  const { data: vot3Balance } = useVot3Balance(account ?? undefined)

  const depositMax = useCallback(() => {
    setAmount(vot3Balance?.scaled ?? "")
  }, [vot3Balance])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setAmount(filterAmountInput(e.target.value, { maxBalance: vot3Balance?.scaled })),
    [vot3Balance?.scaled],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      onSubmit(amount)
      e.preventDefault()
    },
    [amount, onSubmit],
  )
  const userDepositsForecasted = useMemo(
    () => Number(amount) + proposal.communityDeposits,
    [amount, proposal.communityDeposits],
  )

  const isDepositThresholdReached = useMemo(
    () => userDepositsForecasted >= proposal.depositThreshold,
    [userDepositsForecasted, proposal.depositThreshold],
  )

  return (
    <VStack gap={6} alignItems={"stretch"} as="form" onSubmit={handleSubmit}>
      <Text fontSize={"28px"} fontWeight={700}>
        {t("Support this proposal with VOT3")}
      </Text>
      <Text>
        {t(
          "Show your support to this proposal by contributing with your VOT3 tokens, allowing it to be up for voting on Round {{round}}",
          { round: proposal.roundIdVoteStart },
        )}
      </Text>
      <VStack alignItems={"stretch"}>
        <Text fontSize={"14px"} color="#6A6A6A">
          {t("Your contribution")}
        </Text>
        <HStack>
          <Image h="36px" w="36px" src="/images/vot3-token.png" alt="vot3-token" />
          <Input
            h="50px"
            placeholder="0"
            fontSize="36px"
            fontWeight={700}
            type="text"
            value={amount}
            onChange={handleChange}
            variant="unstyled"
            _placeholder={{ color: "black" }}
          />
          {Number(vot3Balance?.scaled) !== Number(amount) && (
            <Box>
              <Button
                isDisabled={!vot3Balance?.scaled}
                onClick={depositMax}
                color="#004CFC"
                fontSize="14px"
                fontWeight={500}
                bg={"#E0E9FE"}
                h="30px"
                px="16px"
                rounded={"full"}>
                {t("Deposit max")}
              </Button>
            </Box>
          )}
        </HStack>
        <Divider />
      </VStack>
      <VStack alignItems={"stretch"}>
        <Text fontSize={"14px"} color="#6A6A6A">
          {t("Forecasted proposal support")}
        </Text>
        {/* <HStack alignItems={"baseline"} justify={"space-between"}>
          <HStack alignItems={"baseline"}>
            <Flex position="relative" top="7px" display={"inline-flex"}>
              <Arm color={"#004CFC"} size={"36"} />
            </Flex>
            <Text fontSize={"28px"} color={"#252525"} fontWeight={400}>
              {compactFormatter.format(communityDepositsForecast)}
            </Text>
            <Text fontSize={"20px"} fontWeight={500} color={"#6A6A6A"}>
              {t("/")}
            </Text>
            <Text fontSize={"20px"} fontWeight={500} color={"#6A6A6A"}>
              {compactFormatter.format(Number(proposal.depositThreshold))}
            </Text>
          </HStack>
          <Text fontSize={"14px"} fontWeight={400} color={"#6A6A6A"}>
            {compactFormatter.format(communityDepositsForecastPercentage)}
            {t("%")}
          </Text>
        </HStack>
        <Box position="relative">
          <Box bg="#D5D5D5" h="10px" rounded="full" />
          <Box
            bg={"#004CFC"}
            h="10px"
            rounded="full"
            w={`${communityDepositsForecastChartPercentage}%`}
            position="absolute"
            top={0}
            left={0}
          />
          <Box
            bg={"#77A0FF"}
            h="10px"
            rounded="full"
            w={`${communityDepositsChartPercentage}%`}
            position="absolute"
            top={0}
            left={0}
          />
        </Box> */}
        <ProposalSupportProgressChart
          depositThreshold={proposal.depositThreshold}
          userDeposits={userDepositsForecasted}
          othersDeposits={proposal.othersSupport}
          otherDepositsUsersCount={0}
          renderVotesDistributionLabel={false}
          isFailedDueToDeposit={false}
          isDepositThresholdReached={isDepositThresholdReached}
        />
      </VStack>
      <Text fontWeight={600} fontSize={"14px"}>
        {t("You will be able to claim your tokens back when the voting round ends.")}
      </Text>
      <Button isDisabled={!Number(amount)} w="full" variant="primaryAction" type="submit">
        {t("Deposit VOT3")}
      </Button>
    </VStack>
  )
}
