import { TransactionStatus, useSendTransaction, UseSendTransactionReturnValue, useWallet } from "@vechain/vechain-kit"
import { useTransaction } from "@/providers/TransactionProvider"
import { useState } from "react"
import { TransactionModalStatus } from "@/components"

export const useConfirmAndSendTransaction = (
  props: any,
): UseSendTransactionReturnValue & {
  status: TransactionStatus | TransactionModalStatus
  onApprove: () => void
  onReject: () => void
} => {
  const {
    connection: { isConnectedWithDappKit: isConnectedWithRegularWallet },
  } = useWallet()
  const { checkApproval, onApprove, onReject, onReset } = useTransaction()
  const sendTxResult = useSendTransaction(props)

  const [internalStatus, setInternalStatus] = useState<TransactionModalStatus>(
    TransactionModalStatus.WaitingConfirmation,
  )
  const [error, setError] = useState<Error | null>(null)

  // Custom sendTransaction function to handle the approval from the Modal
  const _checkApproval = async (...args: Parameters<typeof sendTxResult.sendTransaction>) => {
    setInternalStatus(TransactionModalStatus.KitConfirmation)
    setError(null)
    try {
      //If the user is connected with a "regular wallet", skip the Kit confirmation modal status and go directly to the WaitingConfirmation status
      if (isConnectedWithRegularWallet) {
        setInternalStatus(TransactionModalStatus.WaitingConfirmation)
      }

      //Inside the provider it will either:
      // - Send the transaction directly for external approval if the user is connected with a "regular wallet"
      // - Show the Kit confirmation modal if the user is not connected with a "regular wallet"
      return await checkApproval(async () => sendTxResult.sendTransaction(...args))
    } catch (error) {
      setInternalStatus(TransactionModalStatus.Error)
      setError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  // Custom onApprove function to handle the approval from the Modal
  // Only called when the user is NOT connected with a "regular wallet" and have approved the transaction
  const _onApprove = async () => {
    //Move from KitConfirmation to WaitingConfirmation
    setInternalStatus(TransactionModalStatus.WaitingConfirmation)
    setError(null)
    //Call the onApprove function
    return onApprove()
  }

  // Custom resetStatus function to keep track of the internal status
  const _resetStatus = () => {
    //Reset the internal status
    setInternalStatus(TransactionModalStatus.WaitingConfirmation)
    setError(null)
    //Reset the sendTxResult status
    sendTxResult.resetStatus()
    //Reset the transaction provider status and functions
    return onReset()
  }

  const customStatus = (): TransactionStatus => {
    if (error) {
      return TransactionModalStatus.Error as TransactionStatus
    }
    if (internalStatus === TransactionModalStatus.KitConfirmation) {
      return internalStatus as TransactionStatus
    }
    return sendTxResult.status
  }

  return {
    ...sendTxResult,
    onApprove: _onApprove,
    onReject,
    status: customStatus(), // Override status
    isTransactionPending:
      internalStatus === TransactionModalStatus.KitConfirmation || sendTxResult.isTransactionPending,
    sendTransaction: _checkApproval,
    resetStatus: _resetStatus,
    ...(error ? { error: { type: "UserRejectedError", reason: "User Rejected Transaction" } } : null),
  }
}
