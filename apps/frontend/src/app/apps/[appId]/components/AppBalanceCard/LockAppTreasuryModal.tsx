import {
  Slider,
  Tooltip,
  Modal,
  ModalOverlay,
  Button,
  Card,
  CardBody,
  SliderFilledTrack,
  SliderTrack,
  SliderThumb,
  HStack,
  VStack,
  Text,
  Icon,
  Skeleton,
  ModalCloseButton,
  Flex,
} from "@chakra-ui/react"
import { useMemo, useCallback, useState, useEffect } from "react"
import { Trans } from "react-i18next"
import {
  useAppLockedPercentage,
  useAppAllowance,
  useAppBalance,
  useAppLockedTreasury,
} from "@/api/contracts/x2EarnRewardsPool"
import { useAdminLockedFundsPercentage } from "@/hooks"
import { TransactionModal, CustomModalContent, B3TRIcon, BaseTooltip } from "@/components"
import { useXApp } from "@/api"
import { FormattingUtils } from "@repo/utils"
import { motion } from "framer-motion"
import { IoLockClosedOutline } from "react-icons/io5"
import { t } from "i18next"
import { FiInfo } from "react-icons/fi"

export const COLORS = {
  available: "#e5eeff",
  locked: "#004cfc",
}

export type Props = {
  appId: string
  isOpen: boolean
  onClose: () => void
}

const containerVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      delayChildren: 0.3,
      staggerChildren: 0.2,
    },
  },
}

const layoutTransition = {
  type: "spring",
  stiffness: 300,
  damping: 24,
}

export const LockAppTreasuryModal = ({ appId, isOpen, onClose }: Props) => {
  const [percentage, setPercentage] = useState<string>("0")
  const [showTooltip, setShowTooltip] = useState(false)

  const { sendTransaction, status, error, txReceipt, resetStatus, sendTransactionTx } = useAdminLockedFundsPercentage({
    appId: appId ?? "",
    percentage: percentage,
  })

  const { data: appAllowance, isLoading: isAppAllowanceLoading } = useAppAllowance(appId, true)
  const { data: lockedPercentage } = useAppLockedPercentage(appId)
  const { data: treasuryLocked, isLoading: isTreasuryLockedLoading } = useAppLockedTreasury(appId)
  const { data: balance } = useAppBalance(appId)
  const { data: app } = useXApp(appId)

  const allowance = useMemo(() => {
    return appAllowance
  }, [appAllowance])

  const availableFunds = useMemo(() => {
    return balance
  }, [balance])

  const lockedTreasury = useMemo(() => {
    return treasuryLocked
  }, [treasuryLocked])

  const estimatedAllowance = useMemo(() => {
    if (!availableFunds?.scaled || !percentage) return "0"
    const value = Number(availableFunds.scaled) * (Number(percentage) / 100)
    return FormattingUtils.humanNumber(String(value))
  }, [availableFunds, percentage])

  const handleSliderChange = useCallback((value: number) => {
    setPercentage(String(Math.round(value)))
  }, [])

  const isSliderDisabled = false

  const handleSubmit = useCallback(
    (event?: { preventDefault: () => void }) => {
      if (event) event.preventDefault()
      sendTransaction(undefined)
    },
    [sendTransaction],
  )

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
  }, [resetStatus, onClose])

  useEffect(() => {
    if (lockedPercentage) {
      setPercentage(lockedPercentage)
    }
  }, [lockedPercentage])

  useEffect(() => {
    if (status === "success") {
      resetStatus()
    }
  }, [status, resetStatus])

  console.log({ treasuryLocked })
  console.log({ allowance, estimatedAllowance })

  const sliderValue = useMemo(() => {
    return (
      <HStack w="full" align="center" spacing={4}>
        <Slider
          flex="1"
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
        <Text fontWeight="bold" minW="60px">
          {`${percentage || "0"}%`}
        </Text>
      </HStack>
    )
  }, [percentage, isSliderDisabled, handleSliderChange, showTooltip])

  const renderCardContent = useCallback(() => {
    return (
      <form onSubmit={handleSubmit}>
        <ModalCloseButton top={{ base: 5, md: 6 }} right={4} />
        <VStack align={"flex-start"} maxW={["450px", "590px"]} px={{ base: 0, md: 4 }}>
          <HStack>
            <Text fontSize={{ base: 18, md: 24 }} fontWeight={700} alignSelf={"center"}>
              <Trans i18nKey={"Lock B3TR to {{name}} app"} values={{ name: app?.name ?? "" }} t={t} />
            </Text>
          </HStack>
          <Text fontSize={{ base: 14, md: 16 }} fontWeight={400} opacity={0.7}>
            {t("Lock B3TR tokens to secure the app's funds and enable rewards distribution.")}
          </Text>

          <VStack bg={"#E5EEFF"} py={{ base: 3, md: 4 }} px={6} h="full" w="full" borderRadius={"2xl"}>
            <HStack>
              <Skeleton isLoaded={!isTreasuryLockedLoading}>
                <Text fontSize={{ base: "2xl", md: "xl" }} fontWeight={"500"}>
                  {lockedTreasury.formatted}
                </Text>
              </Skeleton>
            </HStack>

            <Text fontSize="12px" fontWeight="400" opacity={0.7}>
              {t("App current B3TR locked")}
            </Text>
          </VStack>

          <motion.div initial="initial" animate="animate" variants={containerVariants} style={{ width: "100%" }}>
            <motion.div layout transition={layoutTransition}>
              <VStack
                py={3}
                h="full"
                w="full"
                align="flex-start"
                spacing={12}
                borderBottomWidth={2}
                borderColor={"rgba(213, 213, 213, 1)"}>
                <HStack align={"stretch"} justify={"stretch"} spacing={4} w="full">
                  <VStack justify="stretch" flex={1} gap={1}>
                    {sliderValue}
                    <HStack justify={"space-between"} alignItems={"flex-start"} w="full">
                      <Skeleton isLoaded={!isAppAllowanceLoading}>
                        <Text fontSize={14} fontWeight={400}>
                          {t("You'll lock")}
                        </Text>
                      </Skeleton>
                    </HStack>
                    <HStack w="full">
                      <B3TRIcon boxSize={"30px"} />
                      <Text fontSize={{ base: 30, md: 36 }} fontWeight={700} h="50px">
                        {estimatedAllowance}
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>
              </VStack>
            </motion.div>
          </motion.div>

          <VStack w={"full"} spacing={4} align={"flex-start"}>
            <VStack align={"stretch"} w={"full"} justify={"start"}>
              <BaseTooltip
                text={t(
                  "This locking funds will not be able to be distributed for apps rewards. Withdrawing or depositing the funds will recalculate the funds",
                )}>
                <Flex w={"fit-content"} justifyContent={"center"} mt={1}>
                  <HStack alignSelf={"center"} w={"fit-content"}>
                    <Text fontSize={"14px"} fontWeight={400} color="#6A6A6A" w={"full"}>
                      {t("Details")}
                    </Text>
                    <FiInfo color="rgba(0, 76, 252, 1)" size={14} />
                  </HStack>
                </Flex>
              </BaseTooltip>

              <HStack>
                <Text fontSize="12px" fontWeight="400" opacity={0.7}>
                  {t("Current locked treasury percentage : {{values}}%", { values: lockedPercentage })}
                </Text>
              </HStack>
              <Text fontSize="12px" fontWeight="400" opacity={0.7}>
                {t("Current allowance available to distribute rewards : {{values}}", { values: allowance.formatted })}
              </Text>
            </VStack>
          </VStack>

          <Button
            mt={2}
            type="submit"
            variant={"primaryAction"}
            w={"full"}
            rounded={"full"}
            onClick={handleSubmit}
            // todo : find condition to disable the button
            // isDisabled={}
            size={"lg"}>
            <Icon as={IoLockClosedOutline} mr={2} />
            <Text fontSize={{ base: 14, md: 18 }}>{t("Lock now")}</Text>
          </Button>
        </VStack>
      </form>
    )
  }, [
    handleSubmit,
    estimatedAllowance,
    sliderValue,
    lockedTreasury,
    lockedPercentage,
    isAppAllowanceLoading,
    app?.name,
    isTreasuryLockedLoading,
    allowance.formatted,
  ])

  return (
    <Modal isOpen={isOpen} onClose={handleClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent w={"auto"} maxW={"container.md"}>
        <Card rounded={20}>
          <CardBody>
            {status !== "ready" ? (
              <TransactionModal
                isOpen={isOpen}
                onClose={onClose}
                status={error ? "error" : status}
                successTitle={t("Transaction successful")}
                onTryAgain={handleSubmit}
                showTryAgainButton
                showExplorerButton
                txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
                pendingTitle={t("Processing transaction...")}
                errorTitle={t("Transaction error")}
                errorDescription={error?.reason}
              />
            ) : (
              renderCardContent()
            )}
          </CardBody>
        </Card>
      </CustomModalContent>
    </Modal>
  )
}
