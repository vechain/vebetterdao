import { Button, Card, HStack, Text, VStack, Dialog, Input, Skeleton, Icon, CloseButton } from "@chakra-ui/react"
import { FormattingUtils } from "@repo/utils"
import { useWallet } from "@vechain/vechain-kit"
import { motion } from "framer-motion"
import { useCallback, useMemo } from "react"
import { Controller, useForm } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { IoAddCircleOutline } from "react-icons/io5"

import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { useAppAvailableFunds } from "../../../../../api/contracts/x2EarnRewardsPool/hooks/getter/useAppAvailableFunds"
import { useXApp } from "../../../../../api/contracts/xApps/hooks/useXApp"
import { CustomModalContent } from "../../../../../components/CustomModalContent"
import { B3TRIcon } from "../../../../../components/Icons/B3TRIcon"
import { useDepositToAppBalance } from "../../../../../hooks/useDepositToAppBalance"
import { useGetB3trBalance } from "../../../../../hooks/useGetB3trBalance"

import { DepositPercentageSelectorButtons } from "./components/DepositPercentageSelectorButtons"

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
export const DepositModal = ({ appId, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { isTxModalOpen } = useTransactionModal()

  const { data: app } = useXApp(appId)

  const { data: availableBalanceToDeposit } = useGetB3trBalance(account?.address ?? "")

  const { data: appBalance, isLoading: isAppBalanceLoading } = useAppAvailableFunds(appId)

  const appBalanceScaled = useMemo(() => {
    return appBalance?.scaled ?? "0"
  }, [appBalance?.scaled])

  const availableB3trToDepositScaled = useMemo(() => {
    return availableBalanceToDeposit?.scaled ?? "0"
  }, [availableBalanceToDeposit?.scaled])

  const formData = useForm<{ amount: string }>({
    defaultValues: {
      amount: "",
    },
  })
  const { watch, setValue, control } = formData
  const amount = watch("amount")
  const invalidAmount = useMemo(() => Number(amount) === 0 || isNaN(Number(amount)), [amount])

  //TODO: Add this to review modal before sending transaction
  // const appBalanceAfterSwap = useMemo(() => {
  //   return new BigNumber(appBalanceScaled).plus(amount).toString()
  // }, [appBalanceScaled, amount])

  const filterAmount = useCallback(
    (text: string) => {
      const filteredAmount = text
        .replace(",", ".") // Replace comma with dot
        .replace(/[^\d\\.]/g, "") // Filter out non-numeric characters except for decimal separator
        .replace(/\.(?=.*\.)/g, "") // Filter out duplicate decimal separators
        .replace(/(\.\d{18})\d+/, "$1") // remove digits after 18th decimal

      if (Number(filteredAmount) > Number(availableB3trToDepositScaled)) {
        return availableB3trToDepositScaled
      }
      return filteredAmount
    },
    [availableB3trToDepositScaled],
  )

  const { sendTransaction, resetStatus } = useDepositToAppBalance({
    appId,
    amount,
  })

  const handleWithdraw = useCallback(() => {
    resetStatus()
    sendTransaction()
  }, [sendTransaction, resetStatus])

  const handleClose = useCallback(() => {
    resetStatus()
    onClose()
    setValue("amount", "")
  }, [resetStatus, onClose, setValue])

  const amountInput = useMemo(() => {
    return (
      <Controller
        name="amount"
        control={control}
        render={({ field: { onChange, value } }) => (
          <Input
            placeholder="0"
            type="text"
            value={value}
            onChange={e => onChange(filterAmount(e.target.value))}
            variant="amountInput"
          />
        )}
      />
    )
  }, [filterAmount, control])

  const renderCardContent = useCallback(() => {
    return (
      <form onSubmit={formData.handleSubmit(handleWithdraw)}>
        <Dialog.CloseTrigger asChild>
          <CloseButton />
        </Dialog.CloseTrigger>
        <VStack align={"flex-start"} maxW={["450px", "590px"]} px={{ base: 0, md: 4 }}>
          <HStack>
            <Text textStyle={{ base: "lg", md: "2xl" }} fontWeight="bold" alignSelf={"center"}>
              <Trans i18nKey={"Deposit B3TR to {{name}} app"} values={{ name: app?.name ?? "" }} t={t} />
            </Text>
          </HStack>
          <Text textStyle={{ base: "sm", md: "md" }} opacity={0.7}>
            {t("Send B3TR tokens from the connected account to the app, and use them for rewards distribution.")}
          </Text>

          <VStack bg={"b3tr-balance-bg"} py={{ base: 3, md: 4 }} px={6} h="full" w="full" borderRadius={"2xl"}>
            <HStack>
              <Skeleton loading={isAppBalanceLoading}>
                <Text textStyle={{ base: "2xl", md: "xl" }} fontWeight="semibold">
                  {FormattingUtils.humanNumber(Number(appBalanceScaled))}
                </Text>
              </Skeleton>
            </HStack>

            <Text textStyle="xs" opacity={0.7}>
              {t("App current B3TR Balance")}
            </Text>
          </VStack>

          <motion.div initial="initial" animate="animate" variants={containerVariants} style={{ width: "100%" }}>
            <motion.div layout transition={layoutTransition}>
              <VStack
                py={3}
                h="full"
                w="full"
                align="flex-start"
                gap={12}
                borderBottomWidth={2}
                borderColor={"rgba(213, 213, 213, 1)"}>
                <HStack align={"stretch"} justify={"stretch"} gap={4} w="full">
                  <VStack justify="stretch" flex={1} gap={1}>
                    <HStack justify={"space-between"} alignItems={"flex-start"} w="full">
                      <Text textStyle="sm">{t("You'll deposit")}</Text>
                    </HStack>
                    <HStack w="full">
                      <B3TRIcon boxSize={"30px"} />
                      {amountInput}
                    </HStack>
                  </VStack>
                </HStack>
              </VStack>
            </motion.div>
          </motion.div>

          <DepositPercentageSelectorButtons availableAmount={availableB3trToDepositScaled} setValue={setValue} />

          <Button
            mt={2}
            type="submit"
            variant={"primary"}
            w={"full"}
            rounded={"full"}
            disabled={invalidAmount}
            size={"lg"}
            textStyle={{ base: "sm", md: "lg" }}>
            <Icon as={IoAddCircleOutline} mr={2} />
            {t("Deposit now")}
          </Button>
        </VStack>
      </form>
    )
  }, [
    formData,
    handleWithdraw,
    invalidAmount,
    availableB3trToDepositScaled,
    t,
    amountInput,
    setValue,
    appBalanceScaled,
    isAppBalanceLoading,
    app,
  ])

  return (
    <Dialog.Root open={isOpen && !isTxModalOpen} onOpenChange={details => !details.open && handleClose()}>
      <CustomModalContent w={"auto"} maxW="breakpoint-md">
        <Card.Root rounded={20}>
          <Card.Body>{renderCardContent()}</Card.Body>
        </Card.Root>
      </CustomModalContent>
    </Dialog.Root>
  )
}
