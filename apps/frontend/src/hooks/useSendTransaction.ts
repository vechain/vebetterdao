import { useTxReceipt } from "@/api"
import { UseMutateFunction, useMutation } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { useCallback, useEffect, useState } from "react"

/**
 * ready: the user has not clicked on the button yet
 * pending: the user has clicked on the button and we're waiting for the transaction to be sent
 * waitingConfirmation: the transaction has been sent and we're waiting for the transaction to be confirmed by the chain
 * success: the transaction has been confirmed by the chain
 * error: the transaction has failed
 * unknown: the transaction receipt has failed to load
 */

export type TransactionStatus = "ready" | "pending" | "waitingConfirmation" | "success" | "error" | "unknown"

export type TransactionStatusErrorType = {
  type: "SendTransactionError" | "TxReceiptError" | "RevertReasonError"
  reason?: string
}

/**
 * An enhanced clause with a comment and an abi
 * @param comment a comment to add to the clause
 * @param abi the abi of the contract to call
 */
export type EnhancedClause = Connex.VM.Clause & {
  comment?: string
  abi?: object
}

/**
 * Props for the {@link useSendTransaction} hook
 * @param signerAccount the signer account to use
 * @param clauses clauses to send in the transaction
 * @param onTxConfirmed callback to run when the tx is confirmed
 */
type UseSendTransactionProps = {
  signerAccount?: string | null
  clauses?: EnhancedClause[] | (() => EnhancedClause[]) | (() => Promise<EnhancedClause[]>)
  onTxConfirmed?: () => void | Promise<void>
  onTxFailedOrCancelled?: () => void | Promise<void>
}

/**
 * Return value of the {@link useSendTransaction} hook
 * @param sendTransaction function to trigger the transaction
 * @param sendTransactionPending boolean indicating if the transaction is waiting for the wallet to sign it
 * @param sendTransactionError error that occurred while signing the transaction
 * @param isTxReceiptLoading boolean indicating if the transaction receipt is loading from the chain
 * @param txReceiptError error that occurred while fetching the transaction receipt
 * @param txReceipt the transaction receipt
 * @param status the status of the transaction (see {@link TransactionStatus})
 * @param resetStatus function to reset the status to "ready"
 */
export type UseSendTransactionReturnValue = {
  sendTransaction: UseMutateFunction<Connex.Vendor.TxResponse, Error, EnhancedClause[] | undefined, unknown>
  sendTransactionPending: boolean
  sendTransactionError: Error | null
  sendTransactionTx: Connex.Vendor.TxResponse | null | undefined
  isTxReceiptLoading: boolean
  txReceiptError: Error | null
  txReceipt: Connex.Thor.Transaction.Receipt | null | undefined
  status: TransactionStatus
  resetStatus: () => void
  error?: TransactionStatusErrorType
}

/**
 * Generic hook to send a transaction and wait for the txReceipt
 * @param signerAccount the signer account to use
 * @param clauses clauses to send in the transaction
 * @param onTxConfirmed callback to run when the tx is confirmed
 * @returns see {@link UseSendTransactionReturnValue}
 */
export const useSendTransaction = ({
  signerAccount,
  clauses,
  onTxConfirmed,
  onTxFailedOrCancelled,
}: UseSendTransactionProps): UseSendTransactionReturnValue => {
  const { vendor, thor } = useConnex()

  async function convertClauses(
    clauses: EnhancedClause[] | (() => EnhancedClause[]) | (() => Promise<EnhancedClause[]>),
  ) {
    if (typeof clauses === "function") {
      return clauses()
    }
    return clauses
  }

  const sendTransaction = useCallback(async () => {
    if (!clauses) throw new Error("clauses is required")
    return await convertClauses(clauses).then(clauses => {
      if (signerAccount) return vendor.sign("tx", clauses).signer(signerAccount).request()
      return vendor.sign("tx", clauses).request()
    })
  }, [clauses, vendor, signerAccount])

  /**
   * Send a transaction with the given clauses (in case you need to pass data to build the clauses to mutate directly)
   * @returns see {@link UseSendTransactionReturnValue}
   */
  const sendTransactionWithClauses = useCallback(
    async (clauses: EnhancedClause[]) => {
      if (signerAccount) return vendor.sign("tx", clauses).signer(signerAccount).request()
      return vendor.sign("tx", clauses).request()
    },
    [vendor, signerAccount],
  )

  const sendTransactionAdapter = useCallback(
    async (_clauses?: EnhancedClause[]) => {
      if (_clauses) {
        return await sendTransactionWithClauses(_clauses)
      }
      return await sendTransaction()
    },
    [sendTransactionWithClauses, sendTransaction],
  )
  const {
    mutate: runSendTransaction,
    data: sendTransactionTx,
    isPending: sendTransactionPending,
    error: sendTransactionError,
  } = useMutation({
    mutationFn: sendTransactionAdapter,
    onError: error => {
      console.error(error)
      onTxFailedOrCancelled?.()
    },
  })

  const {
    data: txReceipt,
    isFetching: isTxReceiptLoading,
    error: txReceiptError,
  } = useTxReceipt(sendTransactionTx?.txid)

  const explainTxRevertReason = useCallback(
    async (txReceipt: Connex.Thor.Transaction.Receipt) => {
      if (!txReceipt.reverted) return
      const transactionData = await thor.transaction(txReceipt.meta.txID).get()
      if (!transactionData) return

      const explained = await thor.explain(transactionData.clauses).caller(transactionData.origin).execute()
      console.log("explained", explained)
      return explained
    },
    [thor],
  )

  /**
   * General error that is set when
   * - unable to send the tx
   * - unable to fetch the receipt
   * - the transaction is reverted
   */
  const [error, setError] = useState<TransactionStatusErrorType>()

  /**
   * TODO: In case of errors, call the callback
   */

  // worfklow status is one of "ready" | "pending" | "waitingConfirmation" | "success" | "error"
  // this cannot be a derived value since we need offer the possibility to reset the status
  const [status, setStatus] = useState<TransactionStatus>("ready")

  useEffect(() => {
    if (sendTransactionPending) return setStatus("pending")

    if (isTxReceiptLoading) return setStatus("waitingConfirmation")

    if (sendTransactionError) {
      setError({
        type: "SendTransactionError",
        reason: sendTransactionError.message,
      })
      return setStatus("error")
    }

    if (txReceiptError) {
      setStatus("error")
      setError({
        type: "TxReceiptError",
        reason: txReceiptError.message,
      })
      return
    }

    if (txReceipt) {
      if (txReceipt.reverted) {
        ;(async () => {
          const revertReason = await explainTxRevertReason(txReceipt)
          setError({
            type: "RevertReasonError",
            reason: revertReason?.[0]?.revertReason ?? "Transaction reverted",
          })
          setStatus("error")
        })()

        return
      }
      setStatus("success")
      onTxConfirmed?.()
      return
    }

    return setStatus("ready")
  }, [
    sendTransactionPending,
    isTxReceiptLoading,
    sendTransactionError,
    txReceiptError,
    txReceipt,
    onTxConfirmed,
    explainTxRevertReason,
  ])

  const resetStatus = useCallback(() => {
    setStatus("ready")
    setError(undefined)
  }, [])

  return {
    sendTransaction: runSendTransaction,
    sendTransactionPending,
    sendTransactionError,
    sendTransactionTx,
    isTxReceiptLoading,
    txReceiptError,
    txReceipt,
    status,
    resetStatus,
    error,
  }
}
