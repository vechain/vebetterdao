import { useCallback, useMemo, useState } from "react"
import { SupportInstructions } from "./components/SupportInstructions"
import { Modal, ModalBody, ModalCloseButton, ModalOverlay } from "@chakra-ui/react"
import { CustomModalContent } from "@/components"
import { SupportDeposit } from "./components/SupportDeposit"
import { useProposalVot3Deposit } from "@/hooks/useProposalVot3Deposit"
import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { useTransaction } from "@/providers/TransactionProvider"
export const CommunitySupportModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { proposal } = useProposalDetail()
  const { isTxModalOpen } = useTransaction()
  const [step, setStep] = useState(0)
  const depositMutation = useProposalVot3Deposit({ proposalId: proposal.id })

  const handleClose = useCallback(() => {
    depositMutation.resetStatus()
    setStep(0)
    onClose()
  }, [depositMutation, onClose])

  const goToNextStep = useCallback(() => {
    setStep(prev => prev + 1)
  }, [])

  const onSubmit = useCallback(
    (amount: string) => {
      depositMutation.sendTransaction({ amount, proposalId: proposal.id })
    },
    [depositMutation, proposal.id],
  )

  const stepContent = useMemo(() => {
    switch (step) {
      case 0:
        return <SupportInstructions goToNextStep={goToNextStep} />
      case 1:
        return <SupportDeposit onSubmit={onSubmit} />
    }
  }, [goToNextStep, onSubmit, step])

  return (
    <Modal isOpen={isOpen && !isTxModalOpen} onClose={handleClose} size={"xl"}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalCloseButton />
        <ModalBody p={8}>{stepContent}</ModalBody>
      </CustomModalContent>
    </Modal>
  )
}
