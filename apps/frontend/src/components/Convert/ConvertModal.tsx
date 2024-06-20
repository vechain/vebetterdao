"use-client"
import {
  Button,
  Card,
  CardBody,
  Flex,
  HStack,
  Text,
  VStack,
  Modal,
  ModalOverlay,
  ModalCloseButton,
} from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useConvertB3tr, useTokenColors, useConvertVot3 } from "@/hooks"
import { FaArrowRight } from "react-icons/fa6"
import { useForm } from "react-hook-form"
import { CustomModalContent } from "../CustomModalContent"
import { TokenCards } from "./TokenCards"
import { TransactionModal } from "../TransactionModal"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { TokenInfoCard } from "./components"
import { IoArrowBackOutline } from "react-icons/io5"
import { BalanceInfo } from "./components"
import { useB3trBalance, useB3trConverted, useVot3Balance } from "@/api"
import { useWallet } from "@vechain/dapp-kit-react"
import { BaseTooltip } from "../BaseTooltip"
import { FiInfo } from "react-icons/fi"
import { motion } from "framer-motion"
import BigNumber from "bignumber.js"

export type Props = {
  isOpen: boolean
  onClose: () => void
}

const DECIMAL_PLACES = 4

// Maximum precision of 4 decimals. Must also round down
const compactFormatter = getCompactFormatter(DECIMAL_PLACES)

const zoomInVariants = {
  hidden: { scale: 0.95, opacity: 0.8 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: "easeInOut" },
  },
}

export const ConvertModal = ({ isOpen, onClose }: Props) => {
  const [isB3trToVot3, setIsB3trToVot3] = useState<boolean>()

  const { account } = useWallet()

  const { data: b3trBalance } = useB3trBalance(account ?? undefined)
  const { data: vot3Balance } = useVot3Balance(account ?? undefined)
  const { data: swappableVot3Balance } = useB3trConverted(account ?? undefined)

  const b3trBalanceScaled = useMemo(() => {
    return b3trBalance?.scaled ?? "0"
  }, [b3trBalance?.scaled])

  const vot3BalanceScaled = useMemo(() => {
    return vot3Balance?.scaled ?? "0"
  }, [vot3Balance?.scaled])

  const isVOT3BalanceMoreThanStakedB3TR = useMemo(() => {
    if (!swappableVot3Balance || !vot3Balance) return true

    return BigInt(vot3Balance.original) > BigInt(swappableVot3Balance.original)
  }, [swappableVot3Balance, vot3Balance])

  const formData = useForm<{ amount: string }>({
    defaultValues: {
      amount: "",
    },
  })
  const { watch, setValue } = formData
  const amount = watch("amount")
  const invalidAmount = useMemo(() => Number(amount) === 0 || isNaN(Number(amount)), [amount])

  const convertB3trMutation = useConvertB3tr({
    amount,
  })

  const convertVot3Mutation = useConvertVot3({
    amount,
  })

  const mutationData = useMemo(() => {
    if (isB3trToVot3) return convertB3trMutation
    return convertVot3Mutation
  }, [isB3trToVot3, convertB3trMutation, convertVot3Mutation])

  const handleConvertB3tr = useCallback(() => {
    mutationData.resetStatus()
    mutationData.sendTransaction(undefined)
  }, [mutationData])

  const handleClose = useCallback(() => {
    mutationData.resetStatus()
    onClose()
    setIsB3trToVot3(undefined)
    setValue("amount", "")
  }, [mutationData, onClose, setValue])

  const handleGoBack = useCallback(() => {
    setIsB3trToVot3(undefined)
    setValue("amount", "")
  }, [setValue])

  const { b3trColor, vot3Color } = useTokenColors()

  const amountText = useMemo(() => {
    const amountNumber = Number(amount)

    if (amountNumber < 0.0001) return `< 0.${"0".repeat(DECIMAL_PLACES - 1)}1`

    return compactFormatter.format(amountNumber)
  }, [amount])

  const b3trBalanceAfterSwap = useMemo(() => {
    if (isB3trToVot3) {
      return new BigNumber(b3trBalanceScaled).minus(amount).toString()
    } else {
      return new BigNumber(b3trBalanceScaled).plus(amount).toString()
    }
  }, [isB3trToVot3, b3trBalanceScaled, amount])

  const vot3BalanceAfterSwap = useMemo(() => {
    if (isB3trToVot3) {
      return new BigNumber(vot3BalanceScaled).plus(amount).toString()
    } else {
      return new BigNumber(vot3BalanceScaled).minus(amount).toString()
    }
  }, [isB3trToVot3, vot3BalanceScaled, amount])

  const swapText = useMemo(() => {
    if (isB3trToVot3) {
      return (
        <HStack>
          <Text as="b">{amountText}</Text>
          <Text color={b3trColor}>B3TR</Text>
          <FaArrowRight />
          <Text as="b">{amountText}</Text>
          <Text color={vot3Color}>VOT3</Text>
        </HStack>
      )
    } else {
      return (
        <HStack>
          <Text as="b">{amountText}</Text>
          <Text color={vot3Color}>VOT3</Text>
          <FaArrowRight />
          <Text as="b">{amountText}</Text>
          <Text color={b3trColor}>B3TR</Text>
        </HStack>
      )
    }
  }, [isB3trToVot3, amountText, b3trColor, vot3Color])

  const convertTitle = useMemo(() => {
    return isB3trToVot3 ? "Turn B3TR into VOT3" : "Turn VOT3 into B3TR"
  }, [isB3trToVot3])

  const convertDescription = useMemo(() => {
    return isB3trToVot3 ? (
      <Text fontSize={{ base: 14, md: 16 }} fontWeight={400}>
        The more VOT3 in your balance, the more <b>voting power</b> you’ll have. Use it to vote on proposals and
        allocation rounds.
      </Text>
    ) : (
      <Text fontSize={{ base: 14, md: 16 }} fontWeight={400}>
        B3TR are the tokens that you earn through the dApps and by participating on the voting sessions.
      </Text>
    )
  }, [isB3trToVot3])

  const renderCardContent = useCallback(() => {
    return isB3trToVot3 !== undefined ? (
      <form onSubmit={formData.handleSubmit(handleConvertB3tr)}>
        <ModalCloseButton top={{ base: 5, md: 6 }} right={4} />
        <VStack align={"flex-start"} maxW={"590px"} px={{ base: 0, md: 4 }}>
          <HStack>
            <IoArrowBackOutline onClick={handleGoBack} size={20} cursor={"pointer"} />
            <Text fontSize={{ base: 18, md: 24 }} fontWeight={700} alignSelf={"center"}>
              {convertTitle}
            </Text>
          </HStack>
          {convertDescription}

          <Flex
            flexDirection={{
              base: isB3trToVot3 ? "column" : "column-reverse",
              md: isB3trToVot3 ? "row" : "row-reverse",
            }}
            w={"full"}
            gap={4}
            mt={{ base: 2, md: 4 }}>
            <BalanceInfo isB3TR={true} balanceScaled={b3trBalanceScaled} />
            <BalanceInfo isB3TR={false} balanceScaled={vot3BalanceScaled} />
          </Flex>

          <TokenCards
            amount={amount}
            formData={formData}
            isB3trToVot3={isB3trToVot3}
            swappableVot3Balance={swappableVot3Balance}
            isVOT3BalanceMoreThanStakedB3TR={isVOT3BalanceMoreThanStakedB3TR}
          />

          <Button
            mt={2}
            type="submit"
            variant={"primaryAction"}
            w={"full"}
            rounded={"full"}
            isDisabled={invalidAmount}
            size={"lg"}>
            <Text fontSize={{ base: 14, md: 18 }}>Convert now</Text>
          </Button>

          <BaseTooltip
            text={
              "B3TR and VOT3 tokens convert 1:1. You can convert back to B3TR based on your total converted VOT3 tokens."
            }>
            <Flex w={"full"} justifyContent={"center"} mt={1}>
              <HStack alignSelf={"center"}>
                <FiInfo color="rgba(0, 76, 252, 1)" size={14} />
                <Text fontSize={14} fontWeight={500} color={"rgba(0, 76, 252, 1)"}>
                  More about conversions
                </Text>
              </HStack>
            </Flex>
          </BaseTooltip>
        </VStack>
      </form>
    ) : (
      <form onSubmit={formData.handleSubmit(handleConvertB3tr)}>
        <ModalCloseButton top={{ base: 5, md: 6 }} right={4} />
        <VStack align={"flex-start"}>
          <Text fontSize={{ base: 18, md: 24 }} fontWeight={700}>
            Convert tokens
          </Text>
          <Flex w="100%" direction={{ base: "column", md: "row" }} gap={4}>
            <motion.div variants={zoomInVariants} initial="hidden" animate="visible">
              <TokenInfoCard isB3TRToVOT3={true} setIsB3TRToVOT3={setIsB3trToVot3} />
            </motion.div>
            <motion.div variants={zoomInVariants} initial="hidden" animate="visible">
              <TokenInfoCard isB3TRToVOT3={false} setIsB3TRToVOT3={setIsB3trToVot3} />
            </motion.div>
          </Flex>
        </VStack>
      </form>
    )
  }, [
    amount,
    b3trBalanceScaled,
    convertDescription,
    convertTitle,
    formData,
    handleConvertB3tr,
    handleGoBack,
    invalidAmount,
    isB3trToVot3,
    isVOT3BalanceMoreThanStakedB3TR,
    swappableVot3Balance,
    vot3BalanceScaled,
  ])

  if (mutationData.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        confirmationTitle={swapText}
        successTitle={"Swap Completed!"}
        status={mutationData.error ? "error" : mutationData.status}
        errorDescription={mutationData.error?.reason}
        errorTitle={mutationData.error ? "Error swapping" : undefined}
        showTryAgainButton
        onTryAgain={handleConvertB3tr}
        pendingTitle="Swapping..."
        showSocialButtons
        socialDescriptionEncoded="%F0%9F%94%84%20Just%20swapped%20between%20B3TR%20and%20VOT3%20on%20%23VeBetterDAO%21%20%0A%0A%F0%9F%8C%B1%20Explore%20and%20join%20us%20at%20https%3A%2F%2Fvebetterdao.org.%0A%0A%23VeBetterDAO%20%23Vechain"
        showExplorerButton
        txId={mutationData.txReceipt?.meta.txID ?? mutationData.sendTransactionTx?.txid}
        isSwap
        b3trBalanceAfterSwap={b3trBalanceAfterSwap}
        vot3BalanceAfterSwap={vot3BalanceAfterSwap}
        b3trBalance={b3trBalanceScaled}
        vot3Balance={vot3BalanceScaled}
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
