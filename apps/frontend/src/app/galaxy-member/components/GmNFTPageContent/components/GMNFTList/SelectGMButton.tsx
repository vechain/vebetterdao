import { useCallback, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, useDisclosure, Tooltip } from "@chakra-ui/react"
import { TransactionModal } from "@/components"
import { useSelectGM } from "@/hooks"
import { useSelectedGmNft } from "@/api"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"

interface SelectGMButtonProps {
  tokenId: string
  isSelected: boolean
}

export const SelectGMButton: React.FC<SelectGMButtonProps> = ({ tokenId, isSelected }) => {
  const { t } = useTranslation()
  const selectGMMutation = useSelectGM({ tokenId })
  const { isXNodeAttachedToGM } = useSelectedGmNft()

  const selectGMModal = useDisclosure()
  const detachGMModal = useDisclosure()
  const [detachToActive, setDetachToActive] = useState(false)

  const handleSelectGM = useCallback(() => {
    if (isXNodeAttachedToGM) {
      setDetachToActive(true)
      detachGMModal.onOpen()
      // todo : for a smother flow -> just after the after the detach is done, then sendTransaction the problem is that the sendTransaction is being called to soon
      // selectGMMutation.status === "success" && selectGMMutation.sendTransaction({})
    } else {
      selectGMMutation.sendTransaction({})
      selectGMModal.onOpen()
    }
  }, [selectGMModal, selectGMMutation, detachGMModal, isXNodeAttachedToGM])

  const onTryAgain = useCallback(() => {
    selectGMMutation.resetStatus()
    selectGMMutation.sendTransaction({})
  }, [selectGMMutation])

  console.log("isSelected", isSelected, "isXNodeAttachedToGM", isXNodeAttachedToGM)
  return (
    <>
      <Tooltip
        p={"2"}
        rounded="10px"
        label={t(isXNodeAttachedToGM ? "Detach the node from the NFT before activating a new one" : "", {
          defaultValue: "",
        })}
        isDisabled={isSelected}>
        <Button variant="primarySubtle" w="full" isDisabled={isSelected} onClick={handleSelectGM}>
          {t(isSelected ? "Active NFT" : "Select as active")}
        </Button>
      </Tooltip>

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
      <DetachGMToXNodeModal
        isOpen={detachGMModal.isOpen}
        onClose={detachGMModal.onClose}
        detachToActive={detachToActive}
      />
    </>
  )
}
