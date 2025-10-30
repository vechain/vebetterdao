import { HStack, Text, VStack, Icon, Link } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { FiExternalLink } from "react-icons/fi"

import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import { getExplorerTxLink } from "@/utils/VeChainStatsUtils/ExplorerUtils"

import { AppFundActivityEvent } from "../../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useAppFundActivityEvents"
import { useBreakpoints } from "../../../../../../hooks/useBreakpoints"

type Props = {
  transaction: AppFundActivityEvent
  start?: string
  end?: string
}
type TransactionType =
  | "DEPOSIT"
  | "VOTES_ALLOCATION"
  | "DYNAMIC_BASE_ALLOCATION"
  | "WITHDRAW"
  | "DISTRIBUTE_REWARDS"
  | "REWARDS_POOL_UPDATED"
  | "INCREASE_REWARDS_POOL"
  | "DECREASE_REWARDS_POOL"
  | string
type TransactionProps = {
  // icon: JSX.Element
  title: string
  subtitle?: string
  amount: string
  timestampTxs: number
  txId: string
}
const compactFormatter = getCompactFormatter(2)
export const TransactionsHistory = ({ transaction, start, end }: Props) => {
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
        subtitle: t("Deposit"),
        amount: `+${compactFormatter.format(parseFloat(transaction.amount))} B3TR`,
        timestampTxs: timestamp,
        txId: transaction.txId,
      },
      VOTES_ALLOCATION: {
        title: t("Deposit"),
        subtitle: t("Votes Allocation"),
        amount: `+${compactFormatter.format(parseFloat(transaction.amount))} B3TR`,
        timestampTxs: timestamp,
        txId: transaction.txId,
      },
      DYNAMIC_BASE_ALLOCATION: {
        title: t("Deposit"),
        subtitle: t("Dynamic Base Allocation"),
        amount: `+${compactFormatter.format(parseFloat(transaction.amount))} B3TR`,
        timestampTxs: timestamp,
        txId: transaction.txId,
      },
      WITHDRAW: {
        title: t("Withdraw"),
        subtitle: transaction.reason,
        amount: `-${compactFormatter.format(parseFloat(transaction.amount))} B3TR`,
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
        title: t("Rewards Pool"),
        subtitle: t("Rewards Pool Updated"),
        amount: `${compactFormatter.format(parseFloat(transaction.rewardsPoolBalance || "0"))} B3TR`,
        timestampTxs: timestamp,
        txId: transaction.txId,
      },
      INCREASE_REWARDS_POOL: {
        title: t("Rewards Pool"),
        subtitle: t("Increased Rewards Pool"),
        amount: `+${compactFormatter.format(parseFloat(transaction.amount))} B3TR`,
        timestampTxs: timestamp,
        txId: transaction.txId,
      },
      DECREASE_REWARDS_POOL: {
        title: t("Rewards Pool"),
        subtitle: t("Decreased Rewards Pool"),
        amount: `-${compactFormatter.format(parseFloat(transaction.amount))} B3TR`,
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
  const { title, subtitle, amount, timestampTxs, txId } = getTransactionProps()

  // Determine amount color based on transaction type (matching endorsement colors)
  const isPositive =
    txType === "DEPOSIT" ||
    txType === "VOTES_ALLOCATION" ||
    txType === "DYNAMIC_BASE_ALLOCATION" ||
    txType === "INCREASE_REWARDS_POOL"
  const isNegative = txType === "WITHDRAW" || txType === "DECREASE_REWARDS_POOL"
  const amountColor = isPositive ? "status.positive.primary" : isNegative ? "status.negative.primary" : "inherit"

  return (
    <HStack
      p={2}
      borderRadius={"16px"}
      border="sm"
      bg="bg.primary"
      borderColor="border.secondary"
      w={"full"}
      alignItems={"center"}
      justify={"space-between"}>
      <VStack align="start" justifyContent={"flex-start"} gap={0} flex={1}>
        <Text textStyle={isMobile ? "xs" : "sm"} fontWeight="semibold">
          {title}
        </Text>
        {subtitle && (
          <Text textStyle={isMobile ? "xs" : "sm"} color="text.subtle" lineClamp={2}>
            {subtitle}
          </Text>
        )}
        <Link
          href={getExplorerTxLink(txId)}
          target="_blank"
          rel="noopener noreferrer"
          textStyle="xs"
          color="text.subtle"
          _hover={{
            color: "blue.600",
            textDecoration: "underline",
          }}
          display="inline-flex"
          alignItems="center"
          gap={1}>
          {t("on")} {dayjs(timestampTxs).format("DD/MM/YY")} {t("at")} {dayjs(timestampTxs).format("HH:mm")}
          <Icon as={FiExternalLink} boxSize={2.5} />
        </Link>
      </VStack>
      <VStack align="end" gap={0}>
        <Text textStyle={isMobile ? "xs" : "sm"} fontWeight="semibold" color={amountColor}>
          {amount}
        </Text>
      </VStack>
    </HStack>
  )
}
