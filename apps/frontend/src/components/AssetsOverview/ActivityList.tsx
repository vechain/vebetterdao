"use client"

import { Button, Flex, HStack, Icon, Skeleton, Spinner, Text, VStack } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Transaction, TransactionEvent, useTransactions } from "@/api/indexer/transactions/useTransactions"

export type ActivityItemProps = {
  label: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  amount: string
  token: string
  sign: "+" | "-"
  amountColor?: string
}

const ActivityItem = ({ props, timestamp }: { props: ActivityItemProps; timestamp: number }) => (
  <HStack gap="3" py="2">
    <Flex rounded="full" bg={props.iconBg} p="2" flexShrink={0}>
      <Icon boxSize="4" color={props.iconColor}>
        {props.icon}
      </Icon>
    </Flex>
    <VStack gap="0" align="start" flex={1} minW={0}>
      <Text textStyle="sm" fontWeight="semibold" lineClamp={1}>
        {props.label}
      </Text>
      <Text textStyle="xs" color="text.subtle">
        {dayjs.unix(timestamp).fromNow()}
      </Text>
    </VStack>
    <VStack gap="0" align="end" flexShrink={0}>
      <Text textStyle="sm" fontWeight="semibold" color={props.amountColor}>
        {props.sign}
        {props.amount} {props.token}
      </Text>
    </VStack>
  </HStack>
)

type ActivityListProps = {
  eventNames: TransactionEvent[]
  getActivityProps: (tx: Transaction, account: string) => ActivityItemProps | null
  pageSize?: number
}

export const ActivityList = ({ eventNames, getActivityProps, pageSize = 5 }: ActivityListProps) => {
  const { t } = useTranslation()
  const { account } = useWallet()

  const {
    data: txData,
    isLoading: isTxLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTransactions(account?.address ?? "", {
    eventName: [...eventNames],
    size: pageSize,
  })

  const transactions = useMemo(() => txData?.pages.flatMap(page => page.data) ?? [], [txData])

  if (!account?.address || (!isTxLoading && transactions.length === 0)) return null

  return (
    <>
      <Text textStyle="sm" fontWeight="semibold" color="text.subtle" mt="1">
        {t("Recent activity")}
      </Text>

      <Skeleton loading={isTxLoading} rounded="lg">
        <VStack gap="0" align="stretch" divideY="1px" divideColor="border.secondary">
          {transactions.map((transaction, idx) => {
            const props = getActivityProps(transaction, account.address)
            if (!props) return null
            const translated = { ...props, label: t(props.label as "B3TR") }
            return (
              <ActivityItem
                key={`${transaction.txId}-${idx}`}
                props={translated}
                timestamp={transaction.blockTimestamp ?? 0}
              />
            )
          })}
          {hasNextPage && (
            <Button
              variant="ghost"
              size="sm"
              mx="auto"
              mt="2"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}>
              {isFetchingNextPage ? <Spinner size="sm" /> : t("View more")}
            </Button>
          )}
        </VStack>
      </Skeleton>
    </>
  )
}
