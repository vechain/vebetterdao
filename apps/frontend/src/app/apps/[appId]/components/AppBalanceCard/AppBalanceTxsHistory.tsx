import {
  Card,
  Dialog,
  Text,
  VStack,
  NativeSelect,
  Box,
  Center,
  Image,
  Icon,
  Portal,
  CloseButton,
  IconButton,
  Flex,
} from "@chakra-ui/react"
import { useCallback, useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaSync } from "react-icons/fa"

import { Tooltip } from "@/components/ui/tooltip"

import { useAppFundActivityEvents } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useAppFundActivityEvents"
import { DatePicker } from "../../../../../components/DatePicker/DatePicker"

import { TransactionsHistory } from "./components/TransactionsHistory"
export type Props = {
  appId: string
  isOpen: boolean
  onClose: () => void
}
export const AppBalanceTxsHistory = ({ appId, isOpen, onClose }: Props) => {
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("ALL")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [isRotating, setIsRotating] = useState<boolean>(false)
  const { t } = useTranslation()
  const { data: transactions, refetch, isLoading } = useAppFundActivityEvents(appId)
  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])
  const handleDateRangeChange = useCallback((start: string, end: string) => {
    setStartDate(start)
    setEndDate(end)
  }, [])
  const filteredTransactions = useMemo(() => {
    if (!transactions) return []
    let filtered = transactions
    if (transactionTypeFilter !== "ALL") {
      if (transactionTypeFilter === "REWARDS_POOL_UPDATES") {
        // Group both increase and decrease rewards pool transactions
        filtered = filtered.filter(tx => tx.txType === "INCREASE_REWARDS_POOL" || tx.txType === "DECREASE_REWARDS_POOL")
      } else if (transactionTypeFilter === "DEPOSIT") {
        // Group all deposit types: regular deposits, votes allocation, and dynamic base allocation
        filtered = filtered.filter(
          tx => tx.txType === "DEPOSIT" || tx.txType === "VOTES_ALLOCATION" || tx.txType === "DYNAMIC_BASE_ALLOCATION",
        )
      } else {
        filtered = filtered.filter(tx => tx.txType === transactionTypeFilter)
      }
    }

    return filtered
  }, [transactions, transactionTypeFilter])

  const renderTx = () => {
    if (isLoading) {
      return (
        <Center py={8}>
          <Text>{t("Loading transactions...")}</Text>
        </Center>
      )
    }

    if (filteredTransactions.length === 0) {
      const message =
        transactionTypeFilter === "ALL" && transactions && transactions.length === 0
          ? t("No transactions found")
          : t("No transactions found for the selected type")
      return (
        <VStack py={100} textAlign="center" w="full">
          <Image src="/assets/icons/nothing-to-show-endorsement.svg" alt="No transaction" />
          <Text color="gray.600">{message}</Text>
        </VStack>
      )
    }

    return (
      <Box
        h={"350px"}
        overflowY="auto"
        pr={2}
        css={{
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#c1c1c1",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#a1a1a1",
          },
        }}>
        <VStack alignItems="stretch" gap={0}>
          {filteredTransactions.map((transaction, index) => (
            <TransactionsHistory
              key={`${transaction.txType}-${transaction.blockNumber}-${transaction.txId}`}
              transaction={transaction}
              index={index}
              start={startDate}
              end={endDate}
            />
          ))}
        </VStack>
      </Box>
    )
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && handleClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content borderRadius="20px">
            <Dialog.CloseTrigger asChild>
              <CloseButton />
            </Dialog.CloseTrigger>
            <Dialog.Header>
              <Text textStyle={{ base: "lg", md: "2xl" }} fontWeight="bold" alignSelf={"center"}>
                {t("Transaction history")}
              </Text>
            </Dialog.Header>

            <Dialog.Body pb={6}>
              <Card.Root w={"full"} rounded={"20px"} border={"1px solid #D5D5D5"} mt={2} h={"full"} pb={4}>
                <Card.Body overflowY="hidden">
                  <Flex gap={4} mb={4} justifyContent="space-between" w="full" alignItems="end">
                    <VStack alignItems="start" gap={0} flex="0.75">
                      <Text textStyle="sm" mb={1}>
                        {t("Type")}
                      </Text>
                      <NativeSelect.Root size="sm">
                        <NativeSelect.Indicator />
                        <NativeSelect.Field
                          rounded={"md"}
                          value={transactionTypeFilter}
                          onChange={e => setTransactionTypeFilter(e.target.value)}
                          w="full">
                          <option value="ALL">{t("All")}</option>
                          <option value="DEPOSIT">{t("Deposits")}</option>
                          <option value="WITHDRAW">{t("Withdrawals")}</option>
                          <option value="REWARDS_POOL_UPDATES">{t("Rewards Pool Updates")}</option>
                        </NativeSelect.Field>
                      </NativeSelect.Root>
                    </VStack>

                    <VStack alignItems="start" gap={0} flex="1">
                      <Text textStyle="sm" mb={1}>
                        {t("Date Range")}
                      </Text>
                      <DatePicker startDate={startDate} endDate={endDate} onChange={handleDateRangeChange} size="sm" />
                    </VStack>

                    <Tooltip content={t("Refresh transactions")}>
                      <IconButton
                        aria-label={t("Refresh transactions")}
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          refetch()
                          setTransactionTypeFilter("ALL")
                          setStartDate("")
                          setEndDate("")
                          setIsRotating(!isRotating)
                        }}>
                        <Icon
                          as={FaSync}
                          transform={isRotating ? "rotate(360deg)" : "rotate(0deg)"}
                          transition="transform 0.4s ease-in-out"
                        />
                      </IconButton>
                    </Tooltip>
                  </Flex>

                  {renderTx()}
                </Card.Body>
              </Card.Root>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
