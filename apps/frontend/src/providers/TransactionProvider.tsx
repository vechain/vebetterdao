import { TransactionApprovalModal } from "@/components/TransactionModal/TransactionApprovalModal/TransactionApprovalModal"
import { useDisclosure } from "@chakra-ui/react"
import { UseSendTransactionReturnValue, useWallet } from "@vechain/vechain-kit"
import { createContext, useContext, useState, ReactNode } from "react"

type TransactionContextType = {
  requestApproval: (executeTx: () => Promise<any>) => Promise<any>
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined)

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const { isOpen, onOpen: openApprovalModal, onClose: closeApprovalModal } = useDisclosure()

  const [executeTransaction, setExecuteTransaction] = useState<(() => Promise<any>) | null>(null)
  const [rejectTransaction, setRejectTransaction] = useState<(() => void) | null>(null)

  const {
    connection: { isConnectedWithDappKit: isConnectedWithRegularWallet },
  } = useWallet()

  const requestApproval = (txFn: () => Promise<UseSendTransactionReturnValue>) => {
    if (isConnectedWithRegularWallet) {
      return Promise.all([txFn()])
    }

    return new Promise<UseSendTransactionReturnValue>((resolve, reject) => {
      setExecuteTransaction(() => async () => {
        try {
          closeApprovalModal() // Close modal
          const result = await txFn() // Execute transaction
          resolve(result)
        } catch (error) {
          reject(error instanceof Error ? error : new Error(String(error)))
        }
      })
      setRejectTransaction(() => () => {
        reject(new Error("Transaction rejected by user")) // Reject the promise when user cancels
        closeApprovalModal()
      })

      openApprovalModal() // Open modal
    })
  }

  return (
    <TransactionContext.Provider value={{ requestApproval }}>
      {children}
      <TransactionApprovalModal
        isOpen={isOpen}
        onClose={() => rejectTransaction?.()}
        onApprove={() => executeTransaction?.()}
        onReject={() => rejectTransaction?.()}
      />
    </TransactionContext.Provider>
  )
}

export const useTransaction = () => {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error("useTransaction must be used within a TransactionProvider")
  }
  return context
}
