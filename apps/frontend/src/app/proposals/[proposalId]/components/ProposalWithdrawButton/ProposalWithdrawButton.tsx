import { TransactionModal, TransactionModalStatus } from "@/components/TransactionModal"
import { useWithdrawDeposit } from "@/hooks/useWithdrawDeposit"
import { Button, useDisclosure } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { useProposalDetail } from "../../hooks"

export const ProposalWithdrawButton = () => {
  const { proposal } = useProposalDetail()
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
        status={
          withdrawMutation.error ? TransactionModalStatus.Error : (withdrawMutation.status as TransactionModalStatus)
        }
        errorDescription={withdrawMutation.error?.reason}
        titles={{
          [TransactionModalStatus.Success]: t("Deposit Withdraw Completed!"),
          [TransactionModalStatus.Error]: t("Error Withdrawing"),
          [TransactionModalStatus.Pending]: t("Withdrawing..."),
        }}
        txId={withdrawMutation.txReceipt?.meta.txID}
      />
      <Button variant="primaryAction" onClick={withdraw}>
        {t("Claim your tokens back")}
      </Button>
    </>
  )
}
