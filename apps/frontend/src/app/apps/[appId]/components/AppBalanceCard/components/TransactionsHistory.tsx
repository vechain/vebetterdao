import { HStack, Text, VStack } from "@chakra-ui/react"
import { AppFundActivityEvent } from "@/api/contracts/x2EarnRewardsPool"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useBreakpoints } from "@/hooks"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"
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
  txId: string
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

  const seeTx = (txId: string) => {
    window.open(getExplorerTxLink(txId), "_blank")
  }

  const getTransactionProps = (): TransactionProps => {
    const transactionTypes: Record<TransactionType, TransactionProps> = {
      DEPOSIT: {
        title: t("Deposit"),
        amount: `${compactFormatter.format(parseFloat(transaction.amount))} B3TR`,
        timestampTxs: timestamp,
        txId: transaction.txId,
      },
      WITHDRAW: {
        title: t("Withdraw"),
        amount: `${compactFormatter.format(parseFloat(transaction.amount))} B3TR`,
        timestampTxs: timestamp,
        txId: transaction.txId,
      },
      DISTRIBUTE_REWARDS: {
        title: t("Rewards Distribution"),
        amount: `${compactFormatter.format(parseFloat(transaction.amount))} B3TR`,
        timestampTxs: timestamp,
        txId: transaction.txId,
      },
      REWARDS_POOL_UPDATED: {
        title: t("Rewards Pool Updated"),
        amount: `${compactFormatter.format(parseFloat(transaction.rewardsPoolBalance || "0"))} B3TR`,
        timestampTxs: timestamp,
        txId: transaction.txId,
      },
    }
    // Fallback for other transaction types
    return (
      transactionTypes[txType] || {
        title: t("Transaction"),
        amount: `${compactFormatter.format(parseFloat(transaction.amount || "0"))} B3TR`,
        timestampTxs: timestamp,
        txId: transaction.txId,
      }
    )
  }
  const { title, amount, timestampTxs, txId } = getTransactionProps()
  const bgColor = index % 2 === 0 ? "profile-bg" : "info-bg"

  return (
    <HStack p={4} justify="space-between" borderRadius="md" bg={bgColor}>
      <VStack gap={0} alignItems={"flex-start"}>
        <Text
          _hover={{
            color: "blue.500",
            cursor: "pointer",
          }}
          textStyle={isMobile ? "xs" : "sm"}
          fontWeight={"600"}
          cursor={"pointer"}
          onClick={() => seeTx(txId)}>
          {title}
        </Text>
        <Text textStyle={isMobile ? "xs" : "sm"}>{dayjs(timestampTxs).format("DD/MM/YY")}</Text>
      </VStack>
      <Text textStyle={isMobile ? "xs" : "sm"} fontWeight={"600"} onClick={() => seeTx(txId)}>
        {amount}
      </Text>
    </HStack>
  )
}
