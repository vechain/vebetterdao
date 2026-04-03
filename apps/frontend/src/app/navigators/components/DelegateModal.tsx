import { Button, Card, Heading, HStack, Input, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter, humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain, useWallet } from "@vechain/vechain-kit"
import { useCallback, useState } from "react"
import { LuCircleAlert, LuInfo, LuShield, LuUsers } from "react-icons/lu"

import { NavigatorEntityFormatted } from "@/api/indexer/navigators/useNavigators"
import { AddressIcon } from "@/components/AddressIcon"
import { BaseModal } from "@/components/BaseModal"
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
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()
  const { data: vot3Balance, isLoading: balanceLoading } = useGetVot3Balance(account?.address)
  const { data: domainData } = useVechainDomain(nav.address)
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<1 | 2>(1)

  const displayName = domainData?.domain ? humanDomain(domainData.domain, 15, 10) : humanAddress(nav.address, 6, 4)
  const balanceNum = vot3Balance ? Number(vot3Balance.scaled) : 0
  const amountNum = Number(amount) || 0

  // Capacity: stake * 10 - totalDelegated
  const capacityNum = Number(nav.stakeFormatted) * 10 - Number(nav.totalDelegatedFormatted)
  const remainingCapacity = Math.max(0, capacityNum)
  const maxDelegation = Math.min(balanceNum, remainingCapacity)
  const exceedsCapacity = amountNum > remainingCapacity
  const isAmountValid = amountNum > 0 && amountNum <= balanceNum && !exceedsCapacity

  const handleSuccess = useCallback(() => {
    setAmount("")
    setStep(1)
    onClose()
  }, [onClose])

  const { sendTransaction } = useDelegateToNavigator({ onSuccess: handleSuccess })

  const handleDelegate = useCallback(() => {
    if (!isAmountValid) return
    sendTransaction({ navigatorAddress: nav.address, amount })
  }, [isAmountValid, sendTransaction, nav.address, amount])

  const handleClose = useCallback(() => {
    setAmount("")
    setStep(1)
    onClose()
  }, [onClose])

  const handleSetMax = useCallback(() => {
    setAmount(maxDelegation.toString())
  }, [maxDelegation])

  return (
    <BaseModal isOpen={isOpen && !isTxModalOpen} onClose={handleClose} showCloseButton>
      {step === 1 ? (
        <VStack gap={6} align="stretch" w="full">
          <Heading size="xl" fontWeight="bold">
            {"Delegate to Navigator"}
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
                    {formatter.format(Number(nav.stakeFormatted))}
                  </Text>
                  <Text textStyle="xs" color="fg.muted">
                    {"B3TR staked"}
                  </Text>
                </VStack>
              </HStack>
            </Card.Body>
          </Card.Root>

          {/* Amount input */}
          <VStack gap={2} align="stretch">
            <HStack justify="space-between">
              <Text textStyle="sm" fontWeight="semibold">
                {"VOT3 amount to delegate"}
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
              value={amount}
              onChange={e => setAmount(e.target.value)}
              size="lg"
            />
            <HStack justify="space-between">
              <Text textStyle="xs" color="fg.muted">
                {"Navigator capacity: "}
                {formatter.format(remainingCapacity)}
                {" VOT3"}
              </Text>
            </HStack>
            {amountNum > balanceNum && (
              <HStack gap={1} color="red.500">
                <LuCircleAlert size={14} />
                <Text textStyle="xs">{"Insufficient VOT3 balance"}</Text>
              </HStack>
            )}
            {exceedsCapacity && amountNum <= balanceNum && (
              <HStack gap={1} color="red.500">
                <LuCircleAlert size={14} />
                <Text textStyle="xs">
                  {"Exceeds navigator capacity. Max: "}
                  {formatter.format(remainingCapacity)}
                  {" VOT3"}
                </Text>
              </HStack>
            )}
          </VStack>

          <Button variant="primary" w="full" onClick={() => setStep(2)} disabled={!isAmountValid} size="lg">
            {"Continue"}
          </Button>
        </VStack>
      ) : (
        <VStack gap={5} align="stretch" w="full">
          <Heading size="xl" fontWeight="bold">
            {"Confirm Delegation"}
          </Heading>

          <Text textStyle="sm" color="fg.muted">
            {"You are about to delegate "}
            <Text as="span" fontWeight="bold" color="fg.default">
              {formatter.format(amountNum)}
              {" VOT3"}
            </Text>
            {" to "}
            <Text as="span" fontWeight="bold" color="fg.default">
              {displayName}
            </Text>
            {". Please review what this means:"}
          </Text>

          {/* Consequences */}
          <VStack gap={3} align="stretch">
            <Card.Root variant="outline" borderRadius="lg">
              <Card.Body py={3}>
                <HStack gap={3} align="start">
                  <LuShield size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                  <VStack gap={1} align="start">
                    <Text textStyle="sm" fontWeight="semibold">
                      {"Navigator votes on your behalf"}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {
                        "The navigator will choose which apps to vote for in allocation rounds and how to vote on governance proposals. You cannot vote manually while delegated."
                      }
                    </Text>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root variant="outline" borderRadius="lg">
              <Card.Body py={3}>
                <HStack gap={3} align="start">
                  <LuInfo size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                  <VStack gap={1} align="start">
                    <Text textStyle="sm" fontWeight="semibold">
                      {"Delegated VOT3 is locked"}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {
                        "The delegated portion of your VOT3 cannot be transferred or converted back to B3TR. Your remaining VOT3 stays free to move. Your VOT3 never leaves your wallet."
                      }
                    </Text>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root variant="outline" borderRadius="lg">
              <Card.Body py={3}>
                <HStack gap={3} align="start">
                  <LuInfo size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                  <VStack gap={1} align="start">
                    <Text textStyle="sm" fontWeight="semibold">
                      {"Only delegated amount earns rewards"}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {
                        "Your voting power equals the delegated amount only (not your full balance). Non-delegated VOT3 does not participate in voting or earn rewards."
                      }
                    </Text>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root variant="outline" borderRadius="lg">
              <Card.Body py={3}>
                <HStack gap={3} align="start">
                  <LuInfo size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                  <VStack gap={1} align="start">
                    <Text textStyle="sm" fontWeight="semibold">
                      {"20% navigator fee on rewards"}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {
                        "The navigator receives 20% of your earned rewards as a fee. This is deducted automatically when rewards are claimed."
                      }
                    </Text>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>

            <Card.Root variant="outline" borderRadius="lg">
              <Card.Body py={3}>
                <HStack gap={3} align="start">
                  <LuInfo size={18} style={{ marginTop: 2, flexShrink: 0 }} />
                  <VStack gap={1} align="start">
                    <Text textStyle="sm" fontWeight="semibold">
                      {"You can undelegate anytime"}
                    </Text>
                    <Text textStyle="xs" color="fg.muted">
                      {
                        "You can reduce or fully remove your delegation at any time. Changes take effect at the start of the next round. If the navigator exits, your VOT3 is automatically unlocked."
                      }
                    </Text>
                  </VStack>
                </HStack>
              </Card.Body>
            </Card.Root>
          </VStack>

          <HStack gap={4} w="full">
            <Button variant="outline" flex={1} onClick={() => setStep(1)} size="lg">
              {"Back"}
            </Button>
            <Button variant="primary" flex={1} onClick={handleDelegate} size="lg">
              {"Delegate "}
              {formatter.format(amountNum)}
              {" VOT3"}
            </Button>
          </HStack>
        </VStack>
      )}
    </BaseModal>
  )
}
