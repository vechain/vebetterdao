import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react"
import { EnhancedClause, TransactionStatus } from "@vechain/vechain-kit"
import { useDisclosure } from "@chakra-ui/react"
interface TransactionState {
  status: TransactionStatus
  clauses?: EnhancedClause[]
  isTxModalOpen: boolean
  onClose: () => void
  tryAgain?: () => Promise<void>
}

interface TransactionContextType {
  transactionState: TransactionState | null
  startTransaction: (clauses: EnhancedClause[], tryAgain?: () => Promise<void>) => void
  updateTransactionStatus: (status: TransactionStatus) => void
  resetTransaction: () => void
  isTxModalOpen: boolean
  onClose: () => void
}

const initialState: TransactionState = {
  status: "pending",
  isTxModalOpen: false,
  onClose: () => {},
}

const TransactionContext = createContext<TransactionContextType | null>(null)

export const useTransactionModal = () => {
  const context = useContext(TransactionContext)
  if (!context) {
    throw new Error("useTransactionModal must be used within a TransactionModalProvider")
  }
  return context
}

interface TransactionModalProviderProps {
  children: ReactNode
}

export const TransactionModalProvider: React.FC<TransactionModalProviderProps> = ({ children }) => {
  const [transactionState, setTransactionState] = useState<TransactionState | null>(null)
  const { isOpen: isTxModalOpen, onOpen, onClose } = useDisclosure()

  const handleClose = useCallback(() => {
    if (transactionState?.status === "pending" || transactionState?.status === "waitingConfirmation") return //Prevent closing the modal if the transaction is pending or waiting for confirmation
    onClose()
    setTransactionState(null)
  }, [onClose, transactionState?.status])

  const startTransaction = useCallback(
    (clauses: EnhancedClause[], tryAgain?: () => Promise<void>) => {
      onOpen()
      setTransactionState({
        ...initialState,
        status: "pending",
        clauses,
        isTxModalOpen,
        onClose: handleClose,
        ...(tryAgain && { tryAgain }),
      })
    },
    [isTxModalOpen, onOpen, handleClose],
  )

  const updateTransactionStatus = useCallback(
    (status: TransactionStatus) => {
      setTransactionState(prev => {
        if (!prev) return null
        return {
          ...prev,
          status,
          isTxModalOpen,
          onClose: handleClose,
        }
      })
    },
    [handleClose, isTxModalOpen],
  )

  const resetTransaction = useCallback(() => {
    setTransactionState(null)
  }, [])

  const value = useMemo(
    () => ({
      transactionState,
      startTransaction,
      updateTransactionStatus,
      resetTransaction,
      isTxModalOpen,
      onClose: handleClose,
    }),
    [transactionState, startTransaction, updateTransactionStatus, resetTransaction, isTxModalOpen, handleClose],
  )

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>
}
