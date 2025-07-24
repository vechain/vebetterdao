import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button, useDisclosure, Tooltip } from "@chakra-ui/react"
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

  const detachGMModal = useDisclosure()

  const handleSelectGM = useCallback(() => {
    selectGMMutation.sendTransaction()
  }, [selectGMMutation])

  return (
    <>
      <Tooltip
        p={"2"}
        rounded="10px"
        label={t(isXNodeAttachedToGM ? "Detach the node from the NFT before activating a new one" : "", {
          defaultValue: "",
        })}
        disabled={isSelected}>
        <Button variant="primarySubtle" w="full" disabled={isSelected} onClick={handleSelectGM}>
          {t(isSelected ? "Active NFT" : "Select as active")}
        </Button>
      </Tooltip>

      <DetachGMToXNodeModal isOpen={detachGMModal.isOpen} onClose={detachGMModal.onClose} />
    </>
  )
}
