"use client"

import { Card, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"

import { useGetB3trBalance } from "@/hooks/useGetB3trBalance"

type Props = {
  amount: string
  isHighlighted?: boolean
}

const formatter = getCompactFormatter(2)

export const PowerDownB3trSummary = ({ amount, isHighlighted = false }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: b3trBalance, isLoading } = useGetB3trBalance(account?.address ?? undefined)

  const numericAmount = Number(amount) || 0
  const currentB3tr = Number(b3trBalance?.scaled ?? "0")

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
          +{formatter.format(numericAmount)}
          {" B3TR"}
        </Text>

        <Skeleton loading={isLoading}>
          <HStack gap={1}>
            <Text textStyle="sm" color="text.subtle">
              {t("Available")}
              {":"}
            </Text>
            <Text textStyle="sm" fontWeight="semibold">
              {formatter.format(currentB3tr)} {"B3TR"}
            </Text>
          </HStack>
        </Skeleton>
      </VStack>
    </Card.Root>
  )
}
