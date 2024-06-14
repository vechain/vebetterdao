import { useProposalDetail } from "@/app/proposals/[proposalId]/hooks"
import { TransactionModal } from "@/components/TransactionModal"
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
        successTitle={"Queue proposal completed!"}
        status={queueMutation.error ? "error" : queueMutation.status}
        errorDescription={queueMutation.error?.reason}
        errorTitle={queueMutation.error ? "Error queueing proposal" : undefined}
        pendingTitle="Queueing..."
        showExplorerButton
        txId={queueMutation.txReceipt?.meta.txID ?? queueMutation.sendTransactionTx?.txid}
      />
    </>
  )
}
