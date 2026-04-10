"use client"

import { Button, Card, Checkbox, Field, Heading, HStack, Icon, NumberInput, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useWallet, useThor } from "@vechain/vechain-kit"
import { InfoCircle, WarningTriangle } from "iconoir-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { parseEther } from "viem"

import { useB3trConverted } from "@/api/contracts/b3tr/hooks/useB3trConverted"
import { useTotalVotesOnBlock } from "@/api/contracts/governance/hooks/useTotalVotesOnBlock"
import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { buildConvertVot3Tx } from "@/api/contracts/vot3/utils/buildConvertVot3Tx"
import { BaseModal } from "@/components/BaseModal"
import { VOT3Icon } from "@/components/Icons/VOT3Icon"
import { useBuildTransaction } from "@/hooks/useBuildTransaction"
import { useBestBlockCompressed } from "@/hooks/useGetBestBlockCompressed"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"
import { useGetVot3UnlockedBalance } from "@/hooks/useGetVot3UnlockedBalance"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { buildClause } from "@/utils/buildClause"
import { removingExcessDecimals } from "@/utils/MathUtils/MathUtils"

import { PowerDownB3trSummary } from "./PowerDownB3trSummary"
import { handleAmountInput } from "./utils"

const compactFormatter = getCompactFormatter(4)
const GAS_PADDING = 0.05
const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const PowerDownModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const thor = useThor()
  const { isTxModalOpen } = useTransactionModal()
  const [amount, setAmount] = useState("")
  const [includeDelegated, setIncludeDelegated] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setAmount("")
      setIncludeDelegated(false)
    }
  }, [isOpen])

  const { data: vot3Balance } = useGetVot3Balance(account?.address ?? undefined)
  const { data: unlockedVot3Balance } = useGetVot3UnlockedBalance(account?.address ?? undefined)
  const { data: swappableVot3Balance } = useB3trConverted(account?.address ?? undefined)
  const { data: delegatedAmount } = useGetDelegatedAmount(account?.address ?? undefined)
  const { data: bestBlock } = useBestBlockCompressed()
  const { data: currentVotingPower } = useTotalVotesOnBlock(
    bestBlock?.number ? Number(bestBlock.number) - 1 : undefined,
    account?.address,
  )

  const delegatedLocked = delegatedAmount?.raw ?? 0n
  const unlockedOriginal = BigInt(unlockedVot3Balance?.original || "0")
  const swappableOriginal = BigInt(swappableVot3Balance?.original || "0")

  // When includeDelegated is checked, use full balance (unlocked + delegated); otherwise only unlocked.
  // Always cap by swappable (convertedB3trOf) to avoid revert on convertToB3TR.
  const walletOriginal = includeDelegated ? BigInt(vot3Balance?.original || "0") : unlockedOriginal
  const availableBalanceOriginal = walletOriginal > swappableOriginal ? swappableOriginal : walletOriginal

  const availableBalance = useMemo(() => {
    if (availableBalanceOriginal === swappableOriginal) return swappableVot3Balance?.scaled ?? "0"
    if (includeDelegated) return vot3Balance?.scaled ?? "0"
    return unlockedVot3Balance?.scaled ?? "0"
  }, [
    availableBalanceOriginal,
    swappableOriginal,
    swappableVot3Balance,
    vot3Balance,
    unlockedVot3Balance,
    includeDelegated,
  ])

  const showTransferredVOT3Warning = walletOriginal > swappableOriginal
  const lockedForSupport = Number(currentVotingPower?.depositsVotes ?? "0")

  const navigatorRegistryAddress = getConfig().navigatorRegistryContractAddress

  const clauseBuilder = useCallback(() => {
    const contractAmount = removingExcessDecimals(amount)
    if (!contractAmount || contractAmount === "0") throw new Error("amount is required")

    const amountWei = parseEther(contractAmount)
    const clauses = []

    // If the convert amount exceeds unlocked balance, free delegation first
    if (includeDelegated && delegatedLocked > 0n && amountWei > unlockedOriginal) {
      const amountToFree = amountWei - unlockedOriginal
      if (amountToFree >= delegatedLocked) {
        clauses.push(
          buildClause({
            to: navigatorRegistryAddress,
            contractInterface: NavigatorRegistryInterface,
            method: "undelegate",
            args: [],
            comment: "Fully undelegate from navigator",
          }),
        )
      } else {
        clauses.push(
          buildClause({
            to: navigatorRegistryAddress,
            contractInterface: NavigatorRegistryInterface,
            method: "reduceDelegation",
            args: [amountToFree],
            comment: `Reduce delegation by ${amountToFree} VOT3`,
          }),
        )
      }
    }

    clauses.push(buildConvertVot3Tx(thor, contractAmount))
    return clauses
  }, [amount, includeDelegated, delegatedLocked, unlockedOriginal, navigatorRegistryAddress, thor])

  const handleSuccess = useCallback(() => {
    onClose()
  }, [onClose])

  const convertMutation = useBuildTransaction({
    clauseBuilder,
    onSuccess: handleSuccess,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Powering down...") },
      success: { title: t("Power down complete!") },
      error: { title: t("Power down failed") },
    },
    gasPadding: GAS_PADDING,
  })

  const invalidAmount =
    !amount || amount === "." || Number(amount) === 0 || parseEther(amount) > availableBalanceOriginal

  const handleConfirm = () => {
    if (invalidAmount) return
    convertMutation.resetStatus()
    convertMutation.sendTransaction()
  }

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={onClose}
      modalProps={{ closeOnInteractOutside: true }}
      modalContentProps={{ maxW: "500px" }}>
      <VStack gap={5} w="full">
        <Heading pb={2} size="xl" textAlign="center" fontWeight="bold" data-testid={"tx-modal-title"}>
          {t("Reduce your Voting Power")}
        </Heading>

        {delegatedLocked > 0n && (
          <Card.Root w="full" p={3} bg="card.default" border="1px solid" borderColor="border.secondary" rounded="xl">
            <Checkbox.Root
              checked={includeDelegated}
              onCheckedChange={e => setIncludeDelegated(!!e.checked)}
              gap={3}
              alignItems="flex-start">
              <Checkbox.HiddenInput />
              <Checkbox.Control mt="0.5" />
              <Checkbox.Label>
                <Text textStyle="xs" color="text.subtle">
                  {t(
                    "Include {{amount}} VOT3 locked in navigator delegation. This will automatically reduce or exit your delegation.",
                    { amount: compactFormatter.format(Number(delegatedAmount?.scaled ?? "0")) },
                  )}
                </Text>
              </Checkbox.Label>
            </Checkbox.Root>
          </Card.Root>
        )}

        <VStack
          bg="card.default"
          border="1px solid"
          borderColor="border.secondary"
          borderRadius="2xl"
          p={4}
          gap={2}
          align="start"
          w="full">
          <Field.Root
            gap={2}
            required
            invalid={!!amount && amount !== "." && parseEther(amount) > availableBalanceOriginal}>
            <Field.Label w="full" alignItems="center" justifyContent="space-between">
              <Text textStyle="sm" color="text.subtle">
                {t("VOT3 to convert")}
              </Text>
              <Button
                variant="link"
                height="5"
                size="sm"
                p="0"
                onClick={() => setAmount(handleAmountInput(availableBalance))}>
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
                  {t("Insufficient VOT3 balance")}
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
                  {t("Available:")} {compactFormatter.format(Number(availableBalance))}
                </Text>
              </VStack>
            </HStack>
          </Field.Root>
        </VStack>

        <PowerDownB3trSummary amount={amount} isHighlighted />

        {showTransferredVOT3Warning && (
          <Text textStyle="xs" color="text.subtle">
            {t("You can only convert Voting Power that you powered up yourself.")}
          </Text>
        )}
        {lockedForSupport > 0 && (
          <Card.Root w="full" p={3} bg="card.default" border="1px solid" borderColor="border.secondary" rounded="xl">
            <HStack gap={3} align="flex-start">
              <Icon as={InfoCircle} boxSize="5" color="text.subtle" mt="0.5" flexShrink={0} />
              <Text textStyle="xs" color="text.subtle">
                {t("You have {{amount}} VOT3 locked for supporting proposals. Withdraw support to convert them.", {
                  amount: compactFormatter.format(lockedForSupport),
                })}
              </Text>
            </HStack>
          </Card.Root>
        )}

        <VStack gap={2} mt={2} w="full">
          <Button variant="primary" w="full" rounded="full" size="lg" disabled={invalidAmount} onClick={handleConfirm}>
            {t("Confirm")}
          </Button>
          <Button variant="ghost" w="full" rounded="full" size="lg" onClick={onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
