import { useCurrentAllocationsRoundId } from "@/api"
import { GenericAlert } from "@/app/components/Alert"
import { MulticolorBar, RegularModal, ResultsDisplay } from "@/components"
import HeartIcon from "@/components/Icons/svg/heart.svg"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"
import { useProposalVot3Deposit } from "@/hooks/useProposalVot3Deposit"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { filterAmountInput } from "@/utils/filterAmountInput"
import { Button, Heading, HStack, Icon, Image, Input, InputGroup, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import { BigNumber } from "bignumber.js"
import { ethers } from "ethers"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FiBarChart2 } from "react-icons/fi"

type Props = {
  isSupportModalOpen: boolean
  onClose: () => void
  proposalId: string
  votingRoundId: number
  proposalThreshold: bigint
  proposalDeposits: bigint
}
export const ProposalSupportModal = ({
  isSupportModalOpen,
  onClose,
  proposalId,
  votingRoundId,
  proposalThreshold,
  proposalDeposits,
}: Props) => {
  const { account } = useWallet()
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()
  const [amount, setAmount] = useState("")
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  // Get user's VOT3 balance and current deposits using hooks
  const { data: vot3Balance } = useGetVot3Balance(account?.address)

  const canClaimNextRound = useMemo(() => {
    return votingRoundId === Number(currentRoundId ?? 0) + 1
  }, [votingRoundId, currentRoundId])

  // Helper function to calculate accurate percentage using wei precision
  const getPercentage = useCallback((deposits: bigint, threshold: bigint) => {
    if (threshold === 0n) return 0

    // Use bigint arithmetic for exact comparison - only show 100% when truly equal or greater
    if (deposits >= threshold) return 100

    // For percentages less than 100%, use bigint math to maintain precision
    // Calculate (deposits * 10000) / threshold for 2 decimal precision, then divide by 100
    const basisPoints = deposits / threshold
    return Number(basisPoints) / 100
  }, [])

  // Convert amount input to bigint
  const inputAmount = useMemo(() => {
    try {
      return amount ? ethers.parseEther(amount) : 0n
    } catch {
      return 0n
    }
  }, [amount])

  // Calculate missing support
  const missingSupport = useMemo(() => {
    const thresholdBN = BigNumber(ethers.formatEther(proposalThreshold))
    const currentBN = BigNumber(ethers.formatEther(proposalDeposits))
    const missing = thresholdBN.minus(currentBN)
    return missing.isGreaterThan(0) ? missing.toString() : "0"
  }, [proposalThreshold, proposalDeposits])

  // Parsed amount in wei
  const parsedAmount = useMemo(() => {
    if (!amount || !ethers) return "0"

    try {
      return `${ethers.parseEther(amount)}`
    } catch {
      return "0"
    }
  }, [amount])

  // Input handling (exactly like old interface)
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
    [vot3Balance?.scaled, missingSupport],
  )

  // Deposit max logic
  const handleDepositMax = useCallback(() => {
    if (!vot3Balance) return

    const scaledBalanceBN = BigNumber(vot3Balance.scaled)
    const missingSupportBN = BigNumber(missingSupport)

    if (scaledBalanceBN.gt(missingSupportBN)) {
      setAmount(missingSupportBN.toString())
      return
    }
    setAmount(scaledBalanceBN.toString())
  }, [vot3Balance, missingSupport])

  // Current and predicted percentages
  const currentPercent = useMemo(
    () => getPercentage(proposalDeposits, proposalThreshold),
    [proposalDeposits, proposalThreshold, getPercentage],
  )

  const predictedPercent = useMemo(() => {
    // Calculate forecasted total deposits including user's contribution
    const currentTotal = proposalDeposits
    const forecastedTotal = currentTotal + inputAmount
    const thresholdNumber = proposalThreshold

    if (forecastedTotal >= thresholdNumber) return 100

    const expectedPercentage = BigNumber(forecastedTotal).div(thresholdNumber)
    return expectedPercentage.times(100).toNumber()
  }, [proposalDeposits, proposalThreshold, inputAmount])

  // Display data for progress and results
  const displayPercent = Number(amount || "0") > 0 ? predictedPercent : currentPercent
  const progressData = useMemo(
    () => ({
      percentage: displayPercent,
      color: displayPercent === 100 ? "green.500" : "blue.500",
      label: "Support Progress",
    }),
    [displayPercent],
  )

  const onSupportSuccess = useCallback(() => {
    onClose()
    setAmount("")
  }, [onClose])

  const depositMutation = useProposalVot3Deposit({
    proposalId,
    onSuccess: () => {
      onSupportSuccess()
      //Reset transaction to prevent infinite loop
      depositMutation.resetStatus()
    },
  })

  const handleSupport = useCallback(() => {
    if (!Number(amount)) return
    depositMutation.sendTransaction({ proposalId, amount: parsedAmount })
  }, [depositMutation, amount, proposalId, parsedAmount])
  return (
    <RegularModal
      size="md"
      showCloseButton
      isCloseable
      ariaTitle="Support this grant"
      isOpen={isSupportModalOpen && !isTxModalOpen}
      onClose={onClose}>
      <VStack w="full" align="stretch" gap={6}>
        {/* Amount Input Section */}
        <VStack align="stretch" gap={2}>
          <Text fontWeight="medium">{"Amount"}</Text>
          <InputGroup
            endElement={
              <HStack>
                <Text>{"VOT3"}</Text>
                <Image src={"/assets/logos/vot3_logo_dark.svg"} boxSize={"20px"} alt="VOT3 Icon" />
              </HStack>
            }>
            <Input placeholder="0" size={"lg"} value={amount} onChange={handleChange} />
          </InputGroup>
          {/* Deposit Max Button */}
          <Button
            variant="plain"
            color="blue.500"
            fontSize="sm"
            fontWeight="medium"
            onClick={handleDepositMax}
            alignSelf="flex-end">
            {"Deposit max"}
          </Button>
        </VStack>
        {/* Results Header */}
        <HStack>
          <Icon as={FiBarChart2} boxSize={5} />
          <Heading size="md">{t("Results")}</Heading>
        </HStack>

        {/* Progress Bar */}
        <MulticolorBar segments={[progressData]} />
        {/* Results Section */}
        <ResultsDisplay
          proposalId={proposalId}
          segments={[{ ...progressData, icon: HeartIcon }]}
          tokenAmount={proposalDeposits + inputAmount}
          showTokenAmount={true}
        />

        {/* Info Message */}
        <GenericAlert
          type="info"
          isLoading={false}
          message={t("Claim your VOT3 tokens back {{round}} when voting starts.", {
            round: canClaimNextRound ? "next week (round)" : `in round ${votingRoundId}`,
          })}
        />

        {/* Support Button */}
        <Button
          variant="primaryAction"
          w="full"
          disabled={!Number(amount) || depositMutation.isTransactionPending}
          onClick={handleSupport}>
          {"Support"}
        </Button>
      </VStack>
    </RegularModal>
  )
}
