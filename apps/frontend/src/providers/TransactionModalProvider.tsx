import { useDisclosure } from "@chakra-ui/react"
import { TransactionStatus, TransactionStatusErrorType } from "@vechain/vechain-kit"
import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react"

type TransactionCustomUIProps = {
  title?: string
  description?: React.ReactNode
  customButton?: React.ReactNode
  showSocialButtons?: boolean
  socialDescriptionEncoded?: string
  showTransactionDetailsButton?: boolean
  hideDoneButton?: boolean
  onSuccess?: () => void
}
export type TransactionCustomUI = Partial<Record<TransactionStatus, TransactionCustomUIProps>>
interface TransactionState {
  customUI?: TransactionCustomUI
  status: TransactionStatus
  isTxModalOpen: boolean
  txId?: string
  error?: TransactionStatusErrorType
  onClose: () => void
  tryAgain?: () => Promise<void>
}
interface TransactionContextType {
  transactionModalState: TransactionState | null
  setupModal: (tryAgain?: () => Promise<void>, customUI?: TransactionCustomUI) => void
  updateModal: (status: TransactionStatus, txId?: string, error?: TransactionStatusErrorType) => void
  resetModal: () => void
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
  const [transactionModalState, setTransactionModalState] = useState<TransactionState | null>(null)
  const { open: isTxModalOpen, onOpen, onClose } = useDisclosure()

  const handleClose = useCallback(() => {
    if (transactionModalState?.status === "pending" || transactionModalState?.status === "waitingConfirmation") return //Prevent closing the modal if the transaction is pending or waiting for confirmation

    // Call onSuccess callback if transaction was successful
    if (transactionModalState?.status === "success") {
      transactionModalState?.customUI?.success?.onSuccess?.()
    }

    onClose()
    // Don't clear state immediately - let it persist during close animation
  }, [onClose, transactionModalState?.status, transactionModalState?.customUI])

  const setupModal = useCallback(
    (tryAgain?: () => Promise<void>, customUI?: TransactionCustomUI) => {
      // Clear previous state when opening new transaction
      setTransactionModalState(null)
      onOpen()
      setTransactionModalState({
        ...initialState,
        isTxModalOpen,
        onClose: handleClose,
        ...(tryAgain && { tryAgain }),
        ...(customUI && { customUI }),
      })
    },
    [isTxModalOpen, onOpen, handleClose],
  )

  const updateModal = useCallback(
    (status: TransactionStatus, txId?: string, error?: TransactionStatusErrorType) => {
      setTransactionModalState(prev => {
        if (!prev) return null
        return {
          ...prev,
          status,
          isTxModalOpen,
          onClose: handleClose,
          txId,
          error,
        }
      })
    },
    [handleClose, isTxModalOpen],
  )

  const resetModal = useCallback(() => {
    setTransactionModalState(null)
  }, [])

  const value = useMemo(
    () => ({
      transactionModalState,
      setupModal,
      updateModal,
      resetModal,
      isTxModalOpen,
      onClose: handleClose,
    }),
    [transactionModalState, setupModal, updateModal, resetModal, isTxModalOpen, handleClose],
  )

  return <TransactionContext.Provider value={value}>{children}</TransactionContext.Provider>
}
