import { filterAmountInput } from "@/utils"
import { Box, Button, Separator, HStack, Image, Input, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { ethers } from "ethers"
import { BigNumber } from "bignumber.js"
import { ProposalSupportProgressChart } from "@/components/ProposalSupportProgressChart/ProposalSupportProgressChart"
import { useGetVot3Balance } from "@/hooks"

export const SupportDeposit = ({ onSubmit }: { onSubmit: (amount: string) => void }) => {
  const { t } = useTranslation()
  const { proposal } = useProposalDetail()
  const [amount, setAmount] = useState("")
  const { account } = useWallet()
  const { data: vot3Balance } = useGetVot3Balance(account?.address ?? undefined)

  const parsedAmount = useMemo(() => {
    if (!amount || !ethers) return "0"

    try {
      return `${ethers.parseEther(amount)}`
    } catch {
      return "0"
    }
  }, [amount])

  const depositMax = useCallback(() => {
    if (!vot3Balance) return

    const scaledBalanceBN = BigNumber(vot3Balance.scaled)
    const missingSupportBN = BigNumber(proposal.missingSupport)

    if (scaledBalanceBN.gt(missingSupportBN)) {
      setAmount(missingSupportBN.toString())
      return
    }
    setAmount(scaledBalanceBN.toString())
  }, [vot3Balance, proposal.missingSupport])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.value) return setAmount("0")
      const input = filterAmountInput(e.target.value, { maxBalance: vot3Balance?.scaled })
      const scaledBalanceBN = BigNumber(vot3Balance?.scaled ?? 0)
      const missingSupportBN = BigNumber(proposal.missingSupport ?? 0)

      // Get the minimum value, between the input, the scaled balance and the missing support
      const cappedAmountBN = BigNumber.min(BigNumber(input), scaledBalanceBN, missingSupportBN)

      setAmount(cappedAmountBN.toString())
    },
    [vot3Balance?.scaled, proposal.missingSupport],
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
        <Text textStyle={"sm"} color="text.subtle">
          {t("Your contribution")}
        </Text>
        <HStack>
          <Image h="36px" w="36px" src="/assets/tokens/vot3-token.webp" alt="vot3-token" />
          <Input
            placeholder="0"
            type="text"
            value={amount}
            onChange={handleChange}
            variant="amountInput"
            data-testid={"amount-input"}
          />
          {Number(vot3Balance?.original) !== Number(amount) && (
            <Box>
              <Button
                disabled={!vot3Balance?.scaled}
                onClick={depositMax}
                color="#004CFC"
                fontSize="14px"
                fontWeight="semibold"
                bg={"#E0E9FE"}
                h="30px"
                px="16px"
                rounded={"full"}>
                {t("Deposit max")}
              </Button>
            </Box>
          )}
        </HStack>
        <Separator />
      </VStack>
      <VStack alignItems={"stretch"}>
        <Text textStyle={"sm"} color="text.subtle">
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
      <Text fontWeight="semibold" textStyle="sm">
        {t("You can claim your tokens back when the proposal voting round starts.")}
      </Text>
      <Button disabled={!Number(amount)} w="full" variant="primary" type="submit">
        {t("Deposit VOT3")}
      </Button>
    </VStack>
  )
}
