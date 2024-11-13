import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button, useDisclosure } from "@chakra-ui/react"
import { TransactionModal } from "@/components"
import { useSelectGM } from "@/hooks"

interface SelectGMButtonProps {
  tokenId: string
  isSelected: boolean
}

export const SelectGMButton: React.FC<SelectGMButtonProps> = ({ tokenId, isSelected }) => {
  const { t } = useTranslation()
  const selectGMMutation = useSelectGM({ tokenId })

  const selectGMModal = useDisclosure()
  const handleSelectGM = useCallback(() => {
    selectGMMutation.sendTransaction({})
    selectGMModal.onOpen()
  }, [selectGMModal, selectGMMutation])

  const onTryAgain = useCallback(() => {
    selectGMMutation.resetStatus()
    selectGMMutation.sendTransaction({})
  }, [selectGMMutation])

  return (
    <>
      <Button variant="primarySubtle" w="full" isDisabled={isSelected} onClick={handleSelectGM}>
        {t(isSelected ? "Active NFT" : "Select as active")}
      </Button>
      <TransactionModal
        isOpen={selectGMModal.isOpen}
        onClose={selectGMModal.onClose}
        successTitle={t("GM NFT selected")}
        status={selectGMMutation.error ? "error" : selectGMMutation.status}
        errorDescription={selectGMMutation.error?.reason}
        errorTitle={selectGMMutation.error ? "Error selecting GM NFT" : undefined}
        showTryAgainButton
        onTryAgain={onTryAgain}
        pendingTitle={"Selecting GM NFT..."}
        showExplorerButton
        txId={selectGMMutation.txReceipt?.meta.txID ?? selectGMMutation.sendTransactionTx?.txid}
      />
    </>
  )
}
