import {
  Dialog,
  Text,
  HStack,
  Button,
  Heading,
  VStack,
  Icon,
  Box,
  Flex,
  Input,
  Circle,
  Skeleton,
  Portal,
} from "@chakra-ui/react"
import { useAppAvailableFunds, useAppRewardsBalance, useRefillRewardsPool } from "@/api/contracts/x2EarnRewardsPool"
import { useTranslation } from "react-i18next"
import { useCallback, useState, useMemo, useEffect } from "react"
import { useBreakpoints } from "@/hooks"
import { HiMiniArrowsUpDown } from "react-icons/hi2"
import { removingExcessDecimals } from "@/utils/MathUtils"
import BigNumber from "bignumber.js"
import { filterAmountInput } from "@/utils"

type Props = {
  appId: string
  isOpen: boolean
  onClose: () => void
  isEnablingRewardsPool?: boolean
  isRefillingPools?: boolean
}

type TabType = "balance-to-rewards" | "rewards-to-balance"

interface TabConfig {
  id: TabType
  sourceLabel: string
  targetLabel: string
}

export const FundsManagementModal = ({ appId, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()

  const [activeTab, setActiveTab] = useState<TabType>("balance-to-rewards")
  const [amount, setAmount] = useState<string>("")
  //TODO: Add this to review modal before sending transaction
  // const [b3trBalanceAfter, setB3trBalanceAfter] = useState<string>("")

  const { data: rewardsBalance, isLoading: isRewardsBalanceLoading } = useAppRewardsBalance(appId ?? "")
  const { data: availableBalance, isLoading: isAvailableBalanceLoading } = useAppAvailableFunds(appId ?? "")
  const { increaseRewardsPool, decreaseRewardsPool } = useRefillRewardsPool({
    xAppId: appId,
    amount: amount,
    onSuccess: () => {
      refillRewardsPoolAction.resetStatus()
      onClose()
    },
  })

  const refillRewardsPoolAction = useMemo(() => {
    if (activeTab === "balance-to-rewards") {
      return increaseRewardsPool
    } else {
      return decreaseRewardsPool
    }
  }, [activeTab, increaseRewardsPool, decreaseRewardsPool])

  // Formatting values
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

  const [estimatedBalance, setEstimatedBalance] = useState<string>("")
  const [estimatedRewards, setEstimatedRewards] = useState<string>("")

  // Handling transaction states

  const handleTransfer = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()

      refillRewardsPoolAction.sendTransaction()
      //TODO: Add this to review modal before sending transaction
      // setB3trBalanceAfter(activeTab === "balance-to-rewards" ? estimatedRewards : estimatedBalance)
    },
    [refillRewardsPoolAction],
  )

  const status = refillRewardsPoolAction.status

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab)
    setEstimatedBalance(availableBalanceFormatted)
    setEstimatedRewards(rewardsBalanceFormatted)
    handleAmountChange("0")
  }

  const handleAmountChange = (value: string) => {
    const filteredValue = filterAmountInput(value)
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

  const isLoading = isRewardsBalanceLoading || isAvailableBalanceLoading

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

  useEffect(() => {
    if (status === "success") {
      setAmount("0")
    }
  }, [status])

  // Update estimated values when data is loaded
  useEffect(() => {
    if (availableBalanceFormatted && rewardsBalanceFormatted) {
      setEstimatedBalance(availableBalanceFormatted)
      setEstimatedRewards(rewardsBalanceFormatted)
    }
  }, [availableBalanceFormatted, rewardsBalanceFormatted])

  return (
    <Dialog.Root open={isOpen} onOpenChange={details => !details.open && handleClose()}>
      <Dialog.Backdrop />
      <Portal>
        <Dialog.Positioner>
          <Dialog.Content borderRadius="20px">
            <Dialog.CloseTrigger top={{ base: 5, md: 6 }} right={4} />
            <Dialog.Header>
              <Text fontSize={{ base: 18, md: 24 }} fontWeight={700} alignSelf={"center"}>
                {t("Refill Pools")}
              </Text>
            </Dialog.Header>

            <Dialog.Body pb={6} gap={4}>
              <Box borderRadius="16px" p={isMobile ? "4px" : "6px"} mb={"25px"}>
                <Text fontSize={14} fontWeight={400} color="#6A6A6A">
                  {t(
                    "Transfer B3TR between your App Balance Pool and the Rewards Pool. Refill B3TR to the Rewards Pool to distribute rewards, or move them back to the app balance when needed.",
                  )}
                </Text>
              </Box>

              {tabs.map(
                tab =>
                  activeTab === tab.id && (
                    <VStack
                      key={`content-${tab.id}`}
                      w={"full"}
                      mt={4}
                      justifyContent={"space-between"}
                      position="relative"
                      alignItems={"flex-start"}
                      gap={1}>
                      <VStack
                        bg="info-bg"
                        alignItems={"flex-start"}
                        borderRadius={"12px"}
                        p={"20px"}
                        pl={"20px"}
                        w={"full"}>
                        <Text fontWeight="500">
                          {t(activeTab === "balance-to-rewards" ? "From Balance" : "From Rewards Pool")}
                        </Text>
                        <HStack>
                          {isLoading ? (
                            <Skeleton height="20px" width="60px" />
                          ) : (
                            <Heading fontSize={{ base: 30, md: 36 }} color="#6A6A6A">
                              {formatDisplayValue(
                                activeTab === "balance-to-rewards" ? estimatedBalance : estimatedRewards,
                              )}
                            </Heading>
                          )}
                        </HStack>
                      </VStack>
                      {/* The line between the two sections */}
                      <Flex
                        position="absolute"
                        top="40%"
                        left="0"
                        transform="translateY(-50%)"
                        width={"full"}
                        alignItems="center"
                        justifyContent="center"
                        zIndex={1}>
                        <Circle
                          size="60px"
                          bg="contrast-fg-on-strong"
                          border="1px solid #D5D5D5"
                          position="absolute"
                          right="30px"
                          justifyContent="center"
                          alignItems="center"
                          cursor="pointer"
                          onClick={() => {
                            const newTab =
                              activeTab === "balance-to-rewards" ? "rewards-to-balance" : "balance-to-rewards"
                            handleTabChange(newTab)
                          }}
                          boxShadow="sm"
                          _hover={{
                            border: "1px solid #004CFC",
                            boxShadow: "0px 0px 16px rgba(0, 76, 252, 0.29)",
                            "& > svg": {
                              color: "#004CFC",
                            },
                          }}>
                          <Icon
                            as={HiMiniArrowsUpDown}
                            boxSize="35px"
                            transform={activeTab === "balance-to-rewards" ? "rotate(0deg)" : "rotate(180deg)"}
                            transition="transform 0.3s ease"
                            _hover={{
                              color: "#004CFC",
                            }}
                          />
                        </Circle>
                      </Flex>

                      <VStack
                        bg="info-bg"
                        alignItems={"flex-start"}
                        borderRadius={"12px"}
                        p={"20px"}
                        pl={"20px"}
                        w={"full"}>
                        <VStack
                          w={"full"}
                          alignItems={"flex-start"}
                          borderBottomWidth={2}
                          borderColor={"rgba(213, 213, 213, 1)"}>
                          <Text fontWeight="500">
                            {t(activeTab === "balance-to-rewards" ? "To Rewards Pool" : "To Balance")}
                          </Text>
                          <Input
                            placeholder="0"
                            type="text"
                            value={amount}
                            onChange={e => handleAmountChange(e.target.value)}
                            variant="amountInput"
                          />
                        </VStack>
                        <Text fontSize={14} fontWeight={400}>
                          {t("Current {{value}}: ", {
                            value: activeTab === "balance-to-rewards" ? "Rewards Pool" : "Balance",
                          })}
                          {activeTab === "balance-to-rewards" ? rewardsBalanceFormatted : availableBalanceFormatted}
                        </Text>
                      </VStack>
                    </VStack>
                  ),
              )}

              <Button
                mt={8}
                disabled={isTransferDisabled || isLoading}
                onClick={handleTransfer}
                variant={"primaryAction"}
                borderRadius={"full"}
                w={"full"}>
                {t("Transfer token")}
              </Button>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
