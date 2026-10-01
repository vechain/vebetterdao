"use client"
import { Button, Card, Heading, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { compareAddresses } from "@repo/utils/AddressUtils"
import { humanAddress } from "@repo/utils/FormattingUtils"
import { useUpgradeSmartAccountModal, useWallet } from "@vechain/vechain-kit"
import { ZeroAddress } from "ethers"
import { useTranslation } from "react-i18next"

import { useVot3Delegates } from "@/api/contracts/vot3/hooks/useVot3Delegates"
import { MotionVStack } from "@/components/MotionVStack"
import { NotConnectedWallet } from "@/components/NotConnectedWallet"
import { useDelegateVot3 } from "@/hooks/useDelegateVot3"
import { useGetVot3Balance } from "@/hooks/useGetVot3Balance"
import { useSmartAccountUpgradeRequired } from "@/hooks/vechainKitHooks/useSmartAccountUpgradeRequired"

export default function DelegatePage() {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: delegatee, isSuccess, isLoading } = useVot3Delegates(account?.address)
  const { data: vot3Balance } = useGetVot3Balance(account?.address)
  const { sendTransaction, status } = useDelegateVot3()
  const isSmartAccountUpgradeRequired = useSmartAccountUpgradeRequired()
  const { open: openUpgradeModal } = useUpgradeSmartAccountModal({ accentColor: "#004CFC" })

  if (!account?.address) {
    return (
      <MotionVStack>
        <NotConnectedWallet />
      </MotionVStack>
    )
  }

  // VOT3 only checkpoints voting power for accounts with a delegatee; zero address means power is not tracked
  const isNotDelegated = isSuccess && compareAddresses(delegatee, ZeroAddress)
  const isSelfDelegated = isSuccess && compareAddresses(delegatee, account.address)
  const isSubmitting = status === "pending" || status === "waitingConfirmation"

  const onActivate = () => {
    if (isSmartAccountUpgradeRequired) return openUpgradeModal()
    sendTransaction()
  }

  return (
    <MotionVStack>
      <VStack w="full" maxW="md" mx="auto" gap={6} py={{ base: 6, md: 10 }} align="stretch">
        <VStack gap={2} align="start">
          <Heading size={{ base: "xl", md: "2xl" }}>{t("Activate voting power")}</Heading>
          <Text textStyle="sm" color="text.subtle">
            {t(
              "Your VOT3 counts as voting power only after it is delegated to your own address. If your voting power shows 0 while you hold VOT3, activate it here.",
            )}
          </Text>
        </VStack>
        <Card.Root variant="outline" w="full" p={{ base: 4, md: 6 }} rounded="xl">
          <VStack gap={4} align="stretch">
            <HStack justify="space-between">
              <Text textStyle="sm" color="text.subtle">
                {t("VOT3 balance")}
              </Text>
              <Skeleton loading={!vot3Balance}>
                <Text textStyle="sm" fontWeight="semibold">
                  {vot3Balance?.formatted ?? "0"}
                </Text>
              </Skeleton>
            </HStack>
            <HStack justify="space-between">
              <Text textStyle="sm" color="text.subtle">
                {t("Delegated to")}
              </Text>
              <Skeleton loading={isLoading}>
                <Text textStyle="sm" fontWeight="semibold">
                  {isNotDelegated
                    ? t("Not delegated")
                    : isSelfDelegated
                      ? t("Yourself")
                      : humanAddress(delegatee ?? "", 6, 4)}
                </Text>
              </Skeleton>
            </HStack>
          </VStack>
        </Card.Root>
        {isSelfDelegated && (
          <Text textStyle="sm" color="status.positive.strong" textAlign="center">
            {t("Your voting power is active.")}
          </Text>
        )}
        {isSuccess && !isSelfDelegated && !isNotDelegated && (
          <Text textStyle="sm" color="text.subtle" textAlign="center">
            {t("Your VOT3 voting power is delegated to another address.")}
          </Text>
        )}
        {(!isSuccess || isNotDelegated) && (
          <VStack gap={2} align="stretch">
            <Button
              variant="primary"
              size="lg"
              w="full"
              onClick={onActivate}
              loading={isSubmitting}
              disabled={!isSuccess}>
              {t("Activate voting power")}
            </Button>
            <Text textStyle="xs" color="text.subtle" textAlign="center">
              {t("Voting power is taken at each round snapshot, so it will count from the next round.")}
            </Text>
          </VStack>
        )}
      </VStack>
    </MotionVStack>
  )
}
