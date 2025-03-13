import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button, useDisclosure, Tooltip } from "@chakra-ui/react"
import { TransactionModal, TransactionModalStatus } from "@/components"
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
        status={
          selectGMMutation.error ? TransactionModalStatus.Error : (selectGMMutation.status as TransactionModalStatus)
        }
        errorDescription={selectGMMutation.error?.reason}
        onTryAgain={onTryAgain}
        titles={{
          [TransactionModalStatus.Success]: t("GM NFT selected"),
          [TransactionModalStatus.Error]: "Error selecting GM NFT",
          [TransactionModalStatus.Pending]: "Selecting GM NFT...",
        }}
        showExplorerButton
        txId={selectGMMutation.txReceipt?.meta.txID}
      />
      <DetachGMToXNodeModal isOpen={detachGMModal.isOpen} onClose={detachGMModal.onClose} />
    </>
  )
}
