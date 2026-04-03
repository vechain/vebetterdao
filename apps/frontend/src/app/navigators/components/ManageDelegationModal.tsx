import { Button, Card, Heading, HStack, Input, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useCallback, useEffect, useState } from "react"
import { LuCircleAlert, LuInfo, LuUsers } from "react-icons/lu"

import { useGetDelegatedAmount } from "@/api/contracts/navigatorRegistry/hooks/useGetDelegatedAmount"
import { NavigatorEntityFormatted } from "@/api/indexer/navigators/useNavigators"
import { AddressIcon } from "@/components/AddressIcon"
import { BaseModal } from "@/components/BaseModal"
import { useDelegateToNavigator } from "@/hooks/navigator/useDelegateToNavigator"
import { useReduceDelegation, useUndelegate } from "@/hooks/navigator/useUndelegateFromNavigator"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

const formatter = getCompactFormatter(2)

type Props = {
  isOpen: boolean
  onClose: () => void
  navigator: NavigatorEntityFormatted
}

export const ManageDelegationModal = ({ isOpen, onClose, navigator: nav }: Props) => {
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const { data: vot3Balance, isLoading: balanceLoading } = useGetVot3Balance(account?.address)
  const { data: domainData } = useVechainDomain(nav.address)
  const { data: currentDelegation } = useGetDelegatedAmount(account?.address)
  const [newAmount, setNewAmount] = useState("")

  const currentDelegatedNum = currentDelegation ? Number(currentDelegation.scaled) : 0
  const displayName = domainData?.domain ? humanDomain(domainData.domain, 15, 10) : humanAddress(nav.address, 6, 4)
  const balanceNum = vot3Balance ? Number(vot3Balance.scaled) : 0
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

  const exceedsCapacity = newAmountNum > maxCapacity
  const exceedsBalance = isIncreasing && delta > balanceNum

  const isValid = hasChanged && !exceedsCapacity && !exceedsBalance && newAmountNum >= 0

  useEffect(() => {
    if (isOpen) setNewAmount(currentDelegatedNum.toString())
  }, [isOpen, currentDelegatedNum])

  const handleSuccess = useCallback(() => {
    setNewAmount("")
    onClose()
  }, [onClose])

  const { sendTransaction: sendDelegate } = useDelegateToNavigator({ onSuccess: handleSuccess })
  const { sendTransaction: sendReduce } = useReduceDelegation({ onSuccess: handleSuccess })
  const { sendTransaction: sendUndelegate } = useUndelegate({ onSuccess: handleSuccess })

  const handleSubmit = useCallback(() => {
    if (!isValid) return

    if (isFullRemoval) {
      sendUndelegate({})
    } else if (isDecreasing) {
      sendReduce({ amount: Math.abs(delta).toString() })
    } else if (isIncreasing) {
      sendDelegate({ navigatorAddress: nav.address, amount: delta.toString() })
    }
  }, [isValid, isFullRemoval, isDecreasing, isIncreasing, delta, sendUndelegate, sendReduce, sendDelegate, nav.address])

  const handleClose = useCallback(() => {
    setNewAmount("")
    onClose()
  }, [onClose])

  const handleSetMax = useCallback(() => {
    setNewAmount(maxNewAmount.toString())
  }, [maxNewAmount])

  const getButtonLabel = () => {
    if (isFullRemoval) return "Remove all delegation"
    if (isDecreasing) return `Reduce by ${formatter.format(Math.abs(delta))} VOT3`
    if (isIncreasing) return `Add ${formatter.format(delta)} VOT3`
    return "No changes"
  }

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={handleClose} showCloseButton>
      <VStack gap={6} align="stretch" w="full">
        <Heading size="xl" fontWeight="bold">
          {"Manage Delegation"}
        </Heading>

        {/* Navigator info */}
        <Card.Root variant="outline" borderRadius="xl">
          <Card.Body py={3}>
            <HStack gap={3}>
              <AddressIcon address={nav.address} boxSize={10} borderRadius="full" />
              <VStack gap={0} align="start" flex={1}>
                <Text textStyle="sm" fontWeight="semibold">
                  {displayName}
                </Text>
                <HStack gap={2}>
                  <LuUsers size={12} />
                  <Text textStyle="xs" color="fg.muted">
                    {nav.citizenCount}
                    {" citizens"}
                  </Text>
                </HStack>
              </VStack>
              <VStack gap={0} align="end">
                <Text textStyle="sm" fontWeight="bold">
                  {formatter.format(currentDelegatedNum)}
                </Text>
                <Text textStyle="xs" color="fg.muted">
                  {"VOT3 delegated"}
                </Text>
              </VStack>
            </HStack>
          </Card.Body>
        </Card.Root>

        {/* Amount input */}
        <VStack gap={2} align="stretch">
          <HStack justify="space-between">
            <Text textStyle="sm" fontWeight="semibold">
              {"New delegation amount"}
            </Text>
            <Skeleton loading={balanceLoading}>
              <HStack gap={1}>
                <Text textStyle="xs" color="fg.muted">
                  {"Balance: "}
                  {formatter.format(balanceNum)}
                </Text>
                <Button size="xs" variant="ghost" onClick={handleSetMax}>
                  {"MAX"}
                </Button>
              </HStack>
            </Skeleton>
          </HStack>
          <Input
            type="number"
            placeholder="0.00"
            value={newAmount}
            onChange={e => setNewAmount(e.target.value)}
            size="lg"
          />

          {/* Delta summary */}
          {hasChanged && !exceedsCapacity && !exceedsBalance && (
            <Text textStyle="xs" color={isIncreasing ? "green.500" : "red.500"}>
              {isFullRemoval
                ? "Full removal — your VOT3 will be unlocked"
                : isDecreasing
                  ? `Reducing by ${formatter.format(Math.abs(delta))} VOT3`
                  : `Adding ${formatter.format(delta)} VOT3`}
            </Text>
          )}

          <HStack justify="space-between">
            <Text textStyle="xs" color="fg.muted">
              {"Navigator capacity: "}
              {formatter.format(maxCapacity)}
              {" VOT3"}
            </Text>
          </HStack>

          {exceedsBalance && (
            <HStack gap={1} color="red.500">
              <LuCircleAlert size={14} />
              <Text textStyle="xs">{"Insufficient VOT3 balance"}</Text>
            </HStack>
          )}
          {exceedsCapacity && !exceedsBalance && (
            <HStack gap={1} color="red.500">
              <LuCircleAlert size={14} />
              <Text textStyle="xs">
                {"Exceeds navigator capacity. Max: "}
                {formatter.format(maxCapacity)}
                {" VOT3"}
              </Text>
            </HStack>
          )}
        </VStack>

        {/* Info callout */}
        <Card.Root variant="outline" borderRadius="lg">
          <Card.Body py={3}>
            <HStack gap={2} align="start">
              <LuInfo size={16} style={{ marginTop: 2, flexShrink: 0 }} />
              <Text textStyle="xs" color="fg.muted">
                {
                  "Changes take effect at the start of the next round. Until then, your current delegation remains active for voting and rewards."
                }
              </Text>
            </HStack>
          </Card.Body>
        </Card.Root>

        <Button
          colorPalette={isDecreasing || isFullRemoval ? "red" : "green"}
          w="full"
          onClick={handleSubmit}
          disabled={!isValid}
          size="lg">
          {getButtonLabel()}
        </Button>
      </VStack>
    </BaseModal>
  )
}
