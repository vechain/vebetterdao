"use client"

import { Button, Card, Field, Heading, HStack, Icon, NumberInput, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { BigNumber } from "bignumber.js"
import { ethers } from "ethers"
import { InfoCircle, WarningTriangle } from "iconoir-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { parseEther } from "viem"

import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { BaseModal } from "@/components/BaseModal"
import HeartIcon from "@/components/Icons/svg/heart.svg"
import { VOT3Icon } from "@/components/Icons/VOT3Icon"
import { MulticolorBar } from "@/components/MulticolorBar/MulticolorBar"
import { ResultsDisplay } from "@/components/Proposal/ResultsDisplay"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"
import { useProposalVot3Deposit } from "@/hooks/useProposalVot3Deposit"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { handleAmountInput } from "../../../../../components/PowerUpModal/utils"

const compactFormatter = getCompactFormatter(4)
const PERCENTAGE_SHORTCUTS = [25, 50, 75, 100] as const

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

  const { data: vot3Balance } = useGetVot3Balance(account?.address)
  const { data: isDelegated } = useIsDelegated(account?.address)
  const { data: delegatedAmount } = useGetDelegatedAmount(isDelegated ? account?.address : undefined)
  const { data: currentRoundId } = useCurrentAllocationsRoundId()

  // Delegated VOT3 is locked and can't be used to support proposals
  const effectiveBalanceScaled = useMemo(() => {
    const wallet = new BigNumber(vot3Balance?.scaled ?? "0")
    if (!isDelegated || !delegatedAmount?.scaled) return wallet
    return BigNumber.max(wallet.minus(delegatedAmount.scaled), 0)
  }, [vot3Balance?.scaled, isDelegated, delegatedAmount?.scaled])

  const effectiveBalanceWei = useMemo(() => {
    if (!isDelegated || !delegatedAmount?.raw) return BigInt(vot3Balance?.original ?? "0")
    const wallet = BigInt(vot3Balance?.original ?? "0")
    const delegated = delegatedAmount.raw
    return wallet > delegated ? wallet - delegated : 0n
  }, [vot3Balance?.original, isDelegated, delegatedAmount?.raw])

  useEffect(() => {
    if (isSupportModalOpen) setAmount("")
  }, [isSupportModalOpen])

  const canClaimNextRound = votingRoundId === Number(currentRoundId ?? 0) + 1

  const missingSupport = useMemo(() => {
    const thresholdBN = new BigNumber(ethers.formatEther(proposalThreshold))
    const currentBN = new BigNumber(ethers.formatEther(proposalDeposits))
    const missing = thresholdBN.minus(currentBN)
    return missing.isGreaterThan(0) ? missing : new BigNumber(0)
  }, [proposalThreshold, proposalDeposits])

  const availableBalance = useMemo(() => {
    return BigNumber.min(effectiveBalanceScaled, missingSupport).isGreaterThan(0)
      ? BigNumber.min(effectiveBalanceScaled, missingSupport)
      : new BigNumber(0)
  }, [effectiveBalanceScaled, missingSupport])

  const handlePercentage = useCallback(
    (pct: number) => {
      const result = availableBalance.times(pct).div(100)
      setAmount(handleAmountInput(result.toFixed(18)))
    },
    [availableBalance],
  )

  const inputAmount = useMemo(() => {
    try {
      return amount ? ethers.parseEther(amount) : 0n
    } catch {
      return 0n
    }
  }, [amount])

  const parsedAmount = useMemo(() => {
    try {
      return amount ? `${ethers.parseEther(amount)}` : "0"
    } catch {
      return "0"
    }
  }, [amount])

  const invalidAmount = useMemo(() => {
    if (!amount || amount === "." || Number(amount) === 0) return true
    try {
      return parseEther(amount || "0") > effectiveBalanceWei
    } catch {
      return true
    }
  }, [amount, effectiveBalanceWei])

  const exceedsMissing = useMemo(() => {
    try {
      return amount ? new BigNumber(amount).isGreaterThan(missingSupport) : false
    } catch {
      return false
    }
  }, [amount, missingSupport])

  const getPercentage = useCallback((deposits: bigint, threshold: bigint) => {
    if (threshold === 0n) return 0
    if (deposits >= threshold) return 100
    const basisPoints = (deposits * 10000n) / threshold
    return Number(basisPoints) / 100
  }, [])

  const currentPercent = useMemo(
    () => getPercentage(proposalDeposits, proposalThreshold),
    [proposalDeposits, proposalThreshold, getPercentage],
  )

  const predictedPercent = useMemo(() => {
    const forecastedTotal = proposalDeposits + inputAmount
    if (forecastedTotal >= proposalThreshold) return 100
    const pct = new BigNumber(forecastedTotal.toString()).div(proposalThreshold.toString())
    return pct.times(100).toNumber()
  }, [proposalDeposits, proposalThreshold, inputAmount])

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
      depositMutation.resetStatus()
    },
  })

  const handleSupport = useCallback(() => {
    if (!Number(amount)) return
    depositMutation.sendTransaction({ proposalId, amount: parsedAmount })
  }, [depositMutation, amount, proposalId, parsedAmount])

  return (
    <BaseModal
      showCloseButton
      isCloseable
      ariaTitle="Support this proposal"
      modalProps={{ size: "md", closeOnInteractOutside: true }}
      modalContentProps={{ maxW: "500px" }}
      isOpen={isSupportModalOpen && !isTxModalOpen}
      onClose={onClose}>
      <VStack w="full" align="stretch" gap={5}>
        <Heading size="xl" textAlign="center" fontWeight="bold">
          {t("Support this proposal")}
        </Heading>

        <VStack
          bg="card.default"
          border="1px solid"
          borderColor="border.secondary"
          borderRadius="2xl"
          p={4}
          gap={2}
          align="start"
          w="full">
          <Field.Root gap={2} required invalid={!!amount && amount !== "." && (invalidAmount || exceedsMissing)}>
            <Field.Label w="full" alignItems="center" justifyContent="space-between">
              <Text textStyle="sm" color="text.subtle">
                {t("Amount to support")}
              </Text>
              <Button variant="link" height="5" size="sm" p="0" onClick={() => handlePercentage(100)}>
                {t("Use max")}
              </Button>
            </Field.Label>

            <HStack w="full" justifyContent="space-between">
              <VStack align="start" gap="2" w="full">
                <NumberInput.Root asChild textOverflow="ellipsis" p="0" allowOverflow={false} min={0}>
                  <NumberInput.Input
                    min={0}
                    p="0"
                    value={amount}
                    placeholder="0"
                    onChange={e => setAmount(handleAmountInput(e.target.value))}
                    onBlur={() => setAmount(prev => prev.replace(/\.$/, ""))}
                    border="none"
                    outline="none"
                    textStyle={(amount || "0").length > 15 ? "lg" : (amount || "0").length > 10 ? "xl" : "3xl"}
                    transition="font-size 0.15s ease-out"
                  />
                </NumberInput.Root>
                <Field.ErrorText>
                  <Icon as={WarningTriangle} boxSize="4" />
                  {exceedsMissing ? t("Exceeds remaining support needed") : t("Not enough VOT3")}
                </Field.ErrorText>
              </VStack>

              <VStack align="end" gap={2} flexShrink={0}>
                <HStack gap={2}>
                  <VOT3Icon boxSize="24px" />
                  <Text textStyle="lg" fontWeight="semibold">
                    {"VOT3"}
                  </Text>
                </HStack>
                <Text textStyle="xs" color="text.subtle">
                  {t("Available")}
                  {":"} {compactFormatter.format(effectiveBalanceScaled.toNumber())}
                </Text>
              </VStack>
            </HStack>
          </Field.Root>

          <HStack gap={2} w="full" justifyContent="center" pt={1}>
            {PERCENTAGE_SHORTCUTS.map(pct => (
              <Button key={pct} variant="outline" size="xs" flex={1} onClick={() => handlePercentage(pct)}>
                {pct === 100 ? t("Max") : `${pct}%`}
              </Button>
            ))}
          </HStack>
        </VStack>

        <MulticolorBar segments={[progressData]} />
        <ResultsDisplay proposalId={proposalId} segments={[{ ...progressData, icon: HeartIcon }]} />

        <Card.Root w="full" p={3} bg="card.default" border="1px solid" borderColor="border.secondary" rounded="xl">
          <VStack gap={2} align="start">
            <HStack gap={2} align="flex-start">
              <Icon as={InfoCircle} boxSize="4" color="text.subtle" mt="0.5" flexShrink={0} />
              <Text textStyle="xs" color="text.subtle">
                {t(
                  "Your VOT3 is not spent. It stays locked until voting starts and still counts as voting power for allocation rounds.",
                )}
              </Text>
            </HStack>
            <HStack gap={2} align="flex-start">
              <Icon as={InfoCircle} boxSize="4" color="text.subtle" mt="0.5" flexShrink={0} />
              <Text textStyle="xs" color="text.subtle">
                {t("Claim your VOT3 tokens back {{round}} when voting starts.", {
                  round: canClaimNextRound ? t("next round") : `${t("in round")} ${votingRoundId}`,
                })}
              </Text>
            </HStack>
            {isDelegated && (
              <HStack gap={2} align="flex-start">
                <Icon as={InfoCircle} boxSize="4" color="text.subtle" mt="0.5" flexShrink={0} />
                <Text textStyle="xs" color="text.subtle">
                  {t("Delegated VOT3 is locked and cannot be used to support proposals.")}
                </Text>
              </HStack>
            )}
          </VStack>
        </Card.Root>

        <VStack gap={2} w="full">
          <Button
            variant="primary"
            w="full"
            rounded="full"
            size="lg"
            disabled={!Number(amount) || invalidAmount || exceedsMissing || depositMutation.isTransactionPending}
            onClick={handleSupport}>
            {t("Support")}
          </Button>
          <Button variant="ghost" w="full" rounded="full" size="lg" onClick={onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
