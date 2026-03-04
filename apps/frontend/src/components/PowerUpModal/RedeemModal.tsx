"use client"

import { BaseModal } from "@/components/BaseModal"
import { useTransactionModal } from "@/providers/TransactionModalProvider"

import { PowerDownContent } from "./PowerDownContent"

type Props = {
  isOpen: boolean
  onClose: () => void
}

export const RedeemModal = ({ isOpen, onClose }: Props) => {
  const { isTxModalOpen } = useTransactionModal()

  return (
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={onClose}
      modalProps={{ closeOnInteractOutside: true }}
      modalContentProps={{ maxW: "500px" }}>
      <PowerDownContent onClose={onClose} />
    </BaseModal>
  )
}
