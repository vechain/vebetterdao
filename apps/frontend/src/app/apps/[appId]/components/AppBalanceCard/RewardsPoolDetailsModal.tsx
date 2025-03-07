import {
  Card,
  CardBody,
  Heading,
  Modal,
  ModalOverlay,
  ModalCloseButton,
  HStack,
  Text,
  ModalContent,
  ModalHeader,
  ModalBody,
  Switch,
  VStack,
  Select,
  Box,
  Center,
  useDisclosure,
  Image,
} from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useCallback, useState, useMemo, useEffect, useRef } from "react"
import { useToggleRewardsPool, useBreakpoints } from "@/hooks"
import { TransactionModal, DatePicker } from "@/components"
import { useAppFundActivityEvents } from "@/api/contracts/x2EarnRewardsPool"
import { TransactionsHistory } from "./components/TransactionsHistory"

// const SCROLL_TO_LOAD_LENGTH = 5

export type Props = {
  appId: string
  isOpen: boolean
  isEnabled: boolean
  setIsEnabled: (isEnabled: boolean) => void
  onClose: () => void
}

export const RewardsPoolDetailsModal = ({ appId, isOpen, isEnabled, setIsEnabled, onClose }: Props) => {
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>("ALL")
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  const { isMobile } = useBreakpoints()
  const { t } = useTranslation()
  const { data: transactions, isLoading } = useAppFundActivityEvents(appId)

  const {
    isOpen: isTransactionModalOpen,
    onOpen: onOpenTransactionModal,
    onClose: onCloseTransactionModal,
  } = useDisclosure()

  const {
    sendTransaction,
    status,
    resetStatus,
    isTxReceiptLoading,
    sendTransactionPending,
    txReceipt,
    sendTransactionTx,
  } = useToggleRewardsPool({
    xAppId: appId,
    isEnabled: !isEnabled,
    onSuccess: () => {
      onCloseTransactionModal()
    },
  })

  const handleToggle = useCallback(() => {
    sendTransaction(undefined)
    onOpenTransactionModal()
  }, [sendTransaction, onOpenTransactionModal])

  const handleTransactionModalClose = useCallback(() => {
    onCloseTransactionModal()
    // todo : handle the status to rejected
    if (status === "error" || status === "unknown") {
      setTimeout(() => {
        console.log("Transaction failed or rejected, reverting UI state")
        setIsEnabled(isEnabled)
      }, 0)
    }
    resetStatus()
  }, [resetStatus, onCloseTransactionModal, status, isEnabled, setIsEnabled])

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

  // const shouldScroll = filteredTransactions.length > SCROLL_TO_LOAD_LENGTH

  // Use a ref to track if we've already handled this success state
  const hasHandledSuccessRef = useRef(false)

  // Update parent state when transaction succeeds, but only once
  useEffect(() => {
    if (status === "success" && !hasHandledSuccessRef.current) {
      hasHandledSuccessRef.current = true
      setIsEnabled(!isEnabled)
    } else if (status !== "success") {
      hasHandledSuccessRef.current = false
    }
  }, [status, isEnabled, setIsEnabled])

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} isCentered={true} size={"xl"}>
        <ModalOverlay />
        <ModalContent borderRadius="20px" h={{ base: "700px", md: "700px" }}>
          <ModalCloseButton top={{ base: 5, md: 6 }} right={4} />
          <ModalHeader>
            <Heading>{t("Allowance")}</Heading>
          </ModalHeader>

          <ModalBody pb={6}>
            <HStack align="start" spacing={4} bg="#F8F8F8" borderRadius="20px" p="16px" justifyContent="space-between">
              {isEnabled ? (
                <>
                  <Text fontSize={16}>{t("Allowance is enabled")}</Text>
                </>
              ) : (
                <Text fontSize={16}>{t("Allowance is disabled")}</Text>
              )}
              <Switch
                size="lg"
                colorScheme="blue"
                isChecked={isEnabled}
                onChange={handleToggle}
                isDisabled={isTxReceiptLoading || sendTransactionPending}
              />
            </HStack>
            {isEnabled ? (
              <Card w={"full"} rounded={"20px"} border={"1px solid #D5D5D5"} mt={6} h="500px">
                <CardBody overflowY="hidden">
                  <Text fontSize={16} fontWeight="medium" mb={4}>
                    {t("Transaction history")}
                  </Text>

                  <HStack spacing={4} mb={4} justifyContent="space-between" w="full">
                    <VStack alignItems="start" spacing={0} flex="0.75">
                      <Text fontSize="sm" mb={1}>
                        {t("Type")}
                      </Text>
                      <Select
                        rounded={"md"}
                        value={transactionTypeFilter}
                        onChange={e => setTransactionTypeFilter(e.target.value)}
                        size="sm"
                        w="full">
                        <option value="ALL">{t("All")}</option>
                        <option value="DEPOSIT">{t("Deposits")}</option>
                        <option value="WITHDRAW">{t("Withdrawals")}</option>
                        <option value="DISTRIBUTE_REWARDS">{t("Rewards Distribution")}</option>
                        <option value="REWARDS_POOL_UPDATED">{t("Reward Pool Update")}</option>
                      </Select>
                    </VStack>

                    <VStack alignItems="start" spacing={0} flex="1">
                      <Text fontSize="sm" mb={1}>
                        {t("Date Range")}
                      </Text>
                      <DatePicker startDate={startDate} endDate={endDate} onChange={handleDateRangeChange} size="sm" />
                    </VStack>
                  </HStack>

                  {isLoading ? (
                    <Center py={8}>
                      <Text>{t("Loading transactions...")}</Text>
                    </Center>
                  ) : filteredTransactions.length === 0 ? (
                    <VStack py={100} textAlign="center" w="full">
                      <Image src="/images/nothing-to-show-endorsement.svg" alt="No transaction" />
                      <Text color="#757575">{t("No transactions found for the selected type")}</Text>
                    </VStack>
                  ) : (
                    <Box
                      h={"full"}
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
                      <VStack align="stretch" spacing={0}>
                        {filteredTransactions.map((transaction, index) => (
                          <TransactionsHistory
                            key={`${transaction.txType}-${transaction.blockNumber}-${transaction.txOrigin}`}
                            transaction={transaction}
                            index={index}
                            start={startDate}
                            end={endDate}
                          />
                        ))}
                      </VStack>
                    </Box>
                  )}
                </CardBody>
              </Card>
            ) : (
              <Card w={"full"} rounded={"20px"} border={"1px solid #D5D5D5"} mt={6} h="500px">
                <CardBody display="flex" flexDirection="column" justifyContent="center" alignItems="center">
                  <VStack>
                    {/* Circular icon with background */}
                    <Box
                      bg="#D5D5D5"
                      w="120px"
                      h="120px"
                      borderRadius="full"
                      display="flex"
                      justifyContent="center"
                      alignItems="center"
                      mb={4}></Box>
                    <Text fontSize={16} mb={4} textAlign="center" px={isMobile ? "0px" : "15px"}>
                      {t("Manage your funds to have more control over your rewards distribution")}
                    </Text>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={handleTransactionModalClose}
        status={status}
        successTitle={!isEnabled ? t("Allowance has been enabled") : t("Allowance has been disabled")}
        onTryAgain={handleToggle}
        showTryAgainButton
        showExplorerButton
        txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
        pendingTitle={!isEnabled ? t("Enabling allowance...") : t("Disabling allowance...")}
        errorTitle={t("Error toggling allowance")}
        errorDescription={status === "error" ? t("Error toggling allowance") : undefined}
      />
    </>
  )
}
