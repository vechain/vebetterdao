import {
  Modal,
  ModalOverlay,
  Button,
  Card,
  CardBody,
  Input,
  HStack,
  VStack,
  Text,
  Icon,
  Skeleton,
  ModalCloseButton,
  Flex,
} from "@chakra-ui/react"
import { Controller, useForm } from "react-hook-form"
import { IoLockClosedOutline } from "react-icons/io5"
import { FiInfo } from "react-icons/fi"
import { useMemo, useCallback, useEffect } from "react"
import { Trans } from "react-i18next"
import { useAppAllowance, useAppBalance, useSetDistributionAllowance, useXApp } from "@/api"
import { TransactionModal, CustomModalContent, B3TRIcon, BaseTooltip } from "@/components"
import { GenericPercentageSelectorButtons } from "./components/GenericPercentageSelectorButtons"
import { motion } from "framer-motion"
import { t } from "i18next"

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
  const { data: appAllowance, isLoading: isAppAllowanceLoading } = useAppAllowance(appId, true)
  const { data: balance } = useAppBalance(appId)
  const { data: app } = useXApp(appId)

  const appAllowanceScaled = useMemo(() => {
    return appAllowance?.scaled ?? "0"
  }, [appAllowance?.scaled])

  const formData = useForm<{ amount: string }>({
    defaultValues: {
      amount: "",
    },
  })
  const { watch, setValue, control } = formData
  const amount = watch("amount")
  const invalidAmount = useMemo(() => Number(amount) === 0 || isNaN(Number(amount)), [amount])
  const filterAmount = useCallback(
    (text: string) => {
      const filteredAmount = text
        .replace(",", ".") // Replace comma with dot
        .replace(/[^\d\\.]/g, "") // Filter out non-numeric characters except for decimal separator
        .replace(/\.(?=.*\.)/g, "") // Filter out duplicate decimal separators
        .replace(/(\.\d{18})\d+/, "$1") // remove digits after 18th decimal

      if (Number(filteredAmount) > Number(appAllowanceScaled)) {
        return appAllowanceScaled
      }
      return filteredAmount
    },
    [appAllowanceScaled],
  )

  const { sendTransaction, status, error, txReceipt, resetStatus, sendTransactionTx } = useSetDistributionAllowance({
    appId,
    amount,
  })

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
    setValue("amount", "")
  }, [resetStatus, onClose, setValue])

  useEffect(() => {
    if (status === "success") {
      resetStatus()
    }
  }, [status, resetStatus])

  const allowanceValue = useMemo(() => {
    return (
      <Controller
        name="amount"
        control={control}
        render={({ field: { onChange, value } }) => (
          <Input
            h="50px"
            placeholder="0"
            fontSize={{ base: 30, md: 36 }}
            fontWeight={700}
            type="text"
            value={value}
            onChange={e => onChange(filterAmount(e.target.value))}
            variant="unstyled"
            _placeholder={{ color: "black" }}
          />
        )}
      />
    )
  }, [filterAmount, control])

  const renderCardContent = useCallback(() => {
    return (
      <form onSubmit={handleSubmit}>
        <ModalCloseButton top={{ base: 5, md: 6 }} right={4} />
        <VStack align={"flex-start"} maxW={["450px", "590px"]} px={{ base: 0, md: 4 }}>
          <HStack>
            <Text fontSize={{ base: 18, md: 24 }} fontWeight={700} alignSelf={"center"}>
              <Trans i18nKey={"Set B3TR allowance to {{name}} app"} values={{ name: app?.name ?? "" }} t={t} />
            </Text>
          </HStack>
          <Text fontSize={{ base: 14, md: 16 }} fontWeight={400} opacity={0.7}>
            {t("Allow B3TR tokens for rewards distribution to secure the app's funds and enable rewards distribution.")}
          </Text>

          <VStack bg={"#E5EEFF"} py={{ base: 3, md: 4 }} px={6} h="full" w="full" borderRadius={"2xl"}>
            <HStack>
              <Skeleton isLoaded={!isAppAllowanceLoading}>
                <Text fontSize={{ base: "2xl", md: "xl" }} fontWeight={"500"}>
                  {appAllowance?.formatted}
                </Text>
              </Skeleton>
            </HStack>

            <Text fontSize="12px" fontWeight="400" opacity={0.7}>
              {t("App current allowance")}
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
                    <HStack justify={"space-between"} alignItems={"flex-start"} w="full">
                      <Skeleton isLoaded={!isAppAllowanceLoading}>
                        <Text fontSize={14} fontWeight={400}>
                          {t("You'll allow")}
                        </Text>
                      </Skeleton>
                    </HStack>
                    <HStack w="full">
                      <B3TRIcon boxSize={"30px"} />
                      {allowanceValue}
                    </HStack>
                  </VStack>
                </HStack>
              </VStack>
            </motion.div>
          </motion.div>

          <GenericPercentageSelectorButtons
            availableAmount={balance?.scaled ?? "0"}
            setValue={setValue}
            maxButtonText={t("Allow all")}
          />

          <VStack w={"full"} spacing={4} align={"flex-start"}>
            <VStack align={"stretch"} w={"full"} justify={"start"}>
              <BaseTooltip
                text={t(
                  "This allowance will only be used to distribute rewards to the app's users and to secure the app's funds.",
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

              <HStack></HStack>
              <Text fontSize="12px" fontWeight="400" opacity={0.7}>
                {t("Current allowance available to distribute rewards : {{values}}", {
                  values: appAllowance?.formatted,
                })}
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
            isDisabled={invalidAmount || isAppAllowanceLoading}
            size={"lg"}>
            <Icon as={IoLockClosedOutline} mr={2} />
            <Text fontSize={{ base: 14, md: 18 }}>{t("Allow now")}</Text>
          </Button>
        </VStack>
      </form>
    )
  }, [
    handleSubmit,
    isAppAllowanceLoading,
    app?.name,
    appAllowance?.formatted,
    invalidAmount,
    setValue,
    allowanceValue,
    balance?.scaled,
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
