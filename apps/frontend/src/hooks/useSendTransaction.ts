"use client"
import { useTxReceipt } from "@/api"
import { getConfig } from "@repo/config"
import { UseMutateFunction, useMutation } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Transaction } from "thor-devkit"

type InspectClausesResponse = {
  data: string
  gasUsed: number
  reverted: boolean
  vmError: string
  events: Connex.VM.Event[]
  transfers: Connex.VM.Transfer[]
}[]

const nodeUrl = getConfig().nodeUrl

const estimateTxGasWithNext = async (clauses: Connex.VM.Clause[], caller: string, buffer = 1.25) => {
  // Send tx details to the node to get the gas estimate
  const response = await fetch(`${nodeUrl}/accounts/*?revision=next`, {
    method: "POST",
    body: JSON.stringify({
      clauses: clauses.map(clause => ({
        to: clause.to,
        value: clause.value,
        data: clause.data,
      })),
      caller,
    }),
  })

  if (!response.ok) throw new Error("Failed to estimate gas")

  const outputs = (await response.json()) as InspectClausesResponse

  const execGas = outputs.reduce((sum, out) => sum + out.gasUsed, 0)

  // Calculate the intrinsic gas (transaction fee) cast is needed as data could be undefinedin Connex.Vm.Clause
  const intrinsicGas = Transaction.intrinsicGas(clauses as Transaction.Clause[])

  // 15000 is the fee for invoking the VM
  // Gas estimate is the sum of intrinsic gas and execution gas
  const gasEstimate = intrinsicGas + (execGas ? execGas + 15000 : 0)

  // Add a % buffer to the gas estimate
  return Math.round(gasEstimate * buffer)
}

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
 * @param onTxFailedOrCancelled callback to run when the tx fails or is cancelled
 * @param suggestedMaxGas the suggested max gas for the transaction
 */
type UseSendTransactionProps = {
  signerAccount?: string | null
  clauses?: EnhancedClause[] | (() => EnhancedClause[]) | (() => Promise<EnhancedClause[]>)
  onTxConfirmed?: () => void | Promise<void>
  onTxFailedOrCancelled?: () => void | Promise<void>
  suggestedMaxGas?: number
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
  suggestedMaxGas,
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

  /**
   * Send a transaction with the given clauses (in case you need to pass data to build the clauses to mutate directly)
   * @returns see {@link UseSendTransactionReturnValue}
   */
  const sendTransaction = useCallback(
    async (clauses: EnhancedClause[]) => {
      const transaction = vendor.sign("tx", clauses)
      if (signerAccount) {
        let gasLimitNext

        try {
          gasLimitNext = await estimateTxGasWithNext([...clauses], signerAccount, 1)
        } catch (e) {
          console.error("Gas estimation failed", e)
        }

        const parsedGasLimit = Math.max(gasLimitNext ?? 0, suggestedMaxGas ?? 0)
        // specify gasLimit if we have a suggested or an estimation
        if (parsedGasLimit > 0)
          return transaction.signer(signerAccount).gas(parseInt(parsedGasLimit.toString())).request()
        else return transaction.signer(signerAccount).request()
      }
      return transaction.request()
    },
    [vendor, signerAccount, suggestedMaxGas],
  )

  /**
   * Adapter to send the transaction with the clauses passed to the hook or the ones passed to the function
   */
  const sendTransactionAdapter = useCallback(
    async (_clauses?: EnhancedClause[]) => {
      if (_clauses) return await sendTransaction(_clauses)

      if (!clauses) throw new Error("clauses are required")

      _clauses = await convertClauses(clauses)

      return await sendTransaction(_clauses)
    },
    [sendTransaction, clauses],
  )
  const {
    mutate: runSendTransaction,
    data: sendTransactionTx,
    isPending: sendTransactionPending,
    error: sendTransactionError,
    reset: resetSendTransaction,
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

  const status = useMemo(() => {
    if (sendTransactionPending) return "pending"

    if (sendTransactionError) {
      return "error"
    }

    if (sendTransactionTx?.txid) {
      if (isTxReceiptLoading) return "waitingConfirmation"
      if (txReceiptError) {
        return "error"
      }
      if (txReceipt) {
        if (txReceipt.reverted) {
          return "error"
        }
        return "success"
      }
    }

    return "ready"
  }, [
    isTxReceiptLoading,
    sendTransactionError,
    sendTransactionPending,
    sendTransactionTx?.txid,
    txReceipt,
    txReceiptError,
  ])

  useEffect(() => {
    if (sendTransactionError) {
      setError({
        type: "SendTransactionError",
        reason: sendTransactionError.message,
      })
    }

    if (sendTransactionTx?.txid) {
      if (txReceiptError) {
        setError({
          type: "TxReceiptError",
          reason: txReceiptError.message,
        })
        return
      }

      if (txReceipt) {
        if (txReceipt.reverted) {
          // TODO: move this code to a separated query
          ;(async () => {
            const revertReason = await explainTxRevertReason(txReceipt)
            setError({
              type: "RevertReasonError",
              reason: revertReason?.[0]?.revertReason ?? "Transaction reverted",
            })
          })()

          return
        }
        onTxConfirmed?.()
        return
      }
    }
  }, [
    sendTransactionPending,
    isTxReceiptLoading,
    sendTransactionError,
    txReceiptError,
    txReceipt,
    onTxConfirmed,
    explainTxRevertReason,
    sendTransactionTx?.txid,
  ])

  const resetStatus = useCallback(() => {
    resetSendTransaction()
    setError(undefined)
  }, [resetSendTransaction])

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
