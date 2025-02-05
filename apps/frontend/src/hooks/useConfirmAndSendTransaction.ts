import { TransactionStatus, useSendTransaction, UseSendTransactionReturnValue } from "@vechain/vechain-kit"
import { useTransaction } from "@/providers/TransactionProvider"
import { useState } from "react"

export const useConfirmAndSendTransaction = (props: any): UseSendTransactionReturnValue => {
  const { requestApproval } = useTransaction()
  const sendTxResult = useSendTransaction(props)

  const [isAwaitingApproval, setIsAwaitingApproval] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const sendTransactionWithApproval = async (...args: Parameters<typeof sendTxResult.sendTransaction>) => {
    setIsAwaitingApproval(true)
    setError(null)
    try {
      await requestApproval(async () => {
        setIsAwaitingApproval(false)
        return sendTxResult.sendTransaction(...args)
      })
    } catch (error) {
      setIsAwaitingApproval(false)
      setError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  let internalStatus: TransactionStatus
  if (error) {
    internalStatus = "error"
  } else if (isAwaitingApproval) {
    internalStatus = "waitingConfirmation"
  } else {
    internalStatus = sendTxResult.status
  }

  return {
    ...sendTxResult,
    status: internalStatus, // Override status
    isTransactionPending: (isAwaitingApproval && !error) || sendTxResult.isTransactionPending,
    sendTransaction: sendTransactionWithApproval,
    ...(error ? { error: { type: "UserRejectedError", reason: "User Rejected Transaction" } } : null),
  }
}
