import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button, useDisclosure } from "@chakra-ui/react"
import { useSelectGM } from "@/hooks"
import { useSelectedGmNft } from "@/api"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"
import { Tooltip } from "@/components/ui/tooltip"

interface SelectGMButtonProps {
  tokenId: string
  isSelected: boolean
}

export const SelectGMButton: React.FC<SelectGMButtonProps> = ({ tokenId, isSelected }) => {
  const { t } = useTranslation()
  const selectGMMutation = useSelectGM({ tokenId })
  const { isXNodeAttachedToGM } = useSelectedGmNft()

  const detachGMModal = useDisclosure()

  const handleSelectGM = useCallback(() => {
    selectGMMutation.sendTransaction()
  }, [selectGMMutation])

  return (
    <>
      <Tooltip
        content={t(isXNodeAttachedToGM ? "Detach the node from the NFT before activating a new one" : "", {
          defaultValue: "",
        })}
        disabled={isSelected}>
        <Button variant="primarySubtle" w="full" disabled={isSelected} onClick={handleSelectGM}>
          {t(isSelected ? "Active NFT" : "Select as active")}
        </Button>
      </Tooltip>

      <DetachGMToXNodeModal isOpen={detachGMModal.open} onClose={detachGMModal.onClose} />
    </>
  )
}
