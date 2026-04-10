"use client"

import { Button, Card, Field, Heading, HStack, Icon, Link, NumberInput, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useUpgradeSmartAccountModal, useWallet } from "@vechain/vechain-kit"
import { Clock, NavArrowRight, WarningTriangle } from "iconoir-react"
import NextLink from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { parseEther } from "viem"

import { BaseModal } from "@/components/BaseModal"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { useConvertB3tr } from "@/hooks/useConvertB3tr"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"
import { useSmartAccountUpgradeRequired } from "@/hooks/vechainKitHooks/useSmartAccountUpgradeRequired"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { PowerUpSummary } from "./PowerUpSummary"
import { handleAmountInput } from "./utils"

const compactFormatter = getCompactFormatter(4)

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const PowerUpModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const [amount, setAmount] = useState("")

  useEffect(() => {
    if (isOpen) setAmount("")
  }, [isOpen])

  const { data: b3trBalance } = useGetB3trBalance(account?.address ?? undefined)
  const availableBalance = b3trBalance?.scaled ?? "0"

  const isSmartAccountUpgradeRequired = useSmartAccountUpgradeRequired()
  const { open: openUpgradeModal } = useUpgradeSmartAccountModal({ accentColor: "#004CFC" })

  const handleSuccess = useCallback(() => {
    onClose()
  }, [onClose])

  const convertB3trMutation = useConvertB3tr({
    amount,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Powering up...") },
      success: { title: t("Power up complete!") },
      error: { title: t("Power up failed") },
    },
    onSuccess: handleSuccess,
  })

  const invalidAmount =
    !amount || amount === "." || Number(amount) === 0 || parseEther(amount) > BigInt(b3trBalance?.original ?? "0")

  const handleConfirm = () => {
    if (invalidAmount) return
    if (isSmartAccountUpgradeRequired) return openUpgradeModal()
    convertB3trMutation.resetStatus()
    convertB3trMutation.sendTransaction()
  }

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={onClose}
      modalProps={{ closeOnInteractOutside: true }}
      modalContentProps={{ maxW: "500px" }}>
      <VStack gap={5} w="full">
        <Heading size="xl" textAlign="center" fontWeight="bold" data-testid={"tx-modal-title"}>
          {t("Increase your Voting Power")}
        </Heading>

        <Text mt={2} textStyle="xs" color="text.subtle" textAlign="center">
          {t("1 B3TR = 1 Voting Power. You can redeem your B3TR back at any time.")}
        </Text>

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
          <Field.Root
            gap={2}
            required
            invalid={!!amount && amount !== "." && parseEther(amount) > BigInt(b3trBalance?.original ?? "0")}>
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
                  {t("Not enough B3TR")}
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

        <PowerUpSummary mode="power-up" amount={amount} isHighlighted />

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
