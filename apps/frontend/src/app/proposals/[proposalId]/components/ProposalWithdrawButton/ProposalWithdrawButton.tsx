import { useCurrentProposal } from "@/api"
import { TransactionModal } from "@/components/TransactionModal"
import { useWithdrawDeposit } from "@/hooks/useWithdrawDeposit"
import { Button, useDisclosure } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const ProposalWithdrawButton = () => {
  const { proposal } = useCurrentProposal()
  const { t } = useTranslation()
  const withdrawMutation = useWithdrawDeposit({
    proposalId: proposal.id,
  })
  const { isOpen, onClose, onOpen } = useDisclosure()

  const handleClose = useCallback(() => {
    onClose()
    withdrawMutation.resetStatus()
  }, [onClose, withdrawMutation])
  const withdraw = useCallback(
    (e: React.FormEvent) => {
      onOpen()
      withdrawMutation.sendTransaction({})
      e.preventDefault()
    },
    [onOpen, withdrawMutation],
  )
  return (
    <>
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        successTitle={"Deposit Withdraw Completed!"}
        status={withdrawMutation.error ? "error" : withdrawMutation.status}
        errorDescription={withdrawMutation.error?.reason}
        errorTitle={withdrawMutation.error ? "Error Withdrawing" : undefined}
        pendingTitle="Withdrawing..."
        showExplorerButton
        txId={withdrawMutation.txReceipt?.meta.txID ?? withdrawMutation.sendTransactionTx?.txid}
      />
      <Button variant="primaryAction" onClick={withdraw}>
        {t("Claim your tokens back")}
      </Button>
    </>
  )
}
