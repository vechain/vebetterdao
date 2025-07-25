import { useCallback, useMemo } from "react"
import { SupportInstructions } from "./components/SupportInstructions"
import { SupportDeposit } from "./components/SupportDeposit"
import { useProposalVot3Deposit } from "@/hooks/useProposalVot3Deposit"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { useSteps } from "@chakra-ui/react"
import { Step, StepModal } from "@/components/StepModal"
import { useTranslation } from "react-i18next"

enum CommunitySupportStep {
  INSTRUCTIONS = "INSTRUCTIONS",
  DEPOSIT = "DEPOSIT",
}

export const CommunitySupportModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useTranslation()
  const { proposal } = useProposalDetail()
  const {
    value: activeStep,
    goToPrevStep: goToPrevious,
    goToNextStep: goToNext,
    setStep: setActiveStep,
  } = useSteps({
    defaultStep: 0,
    count: Object.keys(CommunitySupportStep).length,
  })

  const handleClose = useCallback(() => {
    setActiveStep(0)
    onClose()
  }, [onClose, setActiveStep])

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
      setActiveStep={setActiveStep}
      steps={steps}
      activeStep={activeStep}
    />
  )
}
