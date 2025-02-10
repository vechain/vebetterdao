import { useWallet } from "@vechain/vechain-kit"
import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react"

type TransactionContextType = {
  checkApproval: (executeTx: () => Promise<any>) => Promise<any>
  onApprove: () => Promise<any>
  onReject: () => void
  onReset: () => void
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined)

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [executeTransaction, setExecuteTransaction] = useState<(() => Promise<any>) | null>(null)
  const [rejectTransaction, setRejectTransaction] = useState<(() => void) | null>(null)

  const {
    connection: { isConnectedWithDappKit: isConnectedWithRegularWallet },
  } = useWallet()

  const executeTx = async (
    txFn: () => Promise<void>,
    resolve: (value: void | PromiseLike<void>) => void,
    reject: (reason?: any) => void,
  ) => {
    try {
      const result = await txFn() // Execute transaction
      resolve(result)
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)))
    }
  }

  const rejectTx = (reject: (reason?: any) => void) => {
    reject(new Error("Transaction rejected by user")) // Reject the promise when user cancels
  }

  const checkApproval = useCallback(
    (txFn: () => Promise<void>) => {
      // If the user is connected with a regular wallet, execute the transaction immediately
      if (isConnectedWithRegularWallet) {
        return Promise.all([txFn()])
      }

      return new Promise<void>((resolve, reject) => {
        // Set the transaction to be executed
        setExecuteTransaction(() => () => executeTx(txFn, resolve, reject))
        // Set the transaction to be rejected
        setRejectTransaction(() => () => rejectTx(reject))
      })
    },
    [isConnectedWithRegularWallet],
  )

  const onReset = useCallback(() => {
    setExecuteTransaction(null)
    return setRejectTransaction(null)
  }, [])

  const onApprove = useCallback(async () => {
    return await executeTransaction?.()
  }, [executeTransaction])

  const onReject = useCallback(() => {
    rejectTransaction?.()
  }, [rejectTransaction])

  const contextValue = useMemo(
    () => ({ checkApproval, onApprove, onReject, onReset }),
    [checkApproval, onApprove, onReject, onReset],
  )

  return <TransactionContext.Provider value={contextValue}>{children}</TransactionContext.Provider>
}

export const useTransaction = () => {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error("useTransaction must be used within a TransactionProvider")
  }
  return context
}
