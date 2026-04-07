import {
  Button,
  Card,
  Checkbox,
  Field,
  Heading,
  HStack,
  Icon,
  NumberInput,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { WarningTriangle } from "iconoir-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuUsers } from "react-icons/lu"

import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { useIsDelegated } from "@/api/contracts/navigatorRegistry/hooks/useIsDelegated"
import { NavigatorEntityFormatted } from "@/api/indexer/navigators/useNavigators"
import { AddressIcon } from "@/components/AddressIcon"
import { BaseModal } from "@/components/BaseModal"
import { VOT3Icon } from "@/components/Icons/VOT3Icon"
import { handleAmountInput } from "@/components/PowerUpModal/utils"
import { useDelegateToNavigator } from "@/hooks/navigator/useDelegateToNavigator"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

const formatter = getCompactFormatter(2)

type Props = {
  isOpen: boolean
  onClose: () => void
  navigator: NavigatorEntityFormatted
}

export const DelegateModal = ({ isOpen, onClose, navigator: nav }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const { data: vot3Balance, isLoading: balanceLoading } = useGetVot3Balance(account?.address)
  const { data: domainData } = useVechainDomain(nav.address)
  const { data: isDelegated } = useIsDelegated(account?.address)
  const { data: currentDelegation } = useGetDelegatedAmount(account?.address)
  const [amount, setAmount] = useState("")
  const [ackVoting, setAckVoting] = useState(false)
  const [ackLocked, setAckLocked] = useState(false)
  const [ackFee, setAckFee] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setAmount("")
      setAckVoting(false)
      setAckLocked(false)
      setAckFee(false)
    }
  }, [isOpen])

  const displayName = domainData?.domain ? humanDomain(domainData.domain, 15, 10) : humanAddress(nav.address, 6, 4)
  const balanceNum = vot3Balance ? Number(vot3Balance.scaled) : 0
  const amountNum = Number(amount) || 0
  const availableBalance = vot3Balance?.scaled ?? "0"

  // Capacity: stake * 10 - totalDelegated
  const capacityNum = Number(nav.stakeFormatted) * 10 - Number(nav.totalDelegatedFormatted)
  const remainingCapacity = Math.max(0, capacityNum)
  const maxDelegation = Math.min(balanceNum, remainingCapacity)
  const exceedsBalance = amountNum > balanceNum
  const exceedsCapacity = amountNum > remainingCapacity && !exceedsBalance
  const invalidAmount = !amount || amount === "." || amountNum === 0 || exceedsBalance || exceedsCapacity

  const isFirstTime = !isDelegated
  const allAcked = !isFirstTime || (ackVoting && ackLocked && ackFee)

  const currentDelegationNum = currentDelegation ? Number(currentDelegation.scaled) : 0
  const totalDelegatedToNav = Number(nav.totalDelegatedFormatted)

  const handleSuccess = useCallback(() => {
    onClose()
  }, [onClose])

  const { sendTransaction } = useDelegateToNavigator({ onSuccess: handleSuccess })

  const handleDelegate = useCallback(() => {
    if (invalidAmount || !allAcked) return
    sendTransaction({ navigatorAddress: nav.address, amount })
  }, [invalidAmount, allAcked, sendTransaction, nav.address, amount])

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={onClose} showCloseButton>
      <VStack gap={5} align="stretch" w="full">
        <Heading size="xl" fontWeight="bold">
          {t("Delegate to Navigator")}
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
              {formatter.format(Number(nav.stakeFormatted))}
            </Text>
            <Text textStyle="xs" color="fg.muted">
              {t("B3TR staked")}
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
          <Field.Root gap={2} required invalid={!!amount && amount !== "." && (exceedsBalance || exceedsCapacity)}>
            <Field.Label w="full" alignItems="center" justifyContent="space-between">
              <Text textStyle="sm" color="text.subtle">
                {t("VOT3 to delegate")}
              </Text>
              <Button
                variant="link"
                height="5"
                size="sm"
                p="0"
                onClick={() => setAmount(handleAmountInput(maxDelegation.toString()))}>
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
                  {exceedsCapacity
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
                    {t("Available:")} {formatter.format(Number(availableBalance))}
                  </Text>
                </Skeleton>
              </VStack>
            </HStack>
          </Field.Root>
        </VStack>

        {/* Delegation summary */}
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

            <VStack align="start" gap={0.5}>
              <HStack gap={1}>
                <Text textStyle="sm" color="text.subtle">
                  {t("Currently delegated to navigator:")}
                </Text>
                <Text textStyle="sm" fontWeight="semibold">
                  {formatter.format(totalDelegatedToNav)} {"VOT3"}
                </Text>
              </HStack>
              {currentDelegationNum > 0 && (
                <HStack gap={1}>
                  <Text textStyle="sm" color="text.subtle">
                    {t("Your current delegation:")}
                  </Text>
                  <Text textStyle="sm" fontWeight="semibold">
                    {formatter.format(currentDelegationNum)} {"VOT3"}
                  </Text>
                </HStack>
              )}
              <HStack gap={1}>
                <Text textStyle="sm" color="text.subtle">
                  {t("Navigator capacity remaining:")}
                </Text>
                <Text textStyle="sm" fontWeight="semibold">
                  {formatter.format(remainingCapacity)} {"VOT3"}
                </Text>
              </HStack>
            </VStack>
          </VStack>
        </Card.Root>

        {/* Acknowledgment checkboxes for first-time delegators */}
        {isFirstTime && (
          <VStack gap={3} align="stretch" w="full">
            <Checkbox.Root
              checked={ackVoting}
              onCheckedChange={e => setAckVoting(!!e.checked)}
              colorPalette="blue"
              alignItems="flex-start"
              gap={3}>
              <Checkbox.HiddenInput />
              <Checkbox.Control mt="1" />
              <Checkbox.Label>
                <Text textStyle="sm">
                  {t(
                    "I acknowledge that the navigator will vote on governance proposals and app allocation rounds on my behalf. I will not be able to vote manually while delegated.",
                  )}
                </Text>
              </Checkbox.Label>
            </Checkbox.Root>

            <Checkbox.Root
              checked={ackLocked}
              onCheckedChange={e => setAckLocked(!!e.checked)}
              colorPalette="blue"
              alignItems="flex-start"
              gap={3}>
              <Checkbox.HiddenInput />
              <Checkbox.Control mt="1" />
              <Checkbox.Label>
                <Text textStyle="sm">
                  {t(
                    "I acknowledge that my delegated VOT3 cannot be transferred or converted back to B3TR until I undelegate. My VOT3 never leaves my wallet.",
                  )}
                </Text>
              </Checkbox.Label>
            </Checkbox.Root>

            <Checkbox.Root
              checked={ackFee}
              onCheckedChange={e => setAckFee(!!e.checked)}
              colorPalette="blue"
              alignItems="flex-start"
              gap={3}>
              <Checkbox.HiddenInput />
              <Checkbox.Control mt="1" />
              <Checkbox.Label>
                <Text textStyle="sm">
                  {t(
                    "I acknowledge that the navigator receives 20% of my earned rewards as a fee, deducted automatically when rewards are claimed.",
                  )}
                </Text>
              </Checkbox.Label>
            </Checkbox.Root>
          </VStack>
        )}

        <VStack gap={2} mt={2} w="full">
          <Button
            variant="primary"
            w="full"
            rounded="full"
            size="lg"
            disabled={invalidAmount || !allAcked}
            onClick={handleDelegate}>
            {t("Delegate {{amount}} VOT3", { amount: formatter.format(amountNum) })}
          </Button>
          <Button variant="ghost" w="full" rounded="full" size="lg" onClick={onClose}>
            {t("Cancel")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
