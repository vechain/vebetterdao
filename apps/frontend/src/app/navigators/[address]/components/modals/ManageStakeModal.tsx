import {
  Button,
  Card,
  Field,
  Heading,
  HStack,
  Icon,
  NumberInput,
  Separator,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { InfoCircle, WarningTriangle } from "iconoir-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useGetMaxStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMaxStake"
import { useGetMinStake } from "@/api/contracts/navigatorRegistry/hooks/useGetMinStake"
import { NavigatorEntityFormatted } from "@/api/indexer/navigators/useNavigators"
import { BaseModal } from "@/components/BaseModal"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import B3trSvg from "@/components/Icons/svg/b3tr.svg"
import { handleAmountInput } from "@/components/PowerUpModal/utils"
import { useAddStake } from "@/hooks/navigator/useAddStake"
import { useReduceStake } from "@/hooks/navigator/useReduceStake"
import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

const formatter = getCompactFormatter(2)

type Props = {
  isOpen: boolean
  onClose: () => void
  navigator: NavigatorEntityFormatted
}

export const ManageStakeModal = ({ isOpen, onClose, navigator: nav }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const { data: b3trBalance, isLoading: balanceLoading } = useGetB3trBalance(account?.address ?? undefined)
  const { data: minStakeData } = useGetMinStake()
  const { data: maxStakeData } = useGetMaxStake()

  const [amount, setAmount] = useState("")

  const currentStake = Number(nav.stakeFormatted ?? 0)
  const totalDelegated = Number(nav.totalDelegatedFormatted ?? 0)
  const balanceNum = b3trBalance ? Number(b3trBalance.scaled) : 0
  const minStake = minStakeData ? Number(minStakeData.scaled) : 0
  const maxStake = maxStakeData ? Number(maxStakeData.scaled) : 0

  // Floor imposed by delegation capacity: stake * 10 >= totalDelegated
  const capacityFloor = Math.ceil(totalDelegated / 10)
  const effectiveMin = Math.max(minStake, capacityFloor)

  const amountNum = Number(amount) || 0
  const delta = amountNum - currentStake
  const isIncreasing = delta > 0
  const isDecreasing = delta < 0
  const hasChanged = delta !== 0

  const maxAmount = Math.min(currentStake + balanceNum, maxStake || Infinity)

  const headroom = maxStake > 0 ? Math.max(maxStake - currentStake, 0) : Infinity
  const isCapBinding = maxStake > 0 && balanceNum > headroom

  const exceedsBalance = isIncreasing && delta > balanceNum
  const exceedsMax = isIncreasing && amountNum > maxStake && maxStake > 0
  const belowMin = amountNum > 0 && amountNum < effectiveMin

  const errorMessage = useMemo(() => {
    if (exceedsBalance) return t("Insufficient B3TR balance")
    if (exceedsMax) return t("Exceeds maximum stake of {{max}} B3TR", { max: formatter.format(maxStake) })
    if (belowMin && capacityFloor > minStake)
      return t("Minimum {{min}} B3TR required to maintain delegation capacity", {
        min: formatter.format(capacityFloor),
      })
    if (belowMin) return t("Minimum stake is {{min}} B3TR", { min: formatter.format(minStake) })
    return null
  }, [exceedsBalance, exceedsMax, belowMin, capacityFloor, minStake, maxStake, t])

  const isValid = hasChanged && !exceedsBalance && !exceedsMax && !belowMin && amountNum > 0

  useEffect(() => {
    if (!isOpen) return
    setAmount(currentStake.toString())
  }, [isOpen, currentStake])

  const { sendTransaction: sendAddStake } = useAddStake({ onSuccess: onClose })
  const { sendTransaction: sendReduceStake } = useReduceStake({ onSuccess: onClose })

  const handleSubmit = useCallback(() => {
    if (!isValid) return

    if (isIncreasing) {
      sendAddStake({ amount: delta.toString() })
    } else if (isDecreasing) {
      sendReduceStake({ amount: Math.abs(delta).toString() })
    }
  }, [isValid, isIncreasing, isDecreasing, delta, sendAddStake, sendReduceStake])

  const buttonLabel = useMemo(() => {
    if (!hasChanged) return t("No changes")
    if (isIncreasing) return t("Add {{amount}} B3TR", { amount: formatter.format(delta) })
    return t("Reduce by {{amount}} B3TR", { amount: formatter.format(Math.abs(delta)) })
  }, [hasChanged, isIncreasing, delta, t])

  const buttonVariant = isDecreasing ? "negative" : "primary"
  const summaryColor = isDecreasing ? "status.negative" : "status.positive"

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={onClose}
      showCloseButton
      modalProps={{ closeOnInteractOutside: true }}>
      <VStack gap={5} align="stretch" w="full">
        <Heading size="xl" fontWeight="bold">
          {t("Manage Stake")}
        </Heading>

        {/* Current stake info */}
        <HStack
          gap={3}
          w="full"
          bg="card.default"
          border="1px solid"
          borderColor="border.secondary"
          borderRadius="2xl"
          p={4}>
          <HStack
            justify="center"
            align="center"
            w="10"
            h="10"
            rounded="full"
            bg="status.warning.subtle"
            color="status.warning.primary"
            flexShrink={0}>
            <Icon as={B3trSvg} boxSize={5} />
          </HStack>
          <VStack gap={0} align="start" flex={1}>
            <Text textStyle="sm" fontWeight="semibold">
              {t("Current Stake")}
            </Text>
            <Text textStyle="xs" color="fg.muted">
              {t("Min: {{min}} B3TR", { min: formatter.format(effectiveMin) })}
            </Text>
          </VStack>
          <Text textStyle="lg" fontWeight="bold">
            {formatter.format(currentStake)} {"B3TR"}
          </Text>
        </HStack>

        {/* Amount input */}
        <VStack
          bg="card.default"
          border="1px solid"
          borderColor="border.secondary"
          borderRadius="2xl"
          p={4}
          gap={2}
          align="start"
          w="full">
          <Field.Root gap={2} required invalid={!!amount && amount !== "." && !!errorMessage}>
            <Field.Label w="full" alignItems="center" justifyContent="space-between">
              <Text textStyle="sm" color="text.subtle">
                {t("New stake amount")}
              </Text>
              <Button
                variant="link"
                height="5"
                size="sm"
                p="0"
                onClick={() => setAmount(handleAmountInput(maxAmount.toString()))}>
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
                    min={0}
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
                  {errorMessage}
                </Field.ErrorText>
              </VStack>

              <VStack align="end" gap={2} flexShrink={0}>
                <HStack gap={2}>
                  <B3TRIcon boxSize="24px" />
                  <Text textStyle="lg" fontWeight="semibold">
                    {"B3TR"}
                  </Text>
                </HStack>
                <Skeleton loading={balanceLoading}>
                  <Text textStyle="xs" color="text.subtle">
                    {t("Available: {{amount}}", { amount: formatter.format(balanceNum) })}
                  </Text>
                </Skeleton>
              </VStack>
            </HStack>
          </Field.Root>

          {isCapBinding && !errorMessage && (
            <HStack gap={2} align="center" color="status.warning.primary">
              <Icon as={WarningTriangle} boxSize="4" flexShrink={0} />
              <Text textStyle="xs">
                {t("You can stake up to {{amount}} more B3TR (1% of VOT3 supply)", {
                  amount: formatter.format(headroom),
                })}
              </Text>
            </HStack>
          )}
        </VStack>

        {/* Summary card */}
        {hasChanged && !errorMessage && (
          <Card.Root
            w="full"
            p={4}
            bg={`${summaryColor}.subtle`}
            border="1px solid"
            borderColor={`${summaryColor}.strong`}
            rounded="2xl">
            <VStack align="start" gap={2}>
              <Text textStyle="xs" color="text.subtle" fontStyle="italic">
                {isDecreasing ? t("Stake reduction") : t("Stake increase")}
              </Text>

              <Text textStyle="3xl" fontWeight="bold" color={`${summaryColor}.strong`}>
                {isDecreasing ? "-" : "+"}
                {formatter.format(Math.abs(delta))}
                {" B3TR"}
              </Text>

              <Separator w="full" borderColor={`${summaryColor}.strong/30`} />
              <VStack align="start" gap={1} w="full">
                <HStack w="full" justifyContent="space-between">
                  <Text textStyle="xs" color="text.subtle">
                    {t("Stake")}
                  </Text>
                  <Text textStyle="xs" fontWeight="semibold">
                    {formatter.format(currentStake)} {"→"} {formatter.format(amountNum)} {"B3TR"}
                  </Text>
                </HStack>
                <HStack w="full" justifyContent="space-between">
                  <Text textStyle="xs" color="text.subtle">
                    {t("New delegation capacity")}
                  </Text>
                  <Text textStyle="xs" fontWeight="semibold">
                    {formatter.format(amountNum * 10)} {"VOT3"}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Card.Root>
        )}

        {/* Info cards */}
        {isValid && (
          <Card.Root w="full" p={3} bg="card.default" border="1px solid" borderColor="border.secondary" rounded="xl">
            <VStack gap={3} align="stretch">
              {isDecreasing && totalDelegated > 0 && (
                <HStack gap={3} align="center">
                  <Icon as={InfoCircle} boxSize="5" color="text.subtle" mt="0.5" flexShrink={0} />
                  <Text textStyle="xs" color="text.subtle">
                    {t("Your stake must remain sufficient to cover your current delegations ({{delegated}} VOT3).", {
                      delegated: formatter.format(totalDelegated),
                    })}
                  </Text>
                </HStack>
              )}
              <HStack gap={3} align="center">
                <Icon as={InfoCircle} boxSize="5" color="text.subtle" mt="0.5" flexShrink={0} />
                <Text textStyle="xs" color="text.subtle">
                  {isIncreasing
                    ? t("B3TR will be transferred from your wallet to the Navigator Staking contract.")
                    : t("B3TR will be returned to your wallet.")}
                </Text>
              </HStack>
            </VStack>
          </Card.Root>
        )}

        <VStack gap={2} mt={2} w="full">
          <Button variant={buttonVariant} w="full" rounded="full" size="lg" disabled={!isValid} onClick={handleSubmit}>
            {buttonLabel}
          </Button>
          <Button variant="ghost" w="full" rounded="full" size="lg" onClick={onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
