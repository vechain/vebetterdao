import { Button, Card, Field, Heading, HStack, Icon, NumberInput, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { InfoCircle, WarningTriangle } from "iconoir-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuUsers } from "react-icons/lu"

import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { NavigatorEntityFormatted } from "@/api/indexer/navigators/useNavigators"
import { AddressIcon } from "@/components/AddressIcon"
import { BaseModal } from "@/components/BaseModal"
import { VOT3Icon } from "@/components/Icons/VOT3Icon"
import { handleAmountInput } from "@/components/PowerUpModal/utils"
import { useIncreaseDelegation } from "@/hooks/navigator/useIncreaseDelegation"
import { useReduceDelegation, useUndelegate } from "@/hooks/navigator/useUndelegateFromNavigator"
import { useGetVot3UnlockedBalance } from "@/hooks/useGetVot3UnlockedBalance"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

const formatter = getCompactFormatter(2)

type Props = {
  isOpen: boolean
  onClose: () => void
  navigator: NavigatorEntityFormatted
  exitMode?: boolean
}

export const ManageDelegationModal = ({ isOpen, onClose, navigator: nav, exitMode = false }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const { data: vot3Balance, isLoading: balanceLoading } = useGetVot3UnlockedBalance(account?.address)
  const { data: domainData } = useVechainDomain(nav.address)
  const { data: currentDelegation } = useGetDelegatedAmount(account?.address)
  const [newAmount, setNewAmount] = useState("")

  const currentDelegatedNum = currentDelegation ? Number(currentDelegation.scaled) : 0
  const displayName = domainData?.domain ? humanDomain(domainData.domain, 15, 10) : humanAddress(nav.address, 6, 4)
  const balanceNum = vot3Balance ? Number(vot3Balance.scaled) : 0
  const availableBalance = vot3Balance?.scaled ?? "0"
  const newAmountNum = Number(newAmount) || 0

  // Capacity: stake * 10 - totalDelegated + currentDelegation (user's own delegation is part of totalDelegated)
  const capacityNum = Number(nav.stakeFormatted) * 10 - Number(nav.totalDelegatedFormatted) + currentDelegatedNum
  const maxCapacity = Math.max(0, capacityNum)
  const maxNewAmount = Math.min(currentDelegatedNum + balanceNum, maxCapacity)

  const delta = newAmountNum - currentDelegatedNum
  const isIncreasing = delta > 0
  const isDecreasing = delta < 0
  const isFullRemoval = newAmountNum === 0 && currentDelegatedNum > 0
  const hasChanged = delta !== 0

  const isAtCapacity = Number(nav.stakeFormatted) * 10 <= Number(nav.totalDelegatedFormatted)
  const exceedsCapacity = newAmountNum > maxCapacity
  const exceedsBalance = isIncreasing && delta > balanceNum
  const isValid = hasChanged && !exceedsCapacity && !exceedsBalance && newAmountNum >= 0

  useEffect(() => {
    if (isOpen) setNewAmount(exitMode ? "0" : currentDelegatedNum.toString())
  }, [isOpen, currentDelegatedNum, exitMode])

  const { sendTransaction: sendIncrease } = useIncreaseDelegation({ onSuccess: onClose })
  const { sendTransaction: sendReduce } = useReduceDelegation({ onSuccess: onClose })
  const { sendTransaction: sendUndelegate } = useUndelegate({ onSuccess: onClose })

  const handleSubmit = useCallback(() => {
    if (!isValid) return

    if (isFullRemoval) {
      sendUndelegate({})
    } else if (isDecreasing) {
      sendReduce({ amount: Math.abs(delta).toString() })
    } else if (isIncreasing) {
      sendIncrease({ amount: delta.toString() })
    }
  }, [isValid, isFullRemoval, isDecreasing, isIncreasing, delta, sendUndelegate, sendReduce, sendIncrease])

  const getButtonLabel = () => {
    if (isFullRemoval) return t("Exit all delegation")
    if (isDecreasing) return t("Reduce by {{amount}} VOT3", { amount: formatter.format(Math.abs(delta)) })
    if (isIncreasing) return t("Add {{amount}} VOT3", { amount: formatter.format(delta) })
    return t("No changes")
  }

  const summaryColor = isDecreasing || isFullRemoval ? "status.negative" : "status.positive"

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={onClose}
      showCloseButton
      modalProps={{ closeOnInteractOutside: true }}>
      <VStack gap={5} align="stretch" w="full">
        <Heading size="xl" fontWeight="bold">
          {exitMode ? t("Exit Delegation") : t("Manage Delegation")}
        </Heading>

        {/* Navigator info */}
        <HStack
          gap={3}
          w="full"
          bg="card.default"
          border="1px solid"
          borderColor="border.secondary"
          borderRadius="2xl"
          p={4}>
          <AddressIcon address={nav.address} boxSize={10} borderRadius="full" />
          <VStack gap={0} align="start" flex={1}>
            <Text textStyle="sm" fontWeight="semibold">
              {displayName}
            </Text>
            <HStack gap={2}>
              <LuUsers size={12} />
              <Text textStyle="xs" color="fg.muted">
                {t("{{count}} citizens", { count: nav.citizenCount })}
              </Text>
            </HStack>
          </VStack>
          <VStack gap={0} align="end">
            <Text textStyle="sm" fontWeight="bold">
              {formatter.format(currentDelegatedNum)}
            </Text>
            <Text textStyle="xs" color="fg.muted">
              {t("VOT3 delegated")}
            </Text>
          </VStack>
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
          <Field.Root
            gap={2}
            required
            invalid={!!newAmount && newAmount !== "." && (exceedsBalance || exceedsCapacity)}>
            <Field.Label w="full" alignItems="center" justifyContent="space-between">
              <Text textStyle="sm" color="text.subtle">
                {t("New delegation amount")}
              </Text>
              <Button
                variant="link"
                height="5"
                size="sm"
                p="0"
                onClick={() => setNewAmount(handleAmountInput(maxNewAmount.toString()))}>
                {t("Use max")}
              </Button>
            </Field.Label>

            <HStack w="full" justifyContent="space-between">
              <VStack align="start" gap="2" w="full">
                <NumberInput.Root asChild textOverflow="ellipsis" p="0" allowOverflow={false} min={0}>
                  <NumberInput.Input
                    min={0}
                    p="0"
                    value={newAmount}
                    placeholder="0"
                    onChange={e => setNewAmount(handleAmountInput(e.target.value))}
                    onBlur={() => setNewAmount(prev => prev.replace(/\.$/, ""))}
                    border="none"
                    outline="none"
                    textStyle={(newAmount || "0").length > 15 ? "lg" : (newAmount || "0").length > 10 ? "xl" : "3xl"}
                    transition="font-size 0.15s ease-out"
                  />
                </NumberInput.Root>
                <Field.ErrorText>
                  <Icon as={WarningTriangle} boxSize="4" />
                  {exceedsCapacity
                    ? t("Exceeds navigator capacity. Max: {{max}} VOT3", {
                        max: formatter.format(maxCapacity),
                      })
                    : t("Insufficient VOT3 balance")}
                </Field.ErrorText>
              </VStack>

              <VStack align="end" gap={2} flexShrink={0}>
                <HStack gap={2}>
                  <VOT3Icon boxSize="24px" />
                  <Text textStyle="lg" fontWeight="semibold">
                    {"VOT3"}
                  </Text>
                </HStack>
                <Skeleton loading={balanceLoading}>
                  <Text textStyle="xs" color="text.subtle">
                    {t("Available:")} {formatter.format(Number(availableBalance))}
                  </Text>
                </Skeleton>
              </VStack>
            </HStack>
          </Field.Root>
        </VStack>

        {/* Delta summary */}
        {hasChanged && (
          <Card.Root
            w="full"
            p={4}
            bg={`${summaryColor}.subtle`}
            border="1px solid"
            borderColor={`${summaryColor}.strong`}
            rounded="2xl">
            <VStack align="start" gap={2}>
              <Text textStyle="xs" color="text.subtle" fontStyle="italic">
                {isDecreasing || isFullRemoval
                  ? t("Voting Power removed from next round")
                  : t("Voting Power added from next round")}
              </Text>

              <Text textStyle="3xl" fontWeight="bold" color={`${summaryColor}.strong`}>
                {isDecreasing || isFullRemoval ? "-" : "+"}
                {formatter.format(Math.abs(delta))}
                {" VOT3"}
              </Text>

              <VStack align="start" gap={0.5}>
                <HStack gap={1}>
                  <Text textStyle="sm" color="text.subtle">
                    {t("Your current delegation:")}
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">
                    {formatter.format(currentDelegatedNum)} {"VOT3"}
                  </Text>
                </HStack>
                <HStack gap={1}>
                  <Text textStyle="sm" color="text.subtle">
                    {t("Navigator capacity remaining:")}
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">
                    {formatter.format(Math.max(0, maxCapacity - newAmountNum))} {"VOT3"}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </Card.Root>
        )}

        {/* Info callout */}
        {isValid && (
          <Card.Root w="full" p={3} bg="card.default" border="1px solid" borderColor="border.secondary" rounded="xl">
            <HStack gap={3} align="flex-start">
              <Icon as={InfoCircle} boxSize="5" color="text.subtle" mt="0.5" flexShrink={0} />
              <Text textStyle="xs" color="text.subtle">
                {t(
                  "Changes take effect at the start of the next round. Until then, your current delegation remains active for voting and rewards.",
                )}
              </Text>
            </HStack>
          </Card.Root>
        )}

        {isAtCapacity && !isDecreasing && !isFullRemoval && (
          <Card.Root
            w="full"
            p={3}
            bg="status.negative.subtle"
            border="1px solid"
            borderColor="status.negative.strong"
            rounded="xl">
            <HStack gap={3} align="flex-start">
              <Icon as={WarningTriangle} boxSize="5" color="status.negative.strong" mt="0.5" flexShrink={0} />
              <Text textStyle="xs" color="status.negative.strong" fontWeight="semibold">
                {t(
                  "This navigator reached its maximum delegation capacity and cannot receive further delegations for now.",
                )}
              </Text>
            </HStack>
          </Card.Root>
        )}

        <VStack gap={2} mt={2} w="full">
          <Button
            variant={isDecreasing || isFullRemoval ? "negative" : "primary"}
            w="full"
            rounded="full"
            size="lg"
            disabled={!isValid}
            onClick={handleSubmit}>
            {getButtonLabel()}
          </Button>
          <Button variant="ghost" w="full" rounded="full" size="lg" onClick={onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
