import {
  Modal,
  ModalOverlay,
  ModalHeader,
  ModalCloseButton,
  Text,
  HStack,
  Button,
  Heading,
  ModalContent,
  ModalBody,
  VStack,
  Icon,
  Box,
  Flex,
  SlideFade,
  Input,
  Circle,
  useDisclosure,
  Skeleton,
} from "@chakra-ui/react"
import {
  useAppBalance,
  useAppAvailableFunds,
  useAppRewardsBalance,
  useIncreaseRewardsPool,
  useDecreaseRewardsPool,
} from "@/api/contracts/x2EarnRewardsPool"
import { useTranslation } from "react-i18next"
import { useCallback, useState, useMemo, useEffect } from "react"
import { useBreakpoints } from "@/hooks"
import { B3TRIcon, TransactionModal } from "@/components"
import { FaPlus, FaMinus, FaArrowRight } from "react-icons/fa6"
import { removingExcessDecimals } from "@/utils/MathUtils"
import BigNumber from "bignumber.js"

type Props = {
  appId: string
  isOpen: boolean
  onClose: () => void
}

type TabType = "balance-to-rewards" | "rewards-to-balance"

interface TabConfig {
  id: TabType
  sourceLabel: string
  targetLabel: string
}
interface TabItemProps {
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
}

export const FundsManagementModal = ({ appId, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  const [activeTab, setActiveTab] = useState<TabType>("balance-to-rewards")
  const [amount, setAmount] = useState<string>("")

  const { data: rewardsBalance, isLoading: isRewardsBalanceLoading } = useAppRewardsBalance(appId ?? "")
  const { data: availableBalance, isLoading: isAvailableBalanceLoading } = useAppAvailableFunds(appId ?? "")
  const { data: totalBalance, isLoading: isTotalBalanceLoading } = useAppBalance(appId ?? "")

  const {
    sendTransaction: sendTransactionToRewards,
    resetStatus: resetStatusToRewards,
    // isTxReceiptLoading: isTxReceiptLoadingToRewards,
    // sendTransactionPending: sendTransactionPendingToRewards,
    status: statusToRewards,
    error: errorToRewards,
    txReceipt: txReceiptToRewards,
    sendTransactionTx: sendTransactionTxToRewards,
  } = useIncreaseRewardsPool({
    xAppId: appId,
    amount: amount,
  })

  const {
    sendTransaction: sendTransactionToBalance,
    resetStatus: resetStatusToBalance,
    // isTxReceiptLoading: isTxReceiptLoadingToBalance,
    // sendTransactionPending: sendTransactionPendingToBalance,
    status: statusToBalance,
    error: errorToBalance,
    txReceipt: txReceiptToBalance,
    sendTransactionTx: sendTransactionTxToBalance,
  } = useDecreaseRewardsPool({
    xAppId: appId,
    amount: amount,
  })

  const formatDisplayValue = (value: string | number | undefined): string => {
    if (value === undefined || value === "") return "0"
    return removingExcessDecimals(value, 2)
  }

  const rewardsBalanceFormatted = useMemo(() => {
    return formatDisplayValue(rewardsBalance?.scaled)
  }, [rewardsBalance])

  const availableBalanceFormatted = useMemo(() => {
    return formatDisplayValue(availableBalance?.scaled)
  }, [availableBalance])

  const totalBalanceFormatted = useMemo(() => {
    return formatDisplayValue(totalBalance?.scaled)
  }, [totalBalance])

  const [estimatedBalance, setEstimatedBalance] = useState<string>("")
  const [estimatedRewards, setEstimatedRewards] = useState<string>("")

  // Update estimated values when data is loaded
  useEffect(() => {
    if (availableBalanceFormatted && rewardsBalanceFormatted) {
      setEstimatedBalance(availableBalanceFormatted)
      setEstimatedRewards(rewardsBalanceFormatted)
    }
  }, [availableBalanceFormatted, rewardsBalanceFormatted])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setAmount("")
  }

  // Handling transaction states
  const {
    isOpen: isTransactionModalOpen,
    onOpen: onOpenTransactionModal,
    onClose: onCloseTransactionModal,
  } = useDisclosure()

  const handleTransfer = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()

      {
        activeTab === "balance-to-rewards" ? sendTransactionToRewards(amount) : sendTransactionToBalance(amount)
      }
      onOpenTransactionModal()
    },
    [sendTransactionToRewards, sendTransactionToBalance, onOpenTransactionModal, activeTab, amount],
  )

  const handleTransactionModalClose = useCallback(() => {
    resetStatusToRewards()
    resetStatusToBalance()
    onCloseTransactionModal()
  }, [resetStatusToRewards, resetStatusToBalance, onCloseTransactionModal])

  const error = errorToRewards || errorToBalance
  const status = statusToRewards || statusToBalance
  const txReceipt = txReceiptToRewards || txReceiptToBalance
  const sendTransactionTx = sendTransactionTxToRewards || sendTransactionTxToBalance

  const handleAmountChange = (value: string) => {
    const filteredValue = value
      .replace(/[^\d.]/g, "")
      .replace(/\.(?=.*\.)/g, "")
      .replace(/^0+(\d)/, "$1")
      .replace(/(\.\d{18})\d+/, "$1")
    // Ensure the amount doesn't exceed available balance
    const maxBalance = activeTab === "balance-to-rewards" ? availableBalanceFormatted : rewardsBalanceFormatted

    if (filteredValue === "" || new BigNumber(filteredValue).lte(maxBalance)) {
      setAmount(filteredValue)

      if (filteredValue === "") {
        setEstimatedBalance(availableBalanceFormatted)
        setEstimatedRewards(rewardsBalanceFormatted)
        return
      }

      const amountBN = new BigNumber(filteredValue)

      if (activeTab === "rewards-to-balance") {
        const newRewards = new BigNumber(rewardsBalanceFormatted).minus(amountBN)
        const newBalance = new BigNumber(availableBalanceFormatted).plus(amountBN)
        setEstimatedRewards(removingExcessDecimals(newRewards.toString(), 2))
        setEstimatedBalance(removingExcessDecimals(newBalance.toString(), 2))
      } else if (activeTab === "balance-to-rewards") {
        const newBalance = new BigNumber(availableBalanceFormatted).minus(amountBN)
        const newRewards = new BigNumber(rewardsBalanceFormatted).plus(amountBN)
        setEstimatedBalance(removingExcessDecimals(newBalance.toString(), 2))
        setEstimatedRewards(removingExcessDecimals(newRewards.toString(), 2))
      }
    }
  }

  const isTransferDisabled = useMemo(() => {
    return (
      !amount ||
      new BigNumber(amount).lte(0) ||
      new BigNumber(amount).gt(activeTab === "balance-to-rewards" ? availableBalanceFormatted : rewardsBalanceFormatted)
    )
  }, [amount, activeTab, availableBalanceFormatted, rewardsBalanceFormatted])

  const isLoading = isRewardsBalanceLoading || isAvailableBalanceLoading || isTotalBalanceLoading

  const TabItem = ({ isActive, onClick, children }: TabItemProps) => {
    return (
      <HStack
        flex={1}
        py="10px"
        px="12px"
        borderRadius="8px"
        justifyContent="center"
        alignItems="center"
        bg={isActive ? "#E0E9FE" : "transparent"}
        cursor="pointer"
        transition="all 0.3s ease"
        _hover={{
          bg: isActive ? "#E0E9FE" : "rgba(224, 233, 254, 0.5)",
        }}
        onClick={onClick}>
        {children}
      </HStack>
    )
  }
  const tabs: TabConfig[] = [
    {
      id: "balance-to-rewards",
      sourceLabel: "Balance",
      targetLabel: "Rewards",
    },
    {
      id: "rewards-to-balance",
      sourceLabel: "Rewards",
      targetLabel: "Balance",
    },
  ]
  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} isCentered={true} size={"xl"}>
        <ModalOverlay />
        <ModalContent borderRadius="20px">
          <ModalCloseButton />
          <ModalHeader>
            <Heading>{t("Funds Transfer")}</Heading>
          </ModalHeader>

          <ModalBody pb={6} gap={4}>
            <Box bg="#F8F8F8" borderRadius="16px" p={isMobile ? "4px" : "6px"} mb={"25px"}>
              <HStack spacing={2} p={isMobile ? "4px" : "6px"}>
                {tabs.map(tab => (
                  <TabItem key={tab.id} isActive={activeTab === tab.id} onClick={() => handleTabChange(tab.id)}>
                    <HStack spacing={2}>
                      <Text
                        fontSize={isMobile ? "10px" : "sm"}
                        fontWeight={"600"}
                        color={activeTab === tab.id ? "#004CFC" : "#252525"}>
                        {tab.sourceLabel}
                      </Text>
                      <Icon as={FaArrowRight} boxSize="12px" color={activeTab === tab.id ? "#004CFC" : "#252525"} />
                      <Text
                        fontSize={isMobile ? "10px" : "sm"}
                        fontWeight={"600"}
                        color={activeTab === tab.id ? "#004CFC" : "#252525"}>
                        {tab.targetLabel}
                      </Text>
                    </HStack>
                  </TabItem>
                ))}
              </HStack>
            </Box>

            <Box bg="#F8F8F8" borderRadius="16px" p={7} mb={"25px"}>
              {tabs.map(
                tab =>
                  activeTab === tab.id && (
                    <SlideFade key={`content-${tab.id}`} in={activeTab === tab.id} offsetY="20px">
                      <VStack align="start">
                        <VStack
                          py={3}
                          h="full"
                          w="full"
                          align="flex-start"
                          spacing={12}
                          borderBottomWidth={2}
                          borderColor={"rgba(213, 213, 213, 1)"}>
                          <HStack align={"stretch"} justify={"stretch"} spacing={4} w="full">
                            <VStack justify="stretch" flex={1} spacing={2}>
                              <HStack justify={"space-between"} alignItems={"flex-start"} w="full">
                                <Text fontSize={14} fontWeight={400}>
                                  {t("Tokens to transfer")}
                                </Text>
                              </HStack>
                              <HStack w="full">
                                <B3TRIcon boxSize={"30px"} />
                                <Input
                                  h="50px"
                                  placeholder="0"
                                  fontSize={{ base: 30, md: 36 }}
                                  fontWeight={700}
                                  type="text"
                                  value={amount}
                                  onChange={e => handleAmountChange(e.target.value)}
                                  variant="unstyled"
                                  _placeholder={{ color: "black" }}
                                />
                              </HStack>
                            </VStack>
                          </HStack>
                        </VStack>
                        {isAvailableBalanceLoading ? (
                          <Skeleton height="20px" width="200px" />
                        ) : (
                          <Text color="#6A6A6A" fontSize={14}>
                            {t("Available Funds : {{value}}", { value: totalBalanceFormatted })}
                          </Text>
                        )}
                      </VStack>

                      <HStack
                        width={"full"}
                        mt={4}
                        bg="white"
                        p={4}
                        justifyContent={"space-between"}
                        borderRadius="12px"
                        position="relative"
                        border="1px solid #D5D5D5">
                        <VStack alignItems={"flex-start"}>
                          <Text fontWeight="500">
                            {t(activeTab === "balance-to-rewards" ? "Balance" : "Rewards Pool")}
                          </Text>
                          <HStack>
                            {isLoading ? (
                              <Skeleton height="20px" width="60px" />
                            ) : (
                              <Heading size={{ base: "sm", md: "lg" }}>
                                {formatDisplayValue(
                                  activeTab === "balance-to-rewards" ? estimatedBalance : estimatedRewards,
                                )}
                              </Heading>
                            )}

                            <Box
                              bg="#FCEEF1"
                              p="6px"
                              display="flex"
                              borderRadius="full"
                              alignItems="center"
                              justifyContent="center">
                              <Icon as={FaMinus} color="#C84968" boxSize="12px" />
                            </Box>
                          </HStack>
                        </VStack>
                        {/* The line between the two sections */}
                        <Flex
                          position="absolute"
                          left="50%"
                          transform="translateX(-50%)"
                          height={"full"}
                          top="0"
                          alignItems="center"
                          justifyContent="center"
                          zIndex={1}>
                          <Box position="relative" height={"full"} width="1px" bg="#D5D5D5" />
                          <Circle
                            size="32px"
                            bg="white"
                            border="1px solid #D5D5D5"
                            position="absolute"
                            justifyContent="center"
                            alignItems="center"
                            boxShadow="sm">
                            <Icon as={FaArrowRight} color="#252525" boxSize="12px" />
                          </Circle>
                        </Flex>

                        <VStack alignItems={"flex-end"}>
                          <Text fontWeight="500">
                            {t(activeTab === "balance-to-rewards" ? "Rewards Pool" : "Balance")}
                          </Text>

                          <HStack>
                            {isLoading ? (
                              <Skeleton height="20px" width="60px" />
                            ) : (
                              <Heading size={{ base: "sm", md: "lg" }} color="#6A6A6A">
                                {formatDisplayValue(
                                  activeTab === "balance-to-rewards" ? estimatedRewards : estimatedBalance,
                                )}
                              </Heading>
                            )}
                            {/* Adding funds to the right side */}
                            <Box
                              bg="#E9FDF1"
                              p="6px"
                              borderRadius="full"
                              display="flex"
                              alignItems="center"
                              justifyContent="center">
                              <Icon as={FaPlus} color="#3DBA67" boxSize="12px" />
                            </Box>
                          </HStack>
                        </VStack>
                      </HStack>
                    </SlideFade>
                  ),
              )}
            </Box>

            <Button
              mt={1}
              isDisabled={isTransferDisabled || isLoading}
              onClick={handleTransfer}
              variant={"primaryAction"}
              borderRadius={"full"}
              w={"full"}>
              {t("Transfer token")}
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={handleTransactionModalClose}
        status={error ? "error" : status}
        successTitle={activeTab === "balance-to-rewards" ? t("Rewards Pool Increased") : t("Balance Increased")}
        onTryAgain={handleTransfer}
        showTryAgainButton
        showExplorerButton
        txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
        pendingTitle={t("Processing Transfer")}
        errorTitle={t("Error transferring funds")}
        errorDescription={error?.reason}
      />
    </>
  )
}
