import { filterAmountInput } from "@/utils"
import { Box, Button, Divider, HStack, Image, Input, Text, VStack } from "@chakra-ui/react"
import { useGetVot3Balance, useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { ethers } from "ethers"
import { BigNumber } from "bignumber.js"
import { ProposalSupportProgressChart } from "@/components/ProposalSupportProgressChart/ProposalSupportProgressChart"

export const SupportDeposit = ({ onSubmit }: { onSubmit: (amount: string) => void }) => {
  const { t } = useTranslation()
  const { proposal } = useProposalDetail()
  const [amount, setAmount] = useState("")
  const { account } = useWallet()
  const { data: vot3Balance } = useGetVot3Balance(account?.address ?? undefined)

  const missingSupport = useMemo(
    () => proposal.depositThreshold - proposal.communityDeposits,
    [proposal.communityDeposits, proposal.depositThreshold],
  )
  const parsedAmount = useMemo(() => {
    if (!amount || !ethers) return "0"

    try {
      return `${ethers.parseEther(amount)}`
    } catch (e) {
      return "0"
    }
  }, [amount])

  const depositMax = useCallback(() => {
    if (!vot3Balance) return

    const scaledBalanceBN = BigNumber(vot3Balance.scaled)
    const missingSupportBN = BigNumber(missingSupport)

    if (scaledBalanceBN.gt(missingSupportBN)) {
      setAmount(missingSupportBN.toString())
      return
    }
    setAmount(scaledBalanceBN.toString())
  }, [vot3Balance, missingSupport])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) return setAmount("0")
      const input = filterAmountInput(e.target.value, { maxBalance: vot3Balance?.scaled })
      const scaledBalanceBN = BigNumber(vot3Balance?.scaled ?? 0)
      const missingSupportBN = BigNumber(missingSupport ?? 0)

      // Get the minimum value, between the input, the scaled balance and the missing support
      const cappedAmountBN = BigNumber.min(BigNumber(input), scaledBalanceBN, missingSupportBN)

      setAmount(cappedAmountBN.toString())
    },
    [missingSupport, vot3Balance?.scaled],
  )

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      onSubmit(parsedAmount)
      e.preventDefault()
    },
    [onSubmit, parsedAmount],
  )

  const userDepositsForecasted = useMemo(() => Number(amount) + proposal.userSupport, [amount, proposal.userSupport])

  const isDepositThresholdReached = useMemo(
    () => userDepositsForecasted >= proposal.depositThreshold,
    [userDepositsForecasted, proposal.depositThreshold],
  )

  return (
    <VStack gap={6} alignItems={"stretch"} as="form" onSubmit={handleSubmit}>
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
          <Image h="36px" w="36px" src="/assets/tokens/vot3-token.webp" alt="vot3-token" />
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
          {Number(vot3Balance?.original) !== Number(amount) && (
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
        {t("You can claim your tokens back when the proposal voting round starts.")}
      </Text>
      <Button isDisabled={!Number(amount)} w="full" variant="primaryAction" type="submit">
        {t("Deposit VOT3")}
      </Button>
    </VStack>
  )
}
