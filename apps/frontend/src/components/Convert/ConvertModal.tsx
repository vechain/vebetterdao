"use-client"
import { Card, CardBody, HStack, Text, Modal, ModalOverlay, useDisclosure } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useConvertB3tr, useTokenColors, useConvertVot3, useSmartAccountUpgradeRequired } from "@/hooks"
import { useForm } from "react-hook-form"
import { CustomModalContent } from "../CustomModalContent"
import { TransactionModal, TransactionModalStatus } from "../TransactionModal"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { TokenSelectionContent, SwapTokenContent } from "./components"
import { useB3trBalance, useB3trConverted, useVot3Balance } from "@/api"
import { useWallet } from "@vechain/vechain-kit"
import BigNumber from "bignumber.js"
import { useTranslation } from "react-i18next"
import { FaArrowRight } from "react-icons/fa6"
import { UpgradeSmartAccountModal } from "../UpgradeSmartAccountModal"

export type Props = {
  isOpen: boolean
  onClose: () => void
}

enum CardContentStep {
  SELECT_TOKEN,
  CONFIRM_SWAP,
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
  const { t } = useTranslation()

  const { account } = useWallet()

  const isSmartAccountUpgradeRequired = useSmartAccountUpgradeRequired()

  const { data: b3trBalance } = useB3trBalance(account?.address ?? undefined)
  const { data: vot3Balance } = useVot3Balance(account?.address ?? undefined)
  const { data: swappableVot3Balance } = useB3trConverted(account?.address ?? undefined)

  const { isOpen: isSAUpgradeModalOpen, onClose: onCloseUpgradeModal, onOpen: openUpgradeModal } = useDisclosure()

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
    if (isSmartAccountUpgradeRequired && isB3trToVot3) {
      //Open Upgrade Modal
      return openUpgradeModal()
    }

    mutationData.resetStatus()
    mutationData.sendTransaction(undefined)
  }, [isB3trToVot3, isSmartAccountUpgradeRequired, mutationData, openUpgradeModal])

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
          <Text color={b3trColor}>{t("B3TR")}</Text>
          <FaArrowRight />
          <Text as="b">{amountText}</Text>
          <Text color={vot3Color}>{t("VOT3")}</Text>
        </HStack>
      )
    } else {
      return (
        <HStack>
          <Text as="b">{amountText}</Text>
          <Text color={vot3Color}>{t("VOT3")}</Text>
          <FaArrowRight />
          <Text as="b">{amountText}</Text>
          <Text color={b3trColor}>{t("B3TR")}</Text>
        </HStack>
      )
    }
  }, [isB3trToVot3, amountText, b3trColor, t, vot3Color])

  const convertTitle = useMemo(() => {
    return isB3trToVot3 ? t("Turn B3TR into VOT3") : t("Turn VOT3 into B3TR")
  }, [isB3trToVot3, t])

  const convertDescription = useMemo(() => {
    return isB3trToVot3 ? (
      <Text fontSize={{ base: 14, md: 16 }} fontWeight={400}>
        {t("The more VOT3 in your balance, the more ")}
        <b>{t("voting power")}</b>
        {t(" you’ll have. Use it to vote on proposals and allocation rounds.")}
      </Text>
    ) : (
      <Text fontSize={{ base: 14, md: 16 }} fontWeight={400}>
        {t("B3TR are the tokens that you earn through the dApps and by participating on the voting sessions.")}
      </Text>
    )
  }, [isB3trToVot3, t])

  const isSubmitButtonLoading = useMemo(() => {
    return mutationData.status === "pending"
  }, [mutationData.status])

  const disableSubmitButton = useMemo(() => {
    return invalidAmount || isSubmitButtonLoading
  }, [invalidAmount, isSubmitButtonLoading])

  const getCardContentStep = (isB3trToVot3?: boolean) => {
    if (isB3trToVot3 === undefined) return CardContentStep.SELECT_TOKEN
    return CardContentStep.CONFIRM_SWAP
  }

  const stepComponents = {
    [CardContentStep.SELECT_TOKEN]: (
      <TokenSelectionContent
        onSubmit={formData.handleSubmit(handleConvertB3tr)}
        setIsB3trToVot3={setIsB3trToVot3}
        zoomInVariants={zoomInVariants}
      />
    ),
    [CardContentStep.CONFIRM_SWAP]: (
      <SwapTokenContent
        formData={formData}
        onSubmit={formData.handleSubmit(handleConvertB3tr)}
        amount={amount}
        isB3trToVot3={isB3trToVot3}
        swappableVot3Balance={swappableVot3Balance}
        isVOT3BalanceMoreThanStakedB3TR={isVOT3BalanceMoreThanStakedB3TR}
        convertTitle={convertTitle}
        convertDescription={convertDescription}
        b3trBalanceScaled={b3trBalanceScaled}
        vot3BalanceScaled={vot3BalanceScaled}
        handleGoBack={handleGoBack}
        disableSubmitButton={disableSubmitButton}
        isSubmitButtonLoading={isSubmitButtonLoading}
      />
    ),
  }

  const currentStep = useMemo(() => getCardContentStep(isB3trToVot3), [isB3trToVot3])

  const StepComponentContent = stepComponents[currentStep] || null

  if (mutationData.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        confirmationTitle={swapText}
        successTitle={t("Swap Completed!")}
        status={mutationData.error ? TransactionModalStatus.Error : (mutationData.status as TransactionModalStatus)}
        errorDescription={mutationData.error?.reason}
        errorTitle={mutationData.error ? t("Error swapping") : undefined}
        showTryAgainButton
        onTryAgain={handleConvertB3tr}
        pendingTitle={t("Swapping...")}
        showSocialButtons
        socialDescriptionEncoded="%F0%9F%94%84%20Just%20swapped%20between%20B3TR%20and%20VOT3%20on%20%23VeBetterDAO%21%20%0A%0A%F0%9F%8C%B1%20Explore%20and%20join%20us%20at%20https%3A%2F%2Fvebetterdao.org.%0A%0A%23VeBetterDAO%20%23Vechain"
        showExplorerButton
        txId={mutationData.txReceipt?.meta.txID}
        isSwap
        b3trBalanceAfterSwap={b3trBalanceAfterSwap}
        vot3BalanceAfterSwap={vot3BalanceAfterSwap}
        b3trBalance={b3trBalanceScaled}
        vot3Balance={vot3BalanceScaled}
      />
    )

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} trapFocus={true} isCentered={true}>
        <ModalOverlay />
        <CustomModalContent w={"auto"} maxW={"container.md"}>
          <Card rounded={20}>
            <CardBody>{StepComponentContent}</CardBody>
          </Card>
        </CustomModalContent>
      </Modal>
      <UpgradeSmartAccountModal isOpen={isSAUpgradeModalOpen} onClose={onCloseUpgradeModal} />
    </>
  )
}
