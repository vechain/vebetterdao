"use client"

import { Box, Button, Circle, Flex, HStack, Icon, Image, NumberInput, Text, VStack, Field } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useUpgradeSmartAccountModal, useWallet } from "@vechain/vechain-kit"
import BigNumber from "bignumber.js"
import { InfoCircle } from "iconoir-react"
import { useCallback, useMemo, useState, useRef } from "react"
import { Controller, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import SwapIcon from "@/components/Icons/svg/swap.svg"
import { Modal } from "@/components/Modal"
import { Tooltip } from "@/components/ui/tooltip"
import { useConvertB3tr } from "@/hooks/useConvertB3tr"
import { useConvertVot3 } from "@/hooks/useConvertVot3"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"
import { useSmartAccountUpgradeRequired } from "@/hooks/vechainKitHooks/useSmartAccountUpgradeRequired"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

type Props = {
  isOpen: boolean
  onClose: () => void
}

enum PowerUpStep {
  SWAP = "SWAP",
  REVIEW = "REVIEW",
}

const compactFormatter = getCompactFormatter(4)

export const PowerUpModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: b3trBalance } = useGetB3trBalance(account?.address ?? undefined)
  const { data: vot3Balance } = useGetVot3Balance(account?.address ?? undefined)
  const { isTxModalOpen } = useTransactionModal()
  const [step, setStep] = useState<PowerUpStep>(PowerUpStep.SWAP)
  const inputRef = useRef<HTMLInputElement>(null)
  const [convertTo, setConvertTo] = useState<"vot3" | "b3tr">("vot3")

  const maxBalance = convertTo === "vot3" ? b3trBalance?.scaled : vot3Balance?.scaled

  const isSmartAccountUpgradeRequired = useSmartAccountUpgradeRequired()
  const { open: openUpgradeModal } = useUpgradeSmartAccountModal({ accentColor: "#004CFC" })

  const b3trBalanceScaled = useMemo(() => b3trBalance?.scaled ?? "0", [b3trBalance?.scaled])
  const vot3BalanceScaled = useMemo(() => vot3Balance?.scaled ?? "0", [vot3Balance?.scaled])

  const formData = useForm<{ amount: string }>({ defaultValues: { amount: "" } })
  const { control, setValue, watch } = formData
  const amount = watch("amount")

  const invalidAmount = useMemo(() => Number(amount) === 0 || isNaN(Number(amount)), [amount])

  const handleClose = useCallback(() => {
    onClose()
    setValue("amount", "")
    setStep(PowerUpStep.SWAP)
  }, [onClose, setValue])

  const convertB3trMutation = useConvertB3tr({
    amount,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Conversion in progress...") },
      success: { title: t("Conversion Completed") },
      error: { title: t("Error converting tokens") },
    },
    onSuccess: handleClose,
  })

  const convertVot3Mutation = useConvertVot3({
    amount,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Conversion in progress...") },
      success: { title: t("Conversion Completed") },
      error: { title: t("Error converting tokens") },
    },
    onSuccess: handleClose,
  })

  const handleConvert = useCallback(() => {
    if (isSmartAccountUpgradeRequired && convertTo === "vot3") {
      return openUpgradeModal()
    }
    const mutation = convertTo === "vot3" ? convertB3trMutation : convertVot3Mutation
    mutation.resetStatus()
    mutation.sendTransaction()
  }, [isSmartAccountUpgradeRequired, convertTo, convertB3trMutation, convertVot3Mutation, openUpgradeModal])

  const b3trBalanceAfterSwap = useMemo(() => {
    if (convertTo === "vot3") {
      return new BigNumber(b3trBalanceScaled).minus(amount || 0).toString()
    }
    return new BigNumber(b3trBalanceScaled).plus(amount || 0).toString()
  }, [b3trBalanceScaled, amount, convertTo])

  const vot3BalanceAfterSwap = useMemo(() => {
    if (convertTo === "vot3") {
      return new BigNumber(vot3BalanceScaled).plus(amount || 0).toString()
    }
    return new BigNumber(vot3BalanceScaled).minus(amount || 0).toString()
  }, [vot3BalanceScaled, amount, convertTo])

  return (
    <Modal
      isOpen={isOpen && !isTxModalOpen}
      onClose={handleClose}
      // title={t("Convert tokens")}
      showCloseButton={false}
      showHeader={false}
      initialFocusEl={() => inputRef?.current}>
      <VStack gap={6} w="full">
        <Box position="relative" w="full">
          <Flex direction="column" gap={6}>
            <VStack
              bg="card.default"
              border="1px solid"
              borderColor="borders.secondary"
              borderRadius="2xl"
              p={4}
              gap={2}
              align="start"
              w="full"
              transform={convertTo === "vot3" ? "translateY(0)" : "translateY(calc(100% + 24px))"}
              transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              zIndex={convertTo === "vot3" ? 0 : 1}
              minHeight="30">
              <Field.Root gap="2" required invalid={Number(amount) > 0 && invalidAmount}>
                <Field.Label w="full" alignItems="center" justifyContent="space-between">
                  <Text textStyle="sm" color="text.subtle">
                    {convertTo === "vot3" ? t("You'll convert") : t("You'll receive")}
                  </Text>
                  {convertTo === "vot3" && (
                    <Button
                      variant="link"
                      height="5"
                      size="sm"
                      p="0"
                      onClick={() => setValue("amount", maxBalance ?? "0")}>
                      {"Use max"}
                    </Button>
                  )}
                </Field.Label>

                <HStack w="full" justifyContent="space-between">
                  <VStack align="start" gap="1">
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <NumberInput.Root
                          p="0"
                          inputMode="numeric"
                          min={0}
                          value={value || "0"}
                          onValueChange={e => onChange(e.value)}
                          allowOverflow={false}
                          lineClamp={1}
                          clampValueOnBlur
                          formatOptions={{ maximumFractionDigits: 6 }}
                          readOnly={convertTo === "b3tr"}>
                          <NumberInput.Input
                            ref={convertTo === "vot3" ? inputRef : undefined}
                            p="0"
                            border="none"
                            outline="none"
                            textStyle={(value || "0").length > 10 ? "xl" : "3xl"}
                            transition="font-size 0.15s ease-out"
                            autoFocus={convertTo === "vot3"}
                          />
                        </NumberInput.Root>
                      )}
                    />
                    <Field.ErrorText>{convertTo === "vot3" ? "Error message here" : ""}</Field.ErrorText>
                  </VStack>

                  <VStack align="end" gap={2} flexShrink={0}>
                    <HStack gap={2}>
                      <Circle size="24px" bg="banners.blue-new">
                        <B3TRIcon boxSize="16px" />
                      </Circle>
                      <Text textStyle="lg" fontWeight="semibold">
                        {"B3TR"}
                      </Text>
                    </HStack>
                    <Text textStyle="xs" color="text.subtle">
                      {t("Available")}
                      {":"} {compactFormatter.format(Number(b3trBalanceScaled))}
                    </Text>
                  </VStack>
                </HStack>
              </Field.Root>
            </VStack>

            <VStack
              bg="card.default"
              border="1px solid"
              borderColor="borders.secondary"
              borderRadius="2xl"
              p={4}
              gap={2}
              align="start"
              w="full"
              transform={convertTo === "vot3" ? "translateY(0)" : "translateY(calc(-100% - 24px))"}
              transition="transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              zIndex={convertTo === "b3tr" ? 0 : 1}
              minHeight="30">
              <Field.Root gap="2" required invalid={Number(amount) > 0 && invalidAmount}>
                <Field.Label w="full" alignItems="center" justifyContent="space-between">
                  <Text textStyle="sm" color="text.subtle">
                    {convertTo === "vot3" ? t("You'll receive") : t("You'll convert")}
                  </Text>
                  {convertTo === "b3tr" && (
                    <Button
                      variant="link"
                      height="5"
                      size="sm"
                      p="0"
                      onClick={() => setValue("amount", maxBalance ?? "0")}>
                      {"Use max"}
                    </Button>
                  )}
                </Field.Label>

                <HStack w="full" justifyContent="space-between">
                  <VStack align="start" gap="1">
                    <Controller
                      name="amount"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <NumberInput.Root
                          inputMode="numeric"
                          min={0}
                          value={value || "0"}
                          onValueChange={e => onChange(e.value)}
                          allowOverflow={false}
                          clampValueOnBlur
                          formatOptions={{ maximumFractionDigits: 6 }}
                          readOnly={convertTo === "vot3"}>
                          <NumberInput.Input
                            ref={convertTo === "b3tr" ? inputRef : undefined}
                            p="0"
                            border="none"
                            outline="none"
                            textStyle={(value || "0").length > 10 ? "xl" : "3xl"}
                            transition="font-size 0.15s ease-out"
                            autoFocus={convertTo === "b3tr"}
                          />
                        </NumberInput.Root>
                      )}
                    />
                    {convertTo === "vot3" && (
                      <Field.HelperText w="full" display="flex" alignItems="center" lineClamp={2}>
                        <Text textStyle="xs" color="text.subtle" display="flex" gap="1" alignItems="center">
                          {getCompactFormatter(2).format(Number(amount)) || "0"} {t("Voting Power")}
                          <Tooltip
                            positioning={{ placement: "bottom-end" }}
                            contentProps={{ p: "3", rounded: "md" }}
                            content={
                              <VStack gap="1" align="start">
                                <Text textStyle="sm" color="text.alt" fontWeight="semibold">
                                  {t("Voting power = VOT3 at snapshot")}
                                </Text>
                                <Text textStyle="xs" color="text.alt-subtle">
                                  {t(
                                    "Meaning Voting power is how much influence you'll have in the next round. It's based on how much VOT3 you hold before next round starts.",
                                  )}
                                </Text>
                              </VStack>
                            }>
                            <Icon as={InfoCircle} boxSize="4" display="inline-block" />
                          </Tooltip>
                        </Text>
                      </Field.HelperText>
                    )}
                    <Field.ErrorText>{convertTo === "b3tr" ? "Error message here" : ""}</Field.ErrorText>
                  </VStack>

                  <VStack align="end" gap={2} flexShrink={0}>
                    <HStack gap={2}>
                      <Circle size="24px" bg="brand.secondary">
                        <Image src="/assets/logos/vot3_logo_dark.svg" boxSize="16px" alt="VOT3" />
                      </Circle>
                      <Text textStyle="lg" fontWeight="semibold">
                        {"VOT3"}
                      </Text>
                    </HStack>
                    <Text textStyle="xs" color="text.subtle">
                      {t("Available")}
                      {":"} {compactFormatter.format(Number(vot3BalanceScaled))}
                    </Text>
                  </VStack>
                </HStack>
              </Field.Root>
            </VStack>
          </Flex>

          <Circle
            size="44px"
            bg="actions.primary.default"
            position="absolute"
            left="50%"
            top="50%"
            transform={`translate(-50%, -50%) rotate(${convertTo === "vot3" ? 0 : 180}deg)`}
            transition="transform 0.3s ease"
            zIndex={2}
            cursor="pointer"
            onClick={() => {
              setValue("amount", "0")
              setConvertTo(prev => (prev === "vot3" ? "b3tr" : "vot3"))
            }}
            _hover={{ bg: "actions.primary.hover" }}>
            <Icon as={SwapIcon} color="white" boxSize="20px" />
          </Circle>
        </Box>

        <Button
          variant="primary"
          w="full"
          rounded="full"
          size="lg"
          disabled={invalidAmount}
          onClick={goToReview}
          mt="auto">
          {t("Continue")}
        </Button>
      </VStack>
    </Modal>
  )
}
