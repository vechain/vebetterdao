"use-client"
import { useCallback, useMemo, useState } from "react"
import {
  useConvertB3tr,
  useConvertVot3,
  useGetB3trBalance,
  useGetVot3Balance,
  useSmartAccountUpgradeRequired,
} from "@/hooks"
import { useForm } from "react-hook-form"
import { TokenSelectionContent, SwapTokenContent, ReviewSwapContent } from "./contents"
import { useB3trConverted } from "@/api"
import { useUpgradeSmartAccountModal, useWallet } from "@vechain/vechain-kit"
import { useTranslation } from "react-i18next"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { StepModal, type Step } from "../../../StepModal"
import BigNumber from "bignumber.js"

export type Props = {
  isOpen: boolean
  onClose: () => void
}

export enum ConvertStep {
  SELECT_TOKEN = "SELECT_TOKEN",
  CONFIRM_SWAP = "CONFIRM_SWAP",
  REVIEW_TX = "REVIEW_TX",
}

const STEP_COUNT = Object.keys(ConvertStep).length

export const ConvertModal = ({ isOpen, onClose }: Props) => {
  const { account } = useWallet()
  const [isB3trToVot3, setIsB3trToVot3] = useState<boolean>()
  const { isTxModalOpen } = useTransactionModal()
  const { t } = useTranslation()
  const [step, setStep] = useState(0)

  const goToNextStep = useCallback(() => {
    const nextStep = step + 1
    if (nextStep > STEP_COUNT) onClose()
    else setStep(nextStep)
  }, [step, onClose])

  const goToPrevStep = useCallback(() => {
    const prevStep = step - 1
    if (prevStep < 1) onClose()
    else setStep(prevStep)
  }, [step, onClose])

  const isSmartAccountUpgradeRequired = useSmartAccountUpgradeRequired()

  const { data: b3trBalance } = useGetB3trBalance(account?.address ?? undefined)
  const { data: vot3Balance } = useGetVot3Balance(account?.address ?? undefined)
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

  const handleClose = useCallback(() => {
    onClose()
    setIsB3trToVot3(undefined)
    setValue("amount", "")
    setStep(0)
  }, [onClose, setStep, setValue])

  const convertB3trMutation = useConvertB3tr({
    amount,
    transactionModalCustomUI: {
      waitingConfirmation: {
        title: t("Conversion in progress..."),
      },
      success: {
        title: t("Conversion Completed"),
      },
      error: {
        title: t("Error converting tokens"),
      },
    },
    onSuccess: handleClose,
  })

  const convertVot3Mutation = useConvertVot3({
    amount,
    transactionModalCustomUI: {
      waitingConfirmation: {
        title: t("Conversion in progress..."),
      },
      success: {
        title: t("Conversion Completed"),
      },
      error: {
        title: t("Error converting tokens"),
      },
    },
    onSuccess: handleClose,
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
    mutationData.sendTransaction()
  }, [isB3trToVot3, isSmartAccountUpgradeRequired, mutationData, openUpgradeModal])

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

  const convertTitle = useMemo(() => {
    return isB3trToVot3 ? t("Turn B3TR into VOT3") : t("Turn VOT3 into B3TR")
  }, [isB3trToVot3, t])

  const convertDescription = useMemo((): string => {
    return isB3trToVot3
      ? t(
          "The more VOT3 in your balance, the more voting power you'll have. Use it to vote on proposals and allocation rounds.",
        )
      : t("B3TR are the tokens that you earn through the apps and by participating on the voting sessions.")
  }, [isB3trToVot3, t])

  const steps = useMemo<Step<ConvertStep>[]>(
    () => [
      {
        key: ConvertStep.SELECT_TOKEN,
        content: <TokenSelectionContent onSubmit={goToNextStep} setIsB3trToVot3={setIsB3trToVot3} />,
        title: t("Convert tokens"),
      },
      {
        key: ConvertStep.CONFIRM_SWAP,
        content: (
          <SwapTokenContent
            formData={formData}
            goToNextStep={goToNextStep}
            amount={amount}
            isB3trToVot3={isB3trToVot3}
            swappableVot3Balance={swappableVot3Balance}
            isVOT3BalanceMoreThanStakedB3TR={isVOT3BalanceMoreThanStakedB3TR}
            b3trBalanceScaled={b3trBalanceScaled}
            vot3BalanceScaled={vot3BalanceScaled}
            disableSubmitButton={invalidAmount}
          />
        ),
        title: convertTitle,
        description: convertDescription,
      },
      {
        key: ConvertStep.REVIEW_TX,
        content: (
          <ReviewSwapContent
            onSubmitTx={handleConvertB3tr}
            b3trBalanceAfterSwap={b3trBalanceAfterSwap}
            vot3BalanceAfterSwap={vot3BalanceAfterSwap}
          />
        ),
        title: t("Review operation"),
      },
    ],
    [
      amount,
      b3trBalanceAfterSwap,
      b3trBalanceScaled,
      convertDescription,
      convertTitle,
      formData,
      goToNextStep,
      handleConvertB3tr,
      invalidAmount,
      isB3trToVot3,
      isVOT3BalanceMoreThanStakedB3TR,
      swappableVot3Balance,
      t,
      vot3BalanceAfterSwap,
      vot3BalanceScaled,
    ],
  )

  return (
    <StepModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={handleClose}
      goToPrevious={goToPrevStep}
      goToNext={goToNextStep}
      setActiveStep={setStep}
      steps={steps}
      activeStep={step}
    />
  )
}
