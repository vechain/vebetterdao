"use client"

import { Button, Field, HStack, Icon, NumberInput, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { WarningTriangle } from "iconoir-react"
import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"

import { useB3trConverted } from "@/api/contracts/b3tr/hooks/useB3trConverted"
import { VOT3Icon } from "@/components/Icons/VOT3Icon"
import { useConvertVot3 } from "@/hooks/useConvertVot3"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"

import { PowerDownB3trSummary } from "./PowerDownB3trSummary"
import { PowerUpSummary } from "./PowerUpSummary"
import { handleAmountInput } from "./utils"

const compactFormatter = getCompactFormatter(4)

type Props = {
  onClose: () => void
}

export const PowerDownContent = ({ onClose }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const [amount, setAmount] = useState("")

  const { data: vot3Balance } = useGetVot3Balance(account?.address ?? undefined)
  const { data: swappableVot3Balance } = useB3trConverted(account?.address ?? undefined)
  const availableBalance = swappableVot3Balance?.scaled ?? "0"

  const showTransferredVOT3Warning =
    BigInt(vot3Balance?.original || "0") > BigInt(swappableVot3Balance?.original || "0")

  const handleClose = useCallback(() => {
    onClose()
    setAmount("")
  }, [onClose])

  const convertVot3Mutation = useConvertVot3({
    amount,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Powering down...") },
      success: { title: t("Power down complete!") },
      error: { title: t("Power down failed") },
    },
    onSuccess: handleClose,
  })

  const invalidAmount = !amount || amount === "." || Number(amount) === 0 || Number(amount) > Number(availableBalance)

  const handleConfirm = () => {
    if (invalidAmount) return
    convertVot3Mutation.resetStatus()
    convertVot3Mutation.sendTransaction()
  }

  return (
    <VStack gap={5} w="full">
      <VStack gap={2} justify={"center"} w="full">
        <Text textStyle="lg" fontWeight="semibold" textAlign="center">
          {t("Reduce your Voting Power")}
        </Text>
        <Text textStyle="md" color="text.subtle" textAlign="center">
          {t("Redeem your B3TR tokens anytime.")}
        </Text>
      </VStack>

      <VStack
        bg="card.default"
        border="1px solid"
        borderColor="border.secondary"
        borderRadius="2xl"
        p={4}
        gap={2}
        align="start"
        w="full">
        <Field.Root gap={2} required invalid={!!amount && Number(amount) > Number(availableBalance)}>
          <Field.Label w="full" alignItems="center" justifyContent="space-between">
            <Text textStyle="sm" color="text.subtle">
              {t("Use available Voting Power")}
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
              <NumberInput.Root asChild autoFocus textOverflow="ellipsis" p="0" allowOverflow={false} min={0}>
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
                {t("Not enough Voting Power")}
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

      {/* <PowerUpSummary mode="power-down" amount={amount} /> */}

      {showTransferredVOT3Warning && (
        <Text textStyle="xs" color="text.subtle">
          {t("You can only convert Voting Power that you powered up yourself.")}
        </Text>
      )}

      <VStack gap={2} mt={2} w="full">
        <Button variant="primary" w="full" rounded="full" size="lg" disabled={invalidAmount} onClick={handleConfirm}>
          {t("Confirm")}
        </Button>
        <Button variant="ghost" w="full" rounded="full" size="lg" onClick={handleClose}>
          {t("Cancel")}
        </Button>
      </VStack>
    </VStack>
  )
}
