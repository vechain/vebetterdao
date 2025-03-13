import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { TransactionModal, TransactionModalStatus } from "@/components/TransactionModal"
import { useQueueProposal } from "@/hooks/useQueueProposal"
import { Button, useDisclosure } from "@chakra-ui/react"
import { t } from "i18next"
import { useCallback } from "react"

export const ProposalQueueButton = () => {
  const { proposal } = useProposalDetail()
  const queueMutation = useQueueProposal({ proposalId: proposal.id })
  const { isOpen, onClose, onOpen } = useDisclosure()
  const queueProposal = useCallback(() => {
    onOpen()
    queueMutation.sendTransaction({})
  }, [onOpen, queueMutation])
  const handleClose = useCallback(() => {
    onClose()
    queueMutation.resetStatus()
  }, [onClose, queueMutation])
  return (
    <>
      <Button my="2" onClick={queueProposal} variant={"primaryAction"}>
        {t("Queue Proposal")}
      </Button>
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        status={queueMutation.error ? TransactionModalStatus.Error : (queueMutation.status as TransactionModalStatus)}
        errorDescription={queueMutation.error?.reason}
        titles={{
          [TransactionModalStatus.Success]: t("Queue proposal completed!"),
          [TransactionModalStatus.Error]: t("Error queueing proposal"),
          [TransactionModalStatus.Pending]: t("Queueing..."),
        }}
        txId={queueMutation.txReceipt?.meta.txID}
      />
    </>
  )
}
