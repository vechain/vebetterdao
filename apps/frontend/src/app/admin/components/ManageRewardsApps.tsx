import { useTranslation } from "react-i18next"
import {
  Card,
  CardHeader,
  Heading,
  CardBody,
  useDisclosure,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Select,
  Circle,
  Button,
  Text,
  Icon,
  Skeleton,
  Box,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tooltip,
} from "@chakra-ui/react"
import { useCallback, useState, useMemo, useEffect } from "react"
import { TransactionModal } from "@/components"
import { useXApps, useAppAdmin } from "@/api"
import { useAppLockedPercentage, useAppAllowance, useAppBalance } from "@/api/contracts/x2EarnRewardsPool"
import { useAdminLockedFundsPercentage } from "@/hooks"
import { useWallet } from "@vechain/dapp-kit-react"
import { UilLock } from "@iconscout/react-unicons"
import { FormattingUtils } from "@repo/utils"
import { RewardsAllowancePieChart } from "@/app/stats/components/Charts"

export const COLORS = {
  available: "#b1f16c",
  locked: "#e53e3e",
}

export const ManageRewardsApps = () => {
  const { onOpen, onClose, isOpen } = useDisclosure()
  const { t } = useTranslation()
  const { account } = useWallet()

  const [appId, setAppId] = useState<string>("")
  const [percentage, setPercentage] = useState<string>("0")
  const [showTooltip, setShowTooltip] = useState(false)

  const { data: xApps } = useXApps()
  const { data: appAdmin } = useAppAdmin(appId ?? "")
  const { data: appAllowance, isLoading: isAppAllowanceLoading } = useAppAllowance(appId ?? "", true)
  const { data: appBalance } = useAppBalance(appId ?? "")
  const { data: lockedFundsPercentage } = useAppLockedPercentage(appId ?? "")

  useEffect(() => {
    if (lockedFundsPercentage) {
      setPercentage(lockedFundsPercentage)
    }
  }, [lockedFundsPercentage])

  const {
    sendTransaction,
    isTxReceiptLoading,
    sendTransactionPending,
    status,
    error,
    txReceipt,
    // sendTransactionTx,
  } = useAdminLockedFundsPercentage({
    appId: appId ?? "",
    percentage: percentage,
  })

  const isLoading = isTxReceiptLoading || sendTransactionPending

  const handleSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()
      sendTransaction(undefined)
      onOpen()
    },
    [sendTransaction, onOpen],
  )

  const isUserConnectedAdmin = useMemo(() => {
    return appAdmin?.toLowerCase() === account?.toLowerCase()
  }, [appAdmin, account])

  const allowance = useMemo(() => {
    return appAllowance
  }, [appAllowance])

  const availableFunds = useMemo(() => {
    return appBalance
  }, [appBalance])

  const lockedFunds = useMemo(() => {
    if (!availableFunds?.scaled || !allowance?.scaled) return "0"
    const value = Number(availableFunds.scaled) - Number(allowance.scaled)
    return FormattingUtils.humanNumber(String(value))
  }, [availableFunds, allowance])

  const estimatedAllowance = useMemo(() => {
    if (!availableFunds?.scaled || !percentage) return "0"
    const value = Number(availableFunds.scaled) * (Number(percentage) / 100)
    return FormattingUtils.humanNumber(String(value))
  }, [availableFunds, percentage])

  const handleSliderChange = useCallback((value: number) => {
    setPercentage(String(Math.round(value)))
  }, [])

  const isSliderDisabled = isLoading || (Number(allowance?.scaled) === 0 && Number(lockedFundsPercentage) > 0)

  const pieData = [
    {
      name: "Locked Funds",
      value: Number(lockedFundsPercentage),
      color: COLORS.locked,
    },
    {
      name: "Available for Distribution",
      value: 100 - Number(lockedFundsPercentage),
      color: COLORS.available,
    },
  ]

  return (
    <>
      <Card w="full">
        <CardHeader>
          <Heading size="lg">{t("Manage apps rewards")}</Heading>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit}>
            <Select
              placeholder="Select app"
              isDisabled={isLoading}
              onChange={e => setAppId(e.target.value)}
              value={appId}>
              {xApps?.active.map(item => {
                return (
                  <option key={item.id} value={item.id}>
                    {item.name + " - id: " + item.id}
                  </option>
                )
              })}
            </Select>

            {isUserConnectedAdmin ? (
              <HStack spacing={8} w="full" alignItems="flex-end">
                <VStack flex={1} spacing={4} p={4} h="full">
                  <FormControl
                    isRequired
                    isInvalid={
                      Number(percentage) > 100 || (Number(allowance?.scaled) === 0 && Number(lockedFundsPercentage) > 0)
                    }>
                    <FormLabel>
                      <strong>{t("Lock Percentage")}</strong>
                    </FormLabel>
                    <VStack w="full" spacing={4}>
                      <Box pt={6} pb={2} w="full">
                        <Slider
                          aria-label="lock-percentage-slider"
                          value={Number(percentage)}
                          onChange={handleSliderChange}
                          onMouseEnter={() => setShowTooltip(true)}
                          onMouseLeave={() => setShowTooltip(false)}
                          min={0}
                          max={100}
                          step={1}
                          isDisabled={isSliderDisabled}>
                          <SliderTrack bg={COLORS.available}>
                            <SliderFilledTrack bg={COLORS.locked} />
                          </SliderTrack>
                          <Tooltip
                            hasArrow
                            bg={COLORS.locked}
                            color="white"
                            placement="top"
                            isOpen={showTooltip}
                            label={`${percentage || "0"}%`}>
                            <SliderThumb boxSize={6} />
                          </Tooltip>
                        </Slider>
                      </Box>
                      <HStack w="full" justify="space-between">
                        <Text color={isSliderDisabled ? COLORS.locked : "gray.600"}>
                          {isSliderDisabled ? t("Allowance have been spent") : t("Estimated allowance:")}
                        </Text>
                        <Text fontWeight="bold">{estimatedAllowance}</Text>
                      </HStack>

                      <HStack w="full" justify="space-between">
                        <Text color={"gray.600"}>{t("Current percentage: ")}</Text>
                        <Text fontWeight="bold">{`${lockedFundsPercentage}%`}</Text>
                      </HStack>
                    </VStack>
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={isLoading}
                    w="full"
                    disabled={
                      !percentage ||
                      Number(percentage) > 100 ||
                      (Number(allowance?.scaled) === 0 && Number(lockedFundsPercentage) > 0)
                    }>
                    {t("Lock funds")}
                  </Button>
                </VStack>

                <VStack flex={1} p={4} h="full" justify="flex-end" align="center">
                  <Box w="full" h="300px">
                    <RewardsAllowancePieChart pieData={pieData} />
                  </Box>

                  {/* Allowance details */}
                  <VStack spacing={2} mt={4} w="full">
                    <HStack justify="space-between" w="full">
                      <HStack>
                        <Circle size="10px" bg={COLORS.available} />
                        <Text fontWeight="bold">{t("Allowance for Distribution :")}</Text>
                      </HStack>
                      <Skeleton height="20px" isLoaded={!isAppAllowanceLoading}>
                        <Text>{`${allowance?.formatted} B3TR`}</Text>
                      </Skeleton>
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <HStack>
                        <Circle size="10px" bg={COLORS.locked} />
                        <Text fontWeight="bold">{t("Locked Amount :")}</Text>
                      </HStack>
                      <Skeleton height="20px" isLoaded={!isAppAllowanceLoading}>
                        <Text>{`${lockedFunds} B3TR`}</Text>
                      </Skeleton>
                    </HStack>
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="bold">{t("Available Funds :")}</Text>
                      <Text>{`${availableFunds?.formatted} B3TR`}</Text>
                    </HStack>
                  </VStack>
                </VStack>
              </HStack>
            ) : (
              <HStack flex={1} align="center" justify="center">
                <Icon as={UilLock} color="red.500" boxSize={["20px"]} />
                <Text>{t("Only selected app admin can have access to this functionnality")}</Text>
              </HStack>
            )}
          </form>
        </CardBody>
      </Card>

      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        status={error ? "error" : status}
        successTitle={t("Transaction successful")}
        onTryAgain={handleSubmit}
        showTryAgainButton
        showExplorerButton
        txId={txReceipt?.meta.txID}
        pendingTitle={t("Processing transaction...")}
        errorTitle={t("Transaction error")}
        errorDescription={error?.reason}
      />
    </>
  )
}
