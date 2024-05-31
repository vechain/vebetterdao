import { useCallback, useMemo, useState } from "react"
import { SupportInstructions } from "./components/SupportInstructions"
import { Modal, ModalBody, ModalCloseButton, ModalOverlay } from "@chakra-ui/react"
import { CustomModalContent } from "@/components"
import { SupportDeposit } from "./components/SupportDeposit"
import { TransactionModal } from "@/components/TransactionModal"
import { useProposalVot3Deposit } from "@/hooks/useProposalVot3Deposit"
import { useCurrentProposal } from "@/api"

export const CommunitySupportModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { proposal } = useCurrentProposal()
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

  if (depositMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        successTitle={"Deposit Completed!"}
        status={depositMutation.error ? "error" : depositMutation.status}
        errorDescription={depositMutation.error?.reason}
        errorTitle={depositMutation.error ? "Error Depositing" : undefined}
        pendingTitle="Depositing..."
        showSocialButtons
        socialDescriptionEncoded={encodeURIComponent(
          "🔄 Just supported a proposal on #VeBetterDAO! \n\n🌱 Explore and join us at https://vebetterdao.org.\n\n#VeBetterDAO #Vechain",
        )}
        showExplorerButton
        txId={depositMutation.txReceipt?.meta.txID ?? depositMutation.sendTransactionTx?.txid}
      />
    )

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size={"xl"}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalCloseButton />
        <ModalBody p={8}>{stepContent}</ModalBody>
      </CustomModalContent>
    </Modal>
  )
}
