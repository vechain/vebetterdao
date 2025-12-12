"use client"

import {
  Box,
  Button,
  ButtonGroup,
  Circle,
  CloseButton,
  Collapsible,
  DataList,
  Dialog,
  Field,
  Flex,
  HStack,
  Heading,
  Icon,
  NumberInput,
  Text,
  VStack,
} from "@chakra-ui/react"
import { getCompactFormatter, humanAddress } from "@repo/utils/FormattingUtils"
import { useUpgradeSmartAccountModal, useWallet } from "@vechain/vechain-kit"
import { InfoCircle, NavArrowDown, WarningTriangle } from "iconoir-react"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { formatUnits } from "viem"

import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import SwapIcon from "@/components/Icons/svg/swap.svg"
import { default as VOT3Icon } from "@/components/Icons/svg/vot3-icon.svg"
import { Modal } from "@/components/Modal"
import { Tooltip } from "@/components/ui/tooltip"
import { useB3TRExchangeRate } from "@/hooks/useB3TRExchangeRate"
import { useConvertB3tr } from "@/hooks/useConvertB3tr"
import { useConvertVot3 } from "@/hooks/useConvertVot3"
import { useEstimateGasFee } from "@/hooks/useEstimateGasFee"
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
  const { data: b3trToUsd } = useB3TRExchangeRate()

  const { isTxModalOpen } = useTransactionModal()
  const [step, setStep] = useState<PowerUpStep>(PowerUpStep.SWAP)
  const [animationState, setAnimationState] = useState<"merge" | "unmerge" | null>(null)
  const [convertTo, setConvertTo] = useState<"vot3" | "b3tr">("vot3")
  const [amount, setAmount] = useState("0")

  const maxBalance = convertTo === "vot3" ? b3trBalance?.scaled : vot3Balance?.scaled

  const isSmartAccountUpgradeRequired = useSmartAccountUpgradeRequired()
  const { open: openUpgradeModal } = useUpgradeSmartAccountModal({ accentColor: "#004CFC" })

  const b3trBalanceScaled = useMemo(() => b3trBalance?.scaled ?? "0", [b3trBalance?.scaled])
  const vot3BalanceScaled = useMemo(() => vot3Balance?.scaled ?? "0", [vot3Balance?.scaled])

  const handleAmountChange = (value: string) => {
    const rawAmount = value.replaceAll(",", ".").replace(/^0+(?=\d)/, "")
    const dotIndex = rawAmount.indexOf(".")
    setAmount(
      dotIndex >= 0 ? rawAmount.slice(0, dotIndex + 1) + rawAmount.slice(dotIndex + 1, dotIndex + 19) : rawAmount,
    )
  }
  const handleAmountBlur = () => setAmount(prev => prev.replace(/\.$/, ""))
  const invalidAmount = !amount || Number(amount) > Number(convertTo === "vot3" ? b3trBalanceScaled : vot3BalanceScaled)

  const handleClose = useCallback(() => {
    onClose()
    setConvertTo("vot3")
    setAmount("")
    setStep(PowerUpStep.SWAP)
  }, [onClose])

  const convertB3trMutation = useConvertB3tr({
    amount,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Conversion in progress...") },
      success: { title: t("Conversion Completed") },
      error: { title: t("Error converting tokens") },
    },
    onSuccess: handleClose,
  })
  const { data: convertB3trGasEstimation } = useEstimateGasFee({
    clauses: convertB3trMutation.clauses,
    enabled: step === PowerUpStep.REVIEW && !!amount && amount !== "0",
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
  const { data: convertVot3GasEstimation } = useEstimateGasFee({
    clauses: convertVot3Mutation.clauses,
    enabled: step === PowerUpStep.REVIEW && convertTo === "b3tr" && !!amount && amount !== "0",
  })

  const estimatedGasFee = formatUnits(
    BigInt(convertB3trGasEstimation?.totalGas ?? convertVot3GasEstimation?.totalGas ?? 0),
    5,
  )

  const handleConvert = () => {
    if (isSmartAccountUpgradeRequired && convertTo === "vot3") {
      return openUpgradeModal()
    }
    const mutation = convertTo === "vot3" ? convertB3trMutation : convertVot3Mutation
    mutation.resetStatus()
    mutation.sendTransaction()
  }

  const goToReview = () => {
    if (invalidAmount) return
    setAnimationState("merge")
  }

  const goToSwap = () => {
    setAnimationState("unmerge")
    setStep(PowerUpStep.SWAP)
  }

  const handleAnimationEnd = () => {
    if (animationState === "merge") {
      setStep(PowerUpStep.REVIEW)
    }
    setAnimationState(null)
  }

  const ReviewContainer = () => {
    const fromToken = convertTo === "vot3" ? "B3TR" : "VOT3"
    const toToken = convertTo === "vot3" ? "VOT3" : "B3TR"
    const amountFormatted = getCompactFormatter(10).format(Number(amount)) || "0"

    const data = [
      { label: t("Estimated gas fee"), value: `${(estimatedGasFee || "").slice(0, 4)} VTHO` },
      { label: t("Conversion rate"), value: `1 B3TR = ${(b3trToUsd || "").slice(0, 6)} USD` },
      { label: t("Wallet"), value: account?.address ? humanAddress(account.address) : "-" },
    ] as const

    return (
      <VStack
        bg="card.default"
        border="1px solid"
        borderColor="borders.secondary"
        borderRadius="2xl"
        p={4}
        gap={4}
        w="full"
        animation="fadeInMerged"
        divideY="1px">
        <VStack gap={2} align="start" w="full">
          <Text textStyle="sm" color="text.subtle">
            {t("You'll convert")}
          </Text>
          <HStack w="full" justify="space-between">
            <Text textStyle="xl" fontWeight="bold">
              {amountFormatted}
            </Text>
            <HStack gap={2}>
              {fromToken === "B3TR" ? (
                <Circle size="24px" bg="blue.50">
                  <B3TRIcon boxSize="16px" />
                </Circle>
              ) : (
                <Circle size="24px" bg="brand.secondary">
                  <Icon as={VOT3Icon} color="black" boxSize="16px" />
                </Circle>
              )}
              <Text textStyle="xl" fontWeight="semibold">
                {fromToken}
              </Text>
            </HStack>
          </HStack>
        </VStack>
        <VStack pt="4" gap={2} align="start" w="full">
          <Text textStyle="sm" color="text.subtle">
            {t("You'll receive")}
          </Text>
          <HStack w="full" justify="space-between">
            <Text textStyle="xl" fontWeight="bold">
              {amountFormatted}
            </Text>
            <HStack gap={2}>
              {toToken === "VOT3" ? (
                <Circle size="24px" bg="brand.secondary">
                  <Icon as={VOT3Icon} color="black" boxSize="16px" />
                </Circle>
              ) : (
                <Circle size="24px" bg="blue.50">
                  <B3TRIcon boxSize="16px" />
                </Circle>
              )}
              <Text textStyle="lg" fontWeight="semibold">
                {toToken}
              </Text>
            </HStack>
          </HStack>
        </VStack>
        <Collapsible.Root w="full" pt="4" defaultOpen>
          <Collapsible.Trigger w="full" display="flex" alignItems="center" justifyContent="space-between">
            <Text textStyle="sm" color="text.subtle">
              {t("Transaction details")}
            </Text>
            <Collapsible.Indicator transition="transform 0.2s" _open={{ transform: "rotate(180deg)" }}>
              <Icon as={NavArrowDown} boxSize="16px" />
            </Collapsible.Indicator>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <DataList.Root p="0" pt="4" gap="4" flexDirection={{ base: "column", md: "row" }}>
              {data.map(item => (
                <DataList.Item key={item.label}>
                  <DataList.ItemLabel color="text.subtle" textStyle="xs">
                    {item.label}
                  </DataList.ItemLabel>
                  <DataList.ItemValue fontWeight="bold" textStyle="sm">
                    {item.value}
                  </DataList.ItemValue>
                </DataList.Item>
              ))}
            </DataList.Root>
          </Collapsible.Content>
        </Collapsible.Root>
      </VStack>
    )
  }

  return (
    <Modal
      modalProps={{ size: "md" }}
      isOpen={isOpen && !isTxModalOpen}
      onClose={handleClose}
      title={
        <HStack alignItems="center" justifyContent="space-between" mb={{ base: "unset", md: "8" }}>
          <Heading textAlign="left" size="xl">
            {t("Convert tokens")}
          </Heading>
          <Dialog.CloseTrigger asChild position="static">
            <CloseButton size="md" />
          </Dialog.CloseTrigger>
        </HStack>
      }
      showCloseButton={false}
      showHeader={false}>
      <VStack gap={6} w="full" h="full">
        {step === PowerUpStep.SWAP ? (
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
                transition={animationState ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"}
                animation={animationState === "merge" || animationState === "unmerge" ? "mergeDown" : undefined}
                animationDirection={animationState === "unmerge" ? "reverse" : "normal"}
                onAnimationEnd={handleAnimationEnd}
                zIndex={convertTo === "vot3" ? 0 : 1}
                minHeight="8rem">
                <Field.Root
                  gap={{ base: "2", md: "4" }}
                  required
                  invalid={convertTo === "vot3" && !!amount && Number(amount) > Number(b3trBalanceScaled)}>
                  <Field.Label w="full" alignItems="center" justifyContent="space-between" gap={{ base: "2", md: "4" }}>
                    <Text textStyle="sm" color="text.subtle">
                      {convertTo === "vot3" ? t("You'll convert") : t("You'll receive")}
                    </Text>
                    {convertTo === "vot3" && (
                      <Button
                        variant="link"
                        height="5"
                        size="sm"
                        p="0"
                        onClick={() => handleAmountChange(maxBalance ?? "0")}>
                        {"Use max"}
                      </Button>
                    )}
                  </Field.Label>

                  <HStack w="full" justifyContent="space-between">
                    <VStack align="start" gap="2">
                      <NumberInput.Root
                        asChild
                        autoFocus={convertTo === "vot3"}
                        textOverflow="ellipsis"
                        p="0"
                        allowOverflow={false}
                        readOnly={convertTo === "b3tr"}>
                        <NumberInput.Input
                          min={0}
                          p="0"
                          value={amount}
                          onChange={e => handleAmountChange(e.target.value)}
                          onBlur={handleAmountBlur}
                          border="none"
                          outline="none"
                          textStyle={(amount || "0").length > 15 ? "lg" : (amount || "0").length > 10 ? "xl" : "3xl"}
                          transition="font-size 0.15s ease-out"
                        />
                      </NumberInput.Root>
                      <Field.ErrorText>
                        <Icon as={WarningTriangle} boxSize="4" />
                        {convertTo === "vot3" ? t("Not enough B3TR") : ""}
                      </Field.ErrorText>
                    </VStack>

                    <VStack align="end" gap={2} flexShrink={0}>
                      <HStack gap={2}>
                        <Circle size="24px" bg="blue.50">
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
                transition={animationState ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)"}
                animation={animationState === "merge" || animationState === "unmerge" ? "mergeUp" : undefined}
                animationDirection={animationState === "unmerge" ? "reverse" : "normal"}
                zIndex={convertTo === "b3tr" ? 0 : 1}
                minHeight="8rem">
                <Field.Root
                  gap={{ base: "2", md: "4" }}
                  required
                  invalid={convertTo === "b3tr" && !!amount && Number(amount) > Number(vot3BalanceScaled)}>
                  <Field.Label w="full" alignItems="center" justifyContent="space-between" gap={{ base: "2", md: "4" }}>
                    <Text textStyle="sm" color="text.subtle">
                      {convertTo === "vot3" ? t("You'll receive") : t("You'll convert")}
                    </Text>
                    {convertTo === "b3tr" && (
                      <Button
                        variant="link"
                        height="5"
                        size="sm"
                        p="0"
                        onClick={() => handleAmountChange(maxBalance ?? "0")}>
                        {"Use max"}
                      </Button>
                    )}
                  </Field.Label>

                  <HStack w="full" justifyContent="space-between" gap="2">
                    <VStack align="start" gap="1">
                      <NumberInput.Root
                        asChild
                        autoFocus={convertTo === "b3tr"}
                        min={0}
                        allowOverflow={false}
                        readOnly={convertTo === "vot3"}
                        textOverflow="ellipsis">
                        <NumberInput.Input
                          value={amount}
                          onChange={e => handleAmountChange(e.target.value)}
                          onBlur={handleAmountBlur}
                          p="0"
                          border="none"
                          outline="none"
                          textStyle={(amount || "0").length > 15 ? "lg" : (amount || "0").length > 10 ? "xl" : "3xl"}
                          transition="font-size 0.15s ease-out"
                        />
                      </NumberInput.Root>
                      {convertTo === "vot3" && !!amount && Number.isNaN(Number(amount)) === false && (
                        <Field.HelperText w="full" lineClamp={2}>
                          <Text
                            textStyle="xs"
                            color="text.subtle"
                            display="flex"
                            gap="1"
                            justifyContent="flex-start"
                            alignItems="center">
                            {getCompactFormatter(4).format(Number(amount))} {t("Voting Power")}
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

                      <Field.ErrorText>
                        <Icon as={WarningTriangle} boxSize="4" />
                        {convertTo === "b3tr" ? t("Not enough VOT3") : ""}
                      </Field.ErrorText>
                    </VStack>

                    <VStack align="end" gap={2} flexShrink={0}>
                      <HStack gap={2}>
                        <Circle size="24px" bg="brand.secondary">
                          <Icon as={VOT3Icon} color="black" boxSize="16px" />
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
              as="button"
              size="44px"
              bg="actions.primary.default"
              position="absolute"
              left="50%"
              top="50%"
              transform={`translate(-50%, -50%) rotate(${convertTo === "vot3" ? 0 : 180}deg)`}
              transition="transform 0.3s ease"
              animation={animationState ? "fadeOutSwap" : undefined}
              animationDirection={animationState === "unmerge" ? "reverse" : "normal"}
              onAnimationEnd={handleAnimationEnd}
              zIndex={2}
              cursor="pointer"
              onClick={() => {
                setAmount("")
                setConvertTo(prev => (prev === "vot3" ? "b3tr" : "vot3"))
              }}
              _hover={{ bg: "actions.primary.hover" }}>
              <Icon as={SwapIcon} color="white" boxSize="20px" />
            </Circle>
          </Box>
        ) : (
          <ReviewContainer />
        )}

        <ButtonGroup
          w="full"
          size="sm"
          display="grid"
          gridTemplateColumns={step === PowerUpStep.REVIEW ? "1fr 1fr" : "1fr"}>
          {step === PowerUpStep.REVIEW && (
            <Button variant="secondary" w="full" rounded="full" size="lg" onClick={goToSwap} mt="auto">
              {t("Back")}
            </Button>
          )}
          <Button
            variant="primary"
            w="full"
            rounded="full"
            size="lg"
            disabled={step === PowerUpStep.SWAP && invalidAmount}
            onClick={step === PowerUpStep.SWAP ? goToReview : handleConvert}
            mt="auto">
            {step === PowerUpStep.SWAP ? t("Continue") : t("Convert now")}
          </Button>
        </ButtonGroup>
      </VStack>
    </Modal>
  )
}
