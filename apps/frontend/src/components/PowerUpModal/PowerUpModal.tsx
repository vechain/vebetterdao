"use client"

import { Button, Card, Checkbox, Field, Heading, HStack, Icon, Link, NumberInput, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { NavigatorRegistry__factory } from "@vechain/vebetterdao-contracts"
import { useUpgradeSmartAccountModal, useWallet, useThor } from "@vechain/vechain-kit"
import { Clock, NavArrowRight, WarningTriangle } from "iconoir-react"
import NextLink from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { parseEther } from "viem"

import { getB3TrTokenDetailsQueryKey } from "@/api/contracts/b3tr/hooks/useB3trTokenDetails"
import { buildB3trApprovesTx } from "@/api/contracts/b3tr/utils/buildB3trApprovesTx"
import { getVotesOnBlockPrefixQueryKey } from "@/api/contracts/governance/hooks/useVotesOnBlock"
import {
  useGetDelegatedAmount,
  getGetDelegatedAmountQueryKey,
} from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { useGetNavigator } from "@/api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { buildConvertB3trTx } from "@/api/contracts/vot3/utils/buildConvertB3trTx"
import { buildDelegateVot3Tx } from "@/api/contracts/vot3/utils/buildDelegateVot3Tx"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"
import { BaseModal } from "@/components/BaseModal"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { useBuildTransaction } from "@/hooks/useBuildTransaction"
import { useGetB3trBalance, getB3trBalanceQueryKey } from "@/hooks/useGetB3trBalance"
import { getVot3BalanceQueryKey } from "@/hooks/useGetVot3Balance"
import { getVot3UnlockedBalanceQueryKey } from "@/hooks/useGetVot3UnlockedBalance"
import { useSmartAccountUpgradeRequired } from "@/hooks/vechainKitHooks/useSmartAccountUpgradeRequired"
import { useVot3RequireSelfDelegation } from "@/hooks/vechainKitHooks/useVot3RequireSelfDelegation"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { buildClause } from "@/utils/buildClause"
import { removingExcessDecimals } from "@/utils/MathUtils/MathUtils"

import { PowerUpSummary } from "./PowerUpSummary"
import { handleAmountInput } from "./utils"

const compactFormatter = getCompactFormatter(4)
const config = getConfig()
const GAS_PADDING = 0.05
const NavigatorRegistryInterface = NavigatorRegistry__factory.createInterface()

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const PowerUpModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const thor = useThor()
  const { isTxModalOpen } = useTransactionModal()
  const [amount, setAmount] = useState("")
  const [includeDelegation, setIncludeDelegation] = useState(true)

  const { data: b3trBalance } = useGetB3trBalance(account?.address ?? undefined)
  const { data: isDelegated } = useIsDelegated(account?.address)
  const { data: navigatorAddress } = useGetNavigator(isDelegated ? account?.address : undefined)
  const { data: navigatorData } = useNavigatorByAddress(navigatorAddress ?? "")
  const { data: currentDelegation } = useGetDelegatedAmount(isDelegated ? account?.address : undefined)
  const requiresSelfDelegation = useVot3RequireSelfDelegation()
  const availableBalance = b3trBalance?.scaled ?? "0"

  const currentDelegatedNum = currentDelegation ? Number(currentDelegation.scaled) : 0
  // User's own delegation is part of totalDelegated, so add it back to get true remaining capacity
  const remainingCapacity = navigatorData
    ? Math.max(
        0,
        Number(navigatorData.stakeFormatted) * 10 - Number(navigatorData.totalDelegatedFormatted) + currentDelegatedNum,
      )
    : 0
  const freeCapacity = Math.max(0, remainingCapacity - currentDelegatedNum)
  const amountNum = Number(amount) || 0
  const exceedsCapacity = isDelegated && includeDelegation && amountNum > freeCapacity

  const isSmartAccountUpgradeRequired = useSmartAccountUpgradeRequired()
  const { open: openUpgradeModal } = useUpgradeSmartAccountModal({ accentColor: "#004CFC" })

  useEffect(() => {
    if (isOpen) {
      setAmount("")
      setIncludeDelegation(true)
    }
  }, [isOpen])

  const contractAmount = useMemo(() => removingExcessDecimals(amount), [amount])

  const clauseBuilder = useCallback(() => {
    if (!contractAmount || contractAmount === "0") throw new Error("amount is required")
    if (!account?.address) throw new Error("account address is required")

    const clauses = []

    if (requiresSelfDelegation) {
      clauses.push(buildDelegateVot3Tx(thor, account.address))
    }

    clauses.push(buildB3trApprovesTx(thor, contractAmount, config.vot3ContractAddress))
    clauses.push(buildConvertB3trTx(thor, contractAmount))

    if (isDelegated && includeDelegation) {
      const amountWei = parseEther(contractAmount)
      clauses.push(
        buildClause({
          to: config.navigatorRegistryContractAddress,
          contractInterface: NavigatorRegistryInterface,
          method: "increaseDelegation",
          args: [amountWei],
          comment: `Increase delegation by ${contractAmount} VOT3`,
        }),
      )
    }

    return clauses
  }, [contractAmount, account?.address, requiresSelfDelegation, isDelegated, includeDelegation, thor])

  const refetchQueryKeys = useMemo(
    () => [
      getB3trBalanceQueryKey(account?.address ?? undefined),
      getVot3BalanceQueryKey(account?.address ?? ""),
      getVot3UnlockedBalanceQueryKey(account?.address ?? ""),
      getB3trBalanceQueryKey(config.vot3ContractAddress),
      getB3TrTokenDetailsQueryKey(),
      getVotesOnBlockPrefixQueryKey(),
      getGetDelegatedAmountQueryKey(account?.address ?? ""),
      ["indexer", "navigators"],
      ["bestBlockCompressed"],
    ],
    [account?.address],
  )

  const handleSuccess = useCallback(() => {
    onClose()
  }, [onClose])

  const mutation = useBuildTransaction({
    clauseBuilder,
    refetchQueryKeys,
    onSuccess: handleSuccess,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Powering up...") },
      success: { title: t("Power up complete!") },
      error: { title: t("Power up failed") },
    },
    gasPadding: GAS_PADDING,
  })

  const insufficientBalance = parseEther(amount || "0") > BigInt(b3trBalance?.original ?? "0")
  const invalidAmount = !amount || amount === "." || Number(amount) === 0 || insufficientBalance || exceedsCapacity

  const handleConfirm = () => {
    if (invalidAmount) return
    if (isSmartAccountUpgradeRequired) return openUpgradeModal()
    mutation.resetStatus()
    mutation.sendTransaction()
  }

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={onClose}
      showCloseButton
      modalProps={{ closeOnInteractOutside: true }}>
      <VStack gap={5} w="full" align="stretch">
        <Heading size="xl" fontWeight="bold" data-testid={"tx-modal-title"}>
          {t("Increase your Voting Power")}
        </Heading>

        <Text mt={2} textStyle="xs" color="text.subtle">
          {t("1 B3TR = 1 Voting Power. You can redeem your B3TR back at any time.")}
        </Text>

        {isDelegated && (
          <Card.Root w="full" p={3} bg="card.default" border="1px solid" borderColor="border.secondary" rounded="xl">
            <Checkbox.Root
              checked={includeDelegation}
              onCheckedChange={e => setIncludeDelegation(!!e.checked)}
              gap={3}
              alignItems="flex-start">
              <Checkbox.HiddenInput />
              <Checkbox.Control mt="0.5" />
              <Checkbox.Label>
                <Text textStyle="xs" color="text.subtle">
                  {t(
                    "Also increase my navigator delegation with the converted VOT3. This will increase your voting power.",
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
          mt={2}
          gap={2}
          align="start"
          w="full">
          <Field.Root gap={2} required invalid={!!amount && amount !== "." && (insufficientBalance || exceedsCapacity)}>
            <Field.Label w="full" alignItems="center" justifyContent="space-between">
              <Text textStyle="sm" color="text.subtle">
                {t("Use available B3TR")}
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
                <NumberInput.Root
                  textOverflow="ellipsis"
                  p="0"
                  allowOverflow={false}
                  min={0}
                  value={amount}
                  onValueChange={details => setAmount(handleAmountInput(details.value))}>
                  <NumberInput.Input
                    p="0"
                    placeholder="0"
                    onBlur={() => setAmount(prev => prev.replace(/\.$/, ""))}
                    border="none"
                    outline="none"
                    textStyle={(amount || "0").length > 15 ? "lg" : (amount || "0").length > 10 ? "xl" : "3xl"}
                    transition="font-size 0.15s ease-out"
                  />
                </NumberInput.Root>
                <Field.ErrorText>
                  <Icon as={WarningTriangle} boxSize="4" />
                  {exceedsCapacity
                    ? t("Max: {{max}} VOT3", { max: compactFormatter.format(freeCapacity) })
                    : t("Not enough B3TR")}
                </Field.ErrorText>
              </VStack>

              <VStack align="end" gap={2} flexShrink={0}>
                <HStack gap={2}>
                  <B3TRIcon boxSize="24px" />
                  <Text textStyle="lg" fontWeight="semibold">
                    {"B3TR"}
                  </Text>
                </HStack>
                <Text textStyle="xs" color="text.subtle">
                  {t("Available: {{amount}}", { amount: compactFormatter.format(Number(availableBalance)) })}
                </Text>
              </VStack>
            </HStack>
          </Field.Root>
        </VStack>

        {exceedsCapacity && navigatorAddress && (
          <Card.Root
            w="full"
            p={3}
            bg="status.negative.subtle"
            border="1px solid"
            borderColor="status.negative.strong"
            rounded="xl">
            <HStack gap={3} align="flex-start">
              <Icon as={WarningTriangle} boxSize="5" color="status.negative.strong" mt="0.5" flexShrink={0} />
              <VStack align="start" gap={1}>
                <Text textStyle="xs" color="status.negative.strong" fontWeight="semibold">
                  {t(
                    "Your navigator has reached its delegation capacity and cannot receive this amount. You can uncheck the delegation option or reduce the amount.",
                  )}
                </Text>
                <Link asChild variant="underline" textStyle="xs" color="status.negative.strong">
                  <NextLink href={`/navigators/${navigatorAddress}`} onClick={onClose}>
                    {t("View navigator")}
                    <Icon as={NavArrowRight} boxSize="3" />
                  </NextLink>
                </Link>
              </VStack>
            </HStack>
          </Card.Root>
        )}

        <PowerUpSummary
          mode="power-up"
          amount={amount}
          includeDelegation={isDelegated && includeDelegation}
          isHighlighted
        />

        {Number(availableBalance) < 2 && (
          <Card.Root
            w="full"
            mt={2}
            p={3}
            bg="card.default"
            border="1px solid"
            borderColor="border.secondary"
            rounded="xl">
            <HStack gap={3}>
              <Icon as={Clock} boxSize="5" color="text.subtle" flexShrink={0} />
              <VStack align="start" gap={0.5} flex={1}>
                <HStack gap={1}>
                  <Text textStyle="sm">
                    {t("To increase it you need")}{" "}
                    <Text as="span" fontWeight="semibold">
                      {"B3TR"}
                    </Text>
                  </Text>
                  <Icon as={NavArrowRight} boxSize="4" />
                </HStack>
                <Link asChild variant="underline" textStyle="sm" color="actions.primary.default">
                  <NextLink href="/apps">{t("Use the apps to earn B3TR tokens")}</NextLink>
                </Link>
              </VStack>
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
