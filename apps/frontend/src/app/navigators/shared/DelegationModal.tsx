import {
  Button,
  Card,
  Checkbox,
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
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { InfoCircle, WarningTriangle } from "iconoir-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuArrowLeftRight, LuUsers } from "react-icons/lu"

import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { useGetNavigator } from "@/api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { NavigatorEntityFormatted } from "@/api/indexer/navigators/useNavigators"
import { AddressIcon } from "@/components/AddressIcon"
import { BaseModal } from "@/components/BaseModal"
import { VOT3Icon } from "@/components/Icons/VOT3Icon"
import { handleAmountInput } from "@/components/PowerUpModal/utils"
import { useDelegateToNavigator } from "@/hooks/navigator/useDelegateToNavigator"
import { useIncreaseDelegation } from "@/hooks/navigator/useIncreaseDelegation"
import { useSwitchNavigator } from "@/hooks/navigator/useSwitchNavigator"
import { useReduceDelegation, useUndelegate } from "@/hooks/navigator/useUndelegateFromNavigator"
import { useGetVot3UnlockedBalance } from "@/hooks/useGetVot3UnlockedBalance"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

const formatter = getCompactFormatter(2)

/** Minimum delegated VOT3 (human units); matches on-chain MIN_DELEGATION (1 ether). */
const MIN_DELEGATION = 1

type DelegationMode = "new" | "manage" | "switch"

type Props = {
  isOpen: boolean
  onClose: () => void
  navigator: NavigatorEntityFormatted
  exitMode?: boolean
}

export const DelegationModal = ({ isOpen, onClose, navigator: nav, exitMode = false }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const { data: vot3Balance, isLoading: balanceLoading } = useGetVot3UnlockedBalance(account?.address)
  const { data: domainData } = useVechainDomain(nav.address)
  const { data: isDelegated } = useIsDelegated(account?.address)
  const { data: currentNavigator } = useGetNavigator(account?.address)
  const { data: currentDelegation } = useGetDelegatedAmount(account?.address)

  const [amount, setAmount] = useState("")
  const [ackAll, setAckAll] = useState(false)

  const currentDelegatedNum = currentDelegation ? Number(currentDelegation.scaled) : 0
  const isDelegatedHere = isDelegated && currentNavigator?.toLowerCase() === nav.address.toLowerCase()

  const mode: DelegationMode = useMemo(() => {
    if (!isDelegated) return "new"
    if (isDelegatedHere) return "manage"
    return "switch"
  }, [isDelegated, isDelegatedHere])

  useEffect(() => {
    if (!isOpen) return
    setAckAll(false)

    if (mode === "manage") {
      setAmount(exitMode ? "0" : currentDelegatedNum.toString())
    } else {
      setAmount("")
    }
  }, [isOpen, mode, exitMode, currentDelegatedNum])

  const displayName = domainData?.domain ? humanDomain(domainData.domain, 15, 10) : humanAddress(nav.address, 6, 4)
  const balanceNum = vot3Balance ? Number(vot3Balance.scaled) : 0
  const availableBalance = vot3Balance?.scaled ?? "0"
  const amountNum = Number(amount) || 0

  // --- Capacity & validation per mode ---

  const capacityNum =
    mode === "manage"
      ? // User's own delegation is part of totalDelegated, so add it back
        Number(nav.stakeFormatted) * 10 - Number(nav.totalDelegatedFormatted) + currentDelegatedNum
      : Number(nav.stakeFormatted) * 10 - Number(nav.totalDelegatedFormatted)

  const remainingCapacity = Math.max(0, capacityNum)

  // For switch, undelegating frees currentDelegatedNum back into usable balance
  const effectiveBalance = mode === "switch" ? balanceNum + currentDelegatedNum : balanceNum
  const maxAmount =
    mode === "manage"
      ? Math.min(currentDelegatedNum + balanceNum, remainingCapacity)
      : Math.min(effectiveBalance, remainingCapacity)

  const exceedsCapacity = amountNum > remainingCapacity
  const exceedsBalance =
    mode === "manage"
      ? amountNum - currentDelegatedNum > balanceNum && amountNum > currentDelegatedNum
      : amountNum > effectiveBalance

  /** Must be 0 (full exit) or >= 1 VOT3; values in (0, 1) are invalid on-chain for manage. */
  const violatesMinDelegation = amountNum > 0 && amountNum < MIN_DELEGATION

  // --- Mode-specific validation ---

  const manageValidation = useMemo(() => {
    if (mode !== "manage")
      return { delta: 0, isIncreasing: false, isDecreasing: false, isFullRemoval: false, hasChanged: false }
    const delta = amountNum - currentDelegatedNum
    return {
      delta,
      isIncreasing: delta > 0,
      isDecreasing: delta < 0,
      isFullRemoval: amountNum === 0 && currentDelegatedNum > 0,
      hasChanged: delta !== 0,
    }
  }, [mode, amountNum, currentDelegatedNum])

  const isValid = useMemo(() => {
    if (exceedsCapacity || exceedsBalance || violatesMinDelegation) return false

    if (mode === "new" || mode === "switch") {
      if (!amount || amount === "." || amountNum === 0) return false
      if (mode === "new") {
        return ackAll
      }
      return true
    }

    return manageValidation.hasChanged && amountNum >= 0
  }, [
    mode,
    amount,
    amountNum,
    exceedsCapacity,
    exceedsBalance,
    violatesMinDelegation,
    ackAll,
    manageValidation.hasChanged,
  ])

  // --- Transaction hooks ---

  const { sendTransaction: sendDelegate } = useDelegateToNavigator({ onSuccess: onClose })
  const { sendTransaction: sendIncrease } = useIncreaseDelegation({ onSuccess: onClose })
  const { sendTransaction: sendReduce } = useReduceDelegation({ onSuccess: onClose })
  const { sendTransaction: sendUndelegate } = useUndelegate({ onSuccess: onClose })
  const { sendTransaction: sendSwitch } = useSwitchNavigator({ onSuccess: onClose })

  const handleSubmit = useCallback(() => {
    if (!isValid) return

    if (mode === "new") {
      sendDelegate({ navigatorAddress: nav.address, amount })
    } else if (mode === "switch") {
      sendSwitch({ navigatorAddress: nav.address, amount })
    } else {
      if (manageValidation.isFullRemoval) {
        sendUndelegate({})
      } else if (manageValidation.isDecreasing) {
        sendReduce({ amount: Math.abs(manageValidation.delta).toString() })
      } else if (manageValidation.isIncreasing) {
        sendIncrease({ amount: manageValidation.delta.toString() })
      }
    }
  }, [
    isValid,
    mode,
    amount,
    nav.address,
    manageValidation,
    sendDelegate,
    sendSwitch,
    sendUndelegate,
    sendReduce,
    sendIncrease,
  ])

  // --- Derived display values ---

  const title: string = useMemo(() => {
    if (mode === "switch") return t("Switch Navigator") as string
    if (mode === "manage") return exitMode ? t("Exit Delegation") : t("Manage Delegation")
    return t("Delegate to Navigator")
  }, [mode, exitMode, t]) as string

  const buttonLabel = useMemo(() => {
    if (mode === "new") return t("Delegate {{amount}} VOT3", { amount: formatter.format(amountNum) })
    if (mode === "switch") return t("Switch & Delegate {{amount}} VOT3", { amount: formatter.format(amountNum) })
    if (manageValidation.isFullRemoval) return t("Exit delegation")
    if (manageValidation.isDecreasing)
      return t("Reduce by {{amount}} VOT3", { amount: formatter.format(Math.abs(manageValidation.delta)) })
    if (manageValidation.isIncreasing)
      return t("Add {{amount}} VOT3", { amount: formatter.format(manageValidation.delta) })
    return t("No changes")
  }, [mode, amountNum, manageValidation, t])

  const buttonVariant =
    mode === "manage" && (manageValidation.isDecreasing || manageValidation.isFullRemoval) ? "negative" : "primary"

  const isAtCapacity = Number(nav.stakeFormatted) * 10 <= Number(nav.totalDelegatedFormatted)
  const showCapacityWarning =
    mode === "manage"
      ? isAtCapacity && !manageValidation.isDecreasing && !manageValidation.isFullRemoval
      : remainingCapacity <= 0

  const summaryColor =
    mode === "manage" && (manageValidation.isDecreasing || manageValidation.isFullRemoval)
      ? "status.negative"
      : "status.positive"

  const inputLabel = mode === "manage" ? t("New delegation amount") : t("VOT3 to delegate")
  const navInfoValue =
    mode === "manage"
      ? { label: t("Your delegated VOT3"), value: formatter.format(currentDelegatedNum) }
      : { label: t("B3TR staked"), value: formatter.format(Number(nav.stakeFormatted)) }

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={onClose}
      showCloseButton
      modalProps={{ closeOnInteractOutside: true }}>
      <VStack gap={5} align="stretch" w="full">
        <Heading size="xl" fontWeight="bold">
          {title}
        </Heading>

        {/* Switch warning */}
        {mode === "switch" && (
          <Card.Root
            w="full"
            p={3}
            bg="status.warning.subtle"
            border="1px solid"
            borderColor="status.warning.strong"
            rounded="xl">
            <HStack gap={3} align="flex-start">
              <Icon as={LuArrowLeftRight} boxSize="5" color="status.warning.strong" mt="0.5" flexShrink={0} />
              <Text textStyle="xs" color="status.warning.strong" fontWeight="semibold">
                {t(
                  "You are currently delegating {{amount}} VOT3 to another navigator. Switching will undelegate from your current navigator and delegate to this one in a single transaction.",
                  { amount: formatter.format(currentDelegatedNum) },
                )}
              </Text>
            </HStack>
          </Card.Root>
        )}

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
              {navInfoValue.value}
            </Text>
            <Text textStyle="xs" color="fg.muted">
              {navInfoValue.label}
            </Text>
          </VStack>
        </HStack>

        {/* Capacity warning */}
        {showCapacityWarning && (
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

        {/* Amount input — hidden in exit mode since we undelegate everything */}
        {!exitMode && (
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
              invalid={!!amount && amount !== "." && (exceedsBalance || exceedsCapacity || violatesMinDelegation)}>
              <Field.Label w="full" alignItems="center" justifyContent="space-between">
                <Text textStyle="sm" color="text.subtle">
                  {inputLabel}
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
                    min={mode === "manage" ? 0 : MIN_DELEGATION}
                    value={amount}
                    onValueChange={details => setAmount(handleAmountInput(details.value))}>
                    <NumberInput.Input
                      min={mode === "manage" ? 0 : MIN_DELEGATION}
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
                    {violatesMinDelegation
                      ? t("Minimum delegation is 1 VOT3. Set to 0 to fully exit.")
                      : exceedsCapacity
                        ? t("Exceeds navigator capacity. Max: {{max}} VOT3", {
                            max: formatter.format(remainingCapacity),
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
                      {t("Available: {{amount}}", { amount: formatter.format(Number(availableBalance)) })}
                    </Text>
                  </Skeleton>
                </VStack>
              </HStack>
            </Field.Root>
          </VStack>
        )}

        {/* Summary card */}
        {mode === "manage" ? (
          <ManageSummary
            hasChanged={manageValidation.hasChanged}
            delta={manageValidation.delta}
            isDecreasing={manageValidation.isDecreasing}
            isFullRemoval={manageValidation.isFullRemoval}
            summaryColor={summaryColor}
            currentDelegatedNum={currentDelegatedNum}
            maxCapacity={remainingCapacity}
            newAmountNum={amountNum}
            isValid={isValid}
          />
        ) : (
          <NewDelegationSummary
            amountNum={amountNum}
            totalDelegatedToNav={Number(nav.totalDelegatedFormatted)}
            currentDelegationNum={currentDelegatedNum}
            remainingCapacity={remainingCapacity}
            isSwitch={mode === "switch"}
          />
        )}

        {/* Acknowledgment for first-time delegators */}
        {mode === "new" && (
          <VStack gap={3} align="stretch" w="full">
            <Card.Root w="full" p={4} bg="card.default" border="1px solid" borderColor="border.secondary" rounded="xl">
              <VStack align="start" gap={2}>
                <Text textStyle="xs" fontWeight="semibold">
                  {t("By delegating, you agree that:")}
                </Text>
                <VStack align="start" gap={1.5} pl={1}>
                  <HStack gap={2} align="flex-start">
                    <Text textStyle="xs" color="fg.muted" flexShrink={0}>
                      {"1."}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {t("The navigator votes on your behalf. You cannot vote manually while delegated.")}
                    </Text>
                  </HStack>
                  <HStack gap={2} align="flex-start">
                    <Text textStyle="xs" color="fg.muted" flexShrink={0}>
                      {"2."}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {t("Your delegated VOT3 is locked until you undelegate. It never leaves your wallet.")}
                    </Text>
                  </HStack>
                  <HStack gap={2} align="flex-start">
                    <Text textStyle="xs" color="fg.muted" flexShrink={0}>
                      {"3."}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {t("The navigator receives 20% of your earned rewards as a fee.")}
                    </Text>
                  </HStack>
                  <HStack gap={2} align="flex-start">
                    <Text textStyle="xs" color="fg.muted" flexShrink={0}>
                      {"4."}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {t(
                        "You must remain eligible for voting (e.g. by performing sustainable actions) or your vote will be skipped.",
                      )}
                    </Text>
                  </HStack>
                </VStack>
              </VStack>
            </Card.Root>

            <Checkbox.Root
              checked={ackAll}
              onCheckedChange={e => setAckAll(!!e.checked)}
              colorPalette="blue"
              alignItems="flex-start"
              gap={3}
              pl={5}>
              <Checkbox.HiddenInput />
              <Checkbox.Control mt="0.5" />
              <Checkbox.Label>
                <Text textStyle="xs" fontWeight="semibold">
                  {t("I understand and agree to the above")}
                </Text>
              </Checkbox.Label>
            </Checkbox.Root>
          </VStack>
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

// --- Sub-components ---

type NewDelegationSummaryProps = {
  amountNum: number
  totalDelegatedToNav: number
  currentDelegationNum: number
  remainingCapacity: number
  isSwitch: boolean
}

const NewDelegationSummary = ({
  amountNum,
  totalDelegatedToNav,
  currentDelegationNum,
  remainingCapacity,
  isSwitch,
}: NewDelegationSummaryProps) => {
  const { t } = useTranslation()

  return (
    <Card.Root
      w="full"
      p={4}
      bg="status.positive.subtle"
      border="1px solid"
      borderColor="status.positive.strong"
      rounded="2xl">
      <VStack align="start" gap={2}>
        <Text textStyle="xs" color="text.subtle" fontStyle="italic">
          {t("Voting Power delegated from next round")}
        </Text>

        <Text textStyle="3xl" fontWeight="bold" color="status.positive.strong">
          {"+"}
          {formatter.format(amountNum)}
          {" VOT3"}
        </Text>

        <Separator w="full" borderColor="status.positive.strong/30" />
        <VStack align="start" gap={1} w="full">
          <HStack w="full" justifyContent="space-between">
            <Text textStyle="xs" color="text.subtle">
              {t("Currently delegated to navigator")}
            </Text>
            <Text textStyle="xs" fontWeight="semibold">
              {formatter.format(totalDelegatedToNav)} {"VOT3"}
            </Text>
          </HStack>
          {isSwitch && currentDelegationNum > 0 && (
            <HStack w="full" justifyContent="space-between">
              <Text textStyle="xs" color="text.subtle">
                {t("Your current delegation (will be moved)")}
              </Text>
              <Text textStyle="xs" fontWeight="semibold">
                {formatter.format(currentDelegationNum)} {"VOT3"}
              </Text>
            </HStack>
          )}
          <HStack w="full" justifyContent="space-between">
            <Text textStyle="xs" color="text.subtle">
              {t("Navigator capacity remaining")}
            </Text>
            <Text textStyle="xs" fontWeight="semibold">
              {formatter.format(remainingCapacity)} {"VOT3"}
            </Text>
          </HStack>
        </VStack>
      </VStack>
    </Card.Root>
  )
}

type ManageSummaryProps = {
  hasChanged: boolean
  delta: number
  isDecreasing: boolean
  isFullRemoval: boolean
  summaryColor: string
  currentDelegatedNum: number
  maxCapacity: number
  newAmountNum: number
  isValid: boolean
}

const ManageSummary = ({
  hasChanged,
  delta,
  isDecreasing,
  isFullRemoval,
  summaryColor,
  currentDelegatedNum,
  maxCapacity,
  newAmountNum,
  isValid,
}: ManageSummaryProps) => {
  const { t } = useTranslation()

  return (
    <>
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

            <Separator w="full" borderColor={`${summaryColor}.strong/30`} />
            <VStack align="start" gap={1} w="full">
              <HStack w="full" justifyContent="space-between">
                <Text textStyle="xs" color="text.subtle">
                  {t("Your current delegation")}
                </Text>
                <Text textStyle="xs" fontWeight="semibold">
                  {formatter.format(currentDelegatedNum)} {"→"} {formatter.format(newAmountNum)} {"VOT3"}
                </Text>
              </HStack>
              <HStack w="full" justifyContent="space-between">
                <Text textStyle="xs" color="text.subtle">
                  {t("Navigator capacity remaining")}
                </Text>
                <Text textStyle="xs" fontWeight="semibold">
                  {formatter.format(Math.max(0, maxCapacity - newAmountNum))} {"VOT3"}
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Card.Root>
      )}

      {isValid && (
        <Card.Root w="full" p={3} bg="card.default" border="1px solid" borderColor="border.secondary" rounded="xl">
          <VStack gap={3} align="stretch">
            {(isDecreasing || isFullRemoval) && (
              <HStack gap={3} align="flex-start">
                <Icon as={InfoCircle} boxSize="5" color="text.subtle" mt="0.5" flexShrink={0} />
                <Text textStyle="xs" color="text.subtle">
                  {t(
                    "Your VOT3 tokens will be immediately unlocked in your wallet and can be used to delegate to another navigator or convert back to B3TR.",
                  )}
                </Text>
              </HStack>
            )}
            <HStack gap={3} align="flex-start">
              <Icon as={InfoCircle} boxSize="5" color="text.subtle" mt="0.5" flexShrink={0} />
              <Text textStyle="xs" color="text.subtle">
                {t(
                  "Changes take effect at the start of the next round. Until then, your current delegation remains active for voting and rewards.",
                )}
              </Text>
            </HStack>
          </VStack>
        </Card.Root>
      )}
    </>
  )
}
