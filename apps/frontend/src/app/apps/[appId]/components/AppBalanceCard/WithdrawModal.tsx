import {
  Button,
  Card,
  CardBody,
  HStack,
  Text,
  VStack,
  Modal,
  ModalOverlay,
  ModalCloseButton,
  Input,
  Image,
  Skeleton,
  Icon,
} from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useWithdrawAppBalance } from "@/hooks"
import { Controller, useForm } from "react-hook-form"
import { TransactionModal, CustomModalContent } from "@/components"
import BigNumber from "bignumber.js"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { useAppBalance } from "@/api/contracts/x2EarnRewardsPool"
import { TeamWalletAddress } from "./components/TeamWalletAddress"
import { IoWalletOutline } from "react-icons/io5"
import { FormattingUtils } from "@repo/utils"

export type Props = {
  appId: string
  teamWalletAddress: string
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

export const WithdrawModal = ({ appId, teamWalletAddress, isOpen, onClose }: Props) => {
  const { t } = useTranslation()

  const { data: availableB3trToWithdraw, isLoading: isBalanceLoading } = useAppBalance(appId)
  const availableB3trToWithdrawScaled = useMemo(() => {
    return availableB3trToWithdraw?.scaled ?? "0"
  }, [availableB3trToWithdraw?.scaled])

  const formData = useForm<{ amount: string }>({
    defaultValues: {
      amount: "",
    },
  })
  const { watch, setValue, control } = formData
  const amount = watch("amount")
  const invalidAmount = useMemo(() => Number(amount) === 0 || isNaN(Number(amount)), [amount])

  const b3trBalanceAfterSwap = useMemo(() => {
    return new BigNumber(availableB3trToWithdrawScaled).minus(amount).toString()
  }, [availableB3trToWithdrawScaled, amount])

  const filterAmount = useCallback(
    (text: string) => {
      const filteredAmount = text
        .replace(",", ".") // Replace comma with dot
        .replace(/[^\d\\.]/g, "") // Filter out non-numeric characters except for decimal separator
        .replace(/\.(?=.*\.)/g, "") // Filter out duplicate decimal separators
        .replace(/(\.\d{18})\d+/, "$1") // remove digits after 18th decimal

      if (Number(filteredAmount) > Number(availableB3trToWithdrawScaled)) {
        return availableB3trToWithdrawScaled
      }
      return filteredAmount
    },
    [availableB3trToWithdrawScaled],
  )

  const { sendTransaction, resetStatus, status, error, txReceipt, sendTransactionTx } = useWithdrawAppBalance({
    appId,
    amount,
    reason: "",
  })

  const handleWithdraw = useCallback(() => {
    resetStatus()
    sendTransaction(undefined)
  }, [sendTransaction, resetStatus])

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
    setValue("amount", "")
  }, [resetStatus, onClose, setValue])

  const maxButton = useMemo(
    () => (
      <Button onClick={() => setValue("amount", availableB3trToWithdrawScaled)} variant={"secondary"}>
        <Text fontSize={14} fontWeight={500}>
          {t("Withdraw all")}
        </Text>
      </Button>
    ),
    [availableB3trToWithdrawScaled, setValue, t],
  )

  const amountInput = useMemo(() => {
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
      <form onSubmit={formData.handleSubmit(handleWithdraw)}>
        <ModalCloseButton top={{ base: 5, md: 6 }} right={4} />
        <VStack align={"flex-start"} maxW={"590px"} px={{ base: 0, md: 4 }}>
          <HStack>
            <Text fontSize={{ base: 18, md: 24 }} fontWeight={700} alignSelf={"center"}>
              {t("Withdraw from your balance")}
            </Text>
          </HStack>
          <Text fontSize={{ base: 14, md: 16 }} fontWeight={400} opacity={0.7}>
            {t("Send your app’s funds received from allocations to your team wallet address.")}
          </Text>

          <VStack bg={"#E5EEFF"} py={{ base: 3, md: 4 }} px={6} h="full" w="full" borderRadius={"2xl"}>
            <HStack>
              <Skeleton isLoaded={!isBalanceLoading}>
                <Text fontSize={{ base: "2xl", md: "xl" }} fontWeight={"500"}>
                  {FormattingUtils.humanNumber(Number(availableB3trToWithdrawScaled))}
                </Text>
              </Skeleton>
            </HStack>

            <Text fontSize="12px" fontWeight="400" opacity={0.7}>
              {t("Current B3TR Balance")}
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
                      <Text fontSize={14} fontWeight={400}>
                        {t("You'll withdraw")}
                      </Text>
                    </HStack>
                    <HStack w="full">
                      <HStack flex={1}>
                        <Image
                          src="/images/logo/b3tr_logo_dark.svg"
                          boxSize={{ base: "30px", md: "36px" }}
                          alt="B3TR Icon"
                        />
                        {amountInput}
                      </HStack>
                      {Number(availableB3trToWithdrawScaled) !== Number(amount) && maxButton}
                    </HStack>
                  </VStack>
                </HStack>
              </VStack>
            </motion.div>
          </motion.div>

          <TeamWalletAddress teamWalletAddress={teamWalletAddress} />

          <Button
            mt={2}
            type="submit"
            variant={"primaryAction"}
            w={"full"}
            rounded={"full"}
            isDisabled={invalidAmount}
            size={"lg"}>
            <Icon as={IoWalletOutline} mr={2} />
            <Text fontSize={{ base: 14, md: 18 }}>{t("Withdraw now")}</Text>
          </Button>
        </VStack>
      </form>
    )
  }, [
    formData,
    handleWithdraw,
    invalidAmount,
    availableB3trToWithdrawScaled,
    t,
    maxButton,
    amountInput,
    amount,
    isBalanceLoading,
    teamWalletAddress,
  ])

  if (status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        successTitle={"Withdraw completed!"}
        status={error ? "error" : status}
        errorDescription={error?.reason}
        errorTitle={error ? "Error withdrawing" : undefined}
        showTryAgainButton
        onTryAgain={handleWithdraw}
        pendingTitle="Withdrawing..."
        showExplorerButton
        isWithdraw
        txId={txReceipt?.meta.txID ?? sendTransactionTx?.txid}
        b3trWithdrawAmount={amount}
        b3trBalanceAfterSwap={b3trBalanceAfterSwap}
        b3trBalance={availableB3trToWithdrawScaled}
      />
    )

  return (
    <Modal isOpen={isOpen} onClose={handleClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent w={"auto"} maxW={"container.md"}>
        <Card rounded={20}>
          <CardBody>{renderCardContent()}</CardBody>
        </Card>
      </CustomModalContent>
    </Modal>
  )
}
