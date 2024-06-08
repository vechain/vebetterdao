import { useCurrentProposal } from "@/api"
import { useProposalOperationState } from "@/api/contracts/governance/hooks/useProposalOperationState"
import { TransactionModal } from "@/components/TransactionModal"
import { useExecuteProposal } from "@/hooks/useExecuteProposal"
import { timestampToTimeLeft } from "@/utils"
import { Box, Button, Text, useDisclosure } from "@chakra-ui/react"
import { t } from "i18next"
import { useCallback, useEffect, useState } from "react"

export const ProposalExecuteButton = () => {
  const [_, setSeconds] = useState(0)
  const { proposal } = useCurrentProposal()
  const executeMutation = useExecuteProposal({ proposalId: proposal.id })
  const { isOpen, onClose, onOpen } = useDisclosure()
  const executeProposal = useCallback(() => {
    onOpen()
    executeMutation.sendTransaction({})
  }, [executeMutation, onOpen])
  const handleClose = useCallback(() => {
    onClose()
    executeMutation.resetStatus()
  }, [onClose, executeMutation])
  const { isLoading, isOperationDone, isOperationWaiting, readyTimestamp } = useProposalOperationState(proposal.id)

  useEffect(() => {
    if (isOperationWaiting) {
      const interval = setInterval(() => {
        setSeconds(s => s + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isOperationWaiting])

  if (isOperationDone || isLoading) {
    return null
  }
  if (isOperationWaiting) {
    return (
      <Text color="orange" my={2} fontSize={"14px"}>
        {t("Executable in {{timestamp}}", {
          timestamp: timestampToTimeLeft(readyTimestamp * 1000),
        })}
      </Text>
    )
  }
  return (
    <Box>
      <Button my="2" onClick={executeProposal} variant={"primaryAction"}>
        {t("Execute Proposal")}
      </Button>
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
        successTitle={"Execute proposal completed!"}
        status={executeMutation.error ? "error" : executeMutation.status}
        errorDescription={executeMutation.error?.reason}
        errorTitle={executeMutation.error ? "Error executing proposal" : undefined}
        pendingTitle="Executing..."
        showExplorerButton
        txId={executeMutation.txReceipt?.meta.txID ?? executeMutation.sendTransactionTx?.txid}
      />
    </Box>
  )
}
