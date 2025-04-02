"use-client"
import { Card, CardBody, Text, Modal, ModalOverlay } from "@chakra-ui/react"
import { useCallback, useMemo, useState } from "react"
import { useConvertB3tr, useConvertVot3, useSmartAccountUpgradeRequired } from "@/hooks"
import { useForm } from "react-hook-form"
import { CustomModalContent } from "../CustomModalContent"
import { TokenSelectionContent, SwapTokenContent } from "./components"
import { useB3trBalance, useB3trConverted, useVot3Balance } from "@/api"
import { useUpgradeSmartAccountModal, useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"
import { useTransaction } from "@/providers/TransactionProvider"

export type Props = {
  isOpen: boolean
  onClose: () => void
}

enum CardContentStep {
  SELECT_TOKEN,
  CONFIRM_SWAP,
}

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
  const { isTxModalOpen } = useTransaction()
  const { t } = useTranslation()

  const { account } = useWallet()

  const isSmartAccountUpgradeRequired = useSmartAccountUpgradeRequired()

  const { data: b3trBalance } = useB3trBalance(account?.address ?? undefined)
  const { data: vot3Balance } = useVot3Balance(account?.address ?? undefined)
  const { data: swappableVot3Balance } = useB3trConverted(account?.address ?? undefined)

  const { open: openUpgradeModal } = useUpgradeSmartAccountModal({ accentColor: "#004CFC" })

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

  return (
    <Modal isOpen={isOpen && !isTxModalOpen} onClose={handleClose} trapFocus={true} isCentered={true}>
      <ModalOverlay />
      <CustomModalContent w={"auto"} maxW={"container.md"}>
        <Card rounded={20}>
          <CardBody>{StepComponentContent}</CardBody>
        </Card>
      </CustomModalContent>
    </Modal>
  )
}
