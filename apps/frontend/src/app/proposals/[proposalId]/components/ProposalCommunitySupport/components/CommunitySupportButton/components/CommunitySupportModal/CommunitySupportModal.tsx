import { useCallback, useMemo, useState } from "react"
import { SupportInstructions } from "./components/SupportInstructions"
import { SupportDeposit } from "./components/SupportDeposit"
import { useProposalVot3Deposit } from "@/hooks/useProposalVot3Deposit"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { Step, StepModal } from "@/components/StepModal"
import { useTranslation } from "react-i18next"

enum CommunitySupportStep {
  INSTRUCTIONS = "INSTRUCTIONS",
  DEPOSIT = "DEPOSIT",
}

const STEP_COUNT = Object.keys(CommunitySupportStep).length

export const CommunitySupportModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation()
  const { proposal } = useProposalDetail()

  const [step, setStep] = useState(0)
  const goToNext = useCallback(() => {
    const nextStep = step + 1
    if (nextStep > STEP_COUNT) onClose()
    else setStep(nextStep)
  }, [step, onClose])
  const goToPrevious = useCallback(() => {
    const prevStep = step - 1
    if (prevStep < 1) onClose()
    else setStep(prevStep)
  }, [step, onClose])

  const handleClose = useCallback(() => {
    setStep(0)
    onClose()
  }, [onClose, setStep])

  const depositMutation = useProposalVot3Deposit({
    proposalId: proposal.id,
    transactionModalCustomUI: {
      waitingConfirmation: { title: t("Supporting proposal...") },
      success: { title: t("Proposal supported!") },
      error: { title: t("Error supporting proposal!") },
    },
  })

  const onSubmit = useCallback(
    (amount: string) => {
      handleClose()
      depositMutation.sendTransaction({ amount, proposalId: proposal.id })
    },
    [depositMutation, proposal.id, handleClose],
  )

  const steps = useMemo<Step<CommunitySupportStep>[]>(
    () => [
      {
        key: CommunitySupportStep.INSTRUCTIONS,
        content: <SupportInstructions goToNextStep={goToNext} />,
        title: t("What is community support?"),
      },
      {
        key: CommunitySupportStep.DEPOSIT,
        content: <SupportDeposit onSubmit={onSubmit} />,
        title: t("Support this proposal with VOT3"),
      },
    ],
    [goToNext, onSubmit, t],
  )

  return (
    <StepModal
      isOpen={isOpen}
      onClose={handleClose}
      goToPrevious={goToPrevious}
      goToNext={goToNext}
      setActiveStep={setStep}
      steps={steps}
      activeStep={step}
    />
  )
}
