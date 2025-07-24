import { Card, Dialog, HStack, Text, VStack, NativeSelect, Box, Center, Image, Icon } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCallback, useState, useMemo } from "react"
import { DatePicker } from "@/components"
import { useAppFundActivityEvents } from "@/api/contracts/x2EarnRewardsPool"
import { TransactionsHistory } from "./components/TransactionsHistory"
import { FaSync } from "react-icons/fa"

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
      filtered = filtered.filter(tx => tx.txType === transactionTypeFilter)
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
      return (
        <VStack py={100} textAlign="center" w="full">
          <Image src="/assets/icons/nothing-to-show-endorsement.svg" alt="No transaction" />
          <Text color="#757575">{t("No transactions found for the selected type")}</Text>
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
      <Dialog.Backdrop />
      <Dialog.Content borderRadius="20px">
        <Dialog.CloseTrigger />
        <Dialog.Header>
          <Text fontSize={{ base: 18, md: 24 }} fontWeight={700} alignSelf={"center"}>
            {t("Transaction history")}
          </Text>
        </Dialog.Header>

        <Dialog.Body pb={6}>
          <Card.Root w={"full"} rounded={"20px"} border={"1px solid #D5D5D5"} mt={2} h={"full"} pb={4}>
            <Card.Body overflowY="hidden">
              <HStack justifyContent="flex-end" alignItems="baseline">
                <Icon
                  as={FaSync}
                  onClick={() => {
                    refetch()
                    setTransactionTypeFilter("ALL")
                    setIsRotating(!isRotating)
                  }}
                  cursor="pointer"
                  transform={isRotating ? "rotate(360deg)" : "rotate(0deg)"}
                  transition="transform 0.4s ease-in-out"
                />
              </HStack>

              <HStack gap={4} mb={4} justifyContent="space-between" w="full">
                <VStack alignItems="start" gap={0} flex="0.75">
                  <Text fontSize="sm" mb={1}>
                    {t("Type")}
                  </Text>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      rounded={"md"}
                      value={transactionTypeFilter}
                      onChange={e => setTransactionTypeFilter(e.target.value)}
                      w="full">
                      <option value="ALL">{t("All")}</option>
                      <option value="DEPOSIT">{t("Deposits")}</option>
                      <option value="WITHDRAW">{t("Withdrawals")}</option>
                      <option value="DISTRIBUTE_REWARDS">{t("Rewards Distribution")}</option>
                      <option value="REWARDS_POOL_UPDATED">{t("Reward Pool Update")}</option>
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </VStack>

                <VStack alignItems="start" gap={0} flex="1">
                  <Text fontSize="sm" mb={1}>
                    {t("Date Range")}
                  </Text>
                  <DatePicker startDate={startDate} endDate={endDate} onChange={handleDateRangeChange} size="sm" />
                </VStack>
              </HStack>

              {renderTx()}
            </Card.Body>
          </Card.Root>
        </Dialog.Body>
      </Dialog.Content>
    </Dialog.Root>
  )
}
