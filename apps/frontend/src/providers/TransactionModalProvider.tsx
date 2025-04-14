import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react"
import { TransactionStatus } from "@vechain/vechain-kit"
import { useDisclosure } from "@chakra-ui/react"
interface TransactionState {
  status: TransactionStatus
  isTxModalOpen: boolean
  onClose: () => void
  tryAgain?: () => Promise<void>
}

interface TransactionContextType {
  transactionModalState: TransactionState | null
  setupModal: (tryAgain?: () => Promise<void>) => void
  updateModal: (status: TransactionStatus) => void
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
  const { isOpen: isTxModalOpen, onOpen, onClose } = useDisclosure()

  const handleClose = useCallback(() => {
    if (transactionModalState?.status === "pending" || transactionModalState?.status === "waitingConfirmation") return //Prevent closing the modal if the transaction is pending or waiting for confirmation
    onClose()
    setTransactionModalState(null)
  }, [onClose, transactionModalState?.status])

  const setupModal = useCallback(
    (tryAgain?: () => Promise<void>) => {
      onOpen()
      setTransactionModalState({
        ...initialState,
        status: "pending",
        isTxModalOpen,
        onClose: handleClose,
        ...(tryAgain && { tryAgain }),
      })
    },
    [isTxModalOpen, onOpen, handleClose],
  )

  const updateModal = useCallback(
    (status: TransactionStatus) => {
      setTransactionModalState(prev => {
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
