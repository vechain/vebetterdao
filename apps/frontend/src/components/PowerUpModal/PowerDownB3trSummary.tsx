"use client"

import { Card, HStack, Separator, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"

type Props = {
  amount: string
  isHighlighted?: boolean
  fromBalanceWei?: bigint
  fromNavigatorWei?: bigint
  isFullyExitingDelegation?: boolean
}

const formatter = getCompactFormatter(2)

export const PowerDownB3trSummary = ({
  amount,
  isHighlighted = false,
  fromBalanceWei = 0n,
  fromNavigatorWei = 0n,
  isFullyExitingDelegation = false,
}: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: b3trBalance, isLoading } = useGetB3trBalance(account?.address ?? undefined)

  const numericAmount = Number(amount) || 0
  const currentB3tr = Number(b3trBalance?.scaled ?? "0")
  const showBreakdown = fromNavigatorWei > 0n

  return (
    <Card.Root
      w="full"
      p={4}
      bg={isHighlighted ? "status.positive.subtle" : "card.default"}
      border="1px solid"
      borderColor={isHighlighted ? "status.positive.strong" : "border.secondary"}
      rounded="2xl">
      <VStack align="start" gap={2}>
        <Text textStyle="xs" color="text.subtle" fontStyle="italic">
          {t("B3TR you'll receive immediately")}
        </Text>

        <Text textStyle="3xl" fontWeight="bold" color="status.positive.strong">
          {"+"}
          {formatter.format(numericAmount)}
          {" B3TR"}
        </Text>

        {showBreakdown && (
          <>
            <Separator w="full" borderColor="status.positive.strong/30" />
            <VStack align="start" gap={1} w="full">
              <HStack w="full" justifyContent="space-between">
                <Text textStyle="xs" color="text.subtle">
                  {t("From your balance")}
                </Text>
                <Text textStyle="xs" fontWeight="semibold">
                  {formatter.format(Number(formatEther(fromBalanceWei)))} {"VOT3"}
                </Text>
              </HStack>
              <HStack w="full" justifyContent="space-between">
                <Text textStyle="xs" color="text.subtle">
                  {t("From navigator delegation")}
                </Text>
                <Text textStyle="xs" fontWeight="semibold">
                  {formatter.format(Number(formatEther(fromNavigatorWei)))} {"VOT3"}
                </Text>
              </HStack>
              {isFullyExitingDelegation && (
                <Text textStyle="xs" color="status.warning.strong" fontWeight="semibold">
                  {t("You will fully exit your navigator delegation")}
                </Text>
              )}
            </VStack>
          </>
        )}

        <Separator w="full" borderColor="status.positive.strong/30" />
        <Skeleton loading={isLoading} w="full">
          <HStack w="full" justifyContent="space-between">
            <Text textStyle="xs" color="text.subtle">
              {t("Available")}
            </Text>
            <Text textStyle="xs" fontWeight="semibold">
              {formatter.format(currentB3tr)} {"B3TR"}
            </Text>
          </HStack>
        </Skeleton>
      </VStack>
    </Card.Root>
  )
}
