import { HStack, Text, VStack } from "@chakra-ui/react"
import { AppFundActivityEvent } from "@/api/contracts/x2EarnRewardsPool"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useBreakpoints } from "@/hooks"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import dayjs from "dayjs"

type Props = {
  transaction: AppFundActivityEvent
  index: number
  start?: string
  end?: string
}

type TransactionType = "DEPOSIT" | "WITHDRAW" | "DISTRIBUTE_REWARDS" | "REWARDS_POOL_UPDATED" | string

type TransactionProps = {
  // icon: JSX.Element
  title: string
  amount: string
  timestampTxs: number
}

const compactFormatter = getCompactFormatter(4)

export const TransactionsHistory = ({ transaction, index, start, end }: Props) => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()

  const txType = transaction.txType as TransactionType
  const timestamp = useEstimateBlockTimestamp({ blockNumber: transaction?.blockNumber })

  // Date filtering
  if (start && end) {
    const startTimestamp = dayjs(start).startOf("day").valueOf()
    const endTimestamp = dayjs(end).endOf("day").valueOf()

    if (timestamp < startTimestamp || timestamp > endTimestamp) {
      return null
    }
  }

  const getTransactionProps = (): TransactionProps => {
    const transactionTypes: Record<TransactionType, TransactionProps> = {
      DEPOSIT: {
        title: t("Deposit"),
        amount: `${compactFormatter.format(parseFloat(transaction.amount))} B3TR`,
        timestampTxs: timestamp,
      },
      WITHDRAW: {
        title: t("Withdraw"),
        amount: `${compactFormatter.format(parseFloat(transaction.amount))} B3TR`,
        timestampTxs: timestamp,
      },
      DISTRIBUTE_REWARDS: {
        title: t("Rewards Distribution"),
        amount: `${compactFormatter.format(parseFloat(transaction.amount))} B3TR`,
        timestampTxs: timestamp,
      },
      REWARDS_POOL_UPDATED: {
        title: t("Rewards Pool Updated"),
        amount: `${compactFormatter.format(parseFloat(transaction.rewardsPoolBalance || "0"))} B3TR`,
        timestampTxs: timestamp,
      },
    }
    return transactionTypes[txType]
  }
  const { title, amount, timestampTxs } = getTransactionProps()
  const bgColor = index % 2 === 0 ? "#FFFFFF" : "#F8F8F8"

  return (
    <HStack p={4} justify="space-between" borderRadius="md" bg={bgColor}>
      <VStack spacing={0} alignItems={"flex-start"}>
        <Text fontSize={isMobile ? 12 : 14}>{title}</Text>
        <Text fontSize={isMobile ? 12 : 14}>{dayjs(timestampTxs).format("DD/MM/YY")}</Text>
      </VStack>
      <Text fontWeight={"600"} fontSize={isMobile ? 12 : 14}>
        {amount}
      </Text>
    </HStack>
  )
}
