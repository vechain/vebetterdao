import {
  Button,
  Card,
  HStack,
  Text,
  VStack,
  Dialog,
  Input,
  Skeleton,
  Icon,
  NativeSelect,
  CloseButton,
} from "@chakra-ui/react"
import { useCallback, useMemo } from "react"
import { useWithdrawAppBalance } from "@/hooks"
import { Controller, useForm } from "react-hook-form"
import { CustomModalContent, B3TRIcon } from "@/components"
import { useTranslation } from "react-i18next"
import { motion } from "framer-motion"
import { useAppAvailableFunds } from "@/api/contracts/x2EarnRewardsPool"
import { TeamWalletAddress } from "./components/TeamWalletAddress"
import { IoWalletOutline } from "react-icons/io5"
import { FormattingUtils } from "@repo/utils"
import { WithdrawPercentageSelectorButtons } from "./components/WithdrawPercentageSelectorButtons"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
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
  const { isTxModalOpen } = useTransactionModal()

  const { data: availableB3trToWithdraw, isLoading: isBalanceLoading } = useAppAvailableFunds(appId)
  const availableB3trToWithdrawScaled = useMemo(() => {
    return availableB3trToWithdraw?.scaled ?? "0"
  }, [availableB3trToWithdraw?.scaled])

  const formData = useForm<{ amount: string; reason: string; customReason: string }>({
    defaultValues: {
      amount: "",
      reason: "",
      customReason: "",
    },
  })
  const { watch, setValue, control } = formData
  const reason = watch("reason")
  const amount = watch("amount")
  const customReason = watch("customReason")
  const invalidAmount = useMemo(() => Number(amount) === 0 || isNaN(Number(amount)), [amount])

  //TODO: Add this to review modal before sending transaction
  // const b3trBalanceAfterSwap = useMemo(() => {
  //   return new BigNumber(availableB3trToWithdrawScaled).minus(amount).toString()
  // }, [availableB3trToWithdrawScaled, amount])

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

  const { sendTransaction } = useWithdrawAppBalance({
    appId,
    amount,
    reason: reason === "Other" ? customReason : reason,
  })

  const handleWithdraw = useCallback(() => {
    sendTransaction()
  }, [sendTransaction])

  const handleClose = useCallback(() => {
    onClose()
    setValue("amount", "")
    setValue("reason", "")
    setValue("customReason", "")
  }, [onClose, setValue])

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

  const reasonInput = useMemo(() => {
    return (
      <VStack w="full" gap={2}>
        <Controller
          name="reason"
          control={control}
          render={({ field: { onChange } }) => (
            <NativeSelect.Root>
              <NativeSelect.Indicator />
              <NativeSelect.Field placeholder="Select a withdraw reason" onChange={e => onChange(e.target.value)}>
                <option value="Team allocation share">{t("Team allocation share")}</option>
                <option value="Marketing">{t("Marketing")}</option>
                <option value="Development">{t("Development")}</option>
                <option value="Reward distribution">{t("Reward distribution")}</option>
                <option value="Community airdrop">{t("Community airdrop")}</option>
                <option value="Endorsers reward">{t("Endorsers reward")}</option>
                <option value="Other">{t("Other")}</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
          )}
        />
        {reason === "Other" && (
          <Controller
            name="customReason"
            control={control}
            render={({ field: { onChange, value } }) => (
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
                      <Text textStyle="sm">{t("Specify your reason")}</Text>
                    </HStack>
                    <HStack w="full">
                      <Input type="text" value={value} onChange={e => onChange(e.target.value)} variant="amountInput" />
                    </HStack>
                  </VStack>
                </HStack>
              </VStack>
            )}
          />
        )}
      </VStack>
    )
  }, [control, t, reason])

  const renderCardContent = useCallback(() => {
    return (
      <form onSubmit={formData.handleSubmit(handleWithdraw)}>
        <Dialog.CloseTrigger asChild>
          <CloseButton />
        </Dialog.CloseTrigger>
        <VStack align={"flex-start"} maxW={["450px", "590px"]} px={{ base: 0, md: 4 }}>
          <HStack>
            <Text textStyle={{ base: "lg", md: "2xl" }} fontWeight="bold" alignSelf={"center"}>
              {t("Withdraw from your balance")}
            </Text>
          </HStack>
          <Text textStyle={{ base: "sm", md: "md" }} opacity={0.7}>
            {t("Send your app’s funds received from allocations to your team wallet address.")}
          </Text>

          <VStack bg={"b3tr-balance-bg"} py={{ base: 3, md: 4 }} px={6} h="full" w="full" borderRadius={"2xl"}>
            <HStack>
              <Skeleton loading={isBalanceLoading}>
                <Text textStyle={{ base: "2xl", md: "xl" }} fontWeight={"500"}>
                  {FormattingUtils.humanNumber(Number(availableB3trToWithdrawScaled))}
                </Text>
              </Skeleton>
            </HStack>

            <Text textStyle="xs" opacity={0.7}>
              {t("Current B3TR Balance")}
            </Text>
          </VStack>

          <motion.div initial="initial" animate="animate" variants={containerVariants} style={{ width: "100%" }}>
            <motion.div layout transition={layoutTransition}>
              <VStack py={3} h="full" w="full" align="flex-start" gap={12}>
                <HStack align={"stretch"} justify={"stretch"} gap={4} w="full">
                  <VStack justify="stretch" flex={1} gap={2}>
                    <HStack justify={"space-between"} alignItems={"flex-start"} w="full">
                      <Text textStyle="sm">{t("Withdraw reason")}</Text>
                    </HStack>
                    <HStack w="full">{reasonInput}</HStack>
                  </VStack>
                </HStack>
              </VStack>
            </motion.div>

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
                      <Text textStyle="sm">{t("You'll withdraw")}</Text>
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

          <WithdrawPercentageSelectorButtons availableAmount={availableB3trToWithdrawScaled} setValue={setValue} />

          <TeamWalletAddress teamWalletAddress={teamWalletAddress} />

          <Button
            mt={2}
            type="submit"
            variant={"primary"}
            w={"full"}
            rounded={"full"}
            disabled={invalidAmount || reason.length === 0 || (reason === "Other" && !customReason)}
            size={"lg"}>
            <Icon as={IoWalletOutline} mr={2} />
            <Text textStyle={{ base: "sm", md: "lg" }}>{t("Withdraw now")}</Text>
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
    amountInput,
    isBalanceLoading,
    teamWalletAddress,
    reasonInput,
    reason,
    setValue,
    customReason,
  ])

  return (
    <Dialog.Root open={isOpen && !isTxModalOpen} onOpenChange={handleClose} trapFocus={true} placement="center">
      <CustomModalContent w={"auto"} maxW="breakpoint-md">
        <Card.Root rounded={20}>
          <Card.Body>{renderCardContent()}</Card.Body>
        </Card.Root>
      </CustomModalContent>
    </Dialog.Root>
  )
}
