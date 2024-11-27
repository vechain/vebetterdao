import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Button, useDisclosure } from "@chakra-ui/react"
import { CustomModalContent, TransactionModal } from "@/components"
import { useUpgradeGM } from "@/hooks"
import {
  Modal,
  ModalOverlay,
  ModalCloseButton,
  ModalHeader,
  Heading,
  ModalBody,
  Text,
  ModalFooter,
  VStack,
} from "@chakra-ui/react"

interface UpgradeGMModalProps {
  tokenId: string
  b3trToUpgradeGMToNextLevel: string
  upgradeGMModal: ReturnType<typeof useDisclosure>
}

export const UpgradeGMModal: React.FC<UpgradeGMModalProps> = ({
  tokenId,
  b3trToUpgradeGMToNextLevel,
  upgradeGMModal,
}) => {
  const { t } = useTranslation()
  const upgradeGMMutation = useUpgradeGM({
    tokenId,
    b3trToUpgrade: b3trToUpgradeGMToNextLevel,
  })

  const handleUpgradeGM = useCallback(() => {
    upgradeGMMutation.sendTransaction({})
  }, [upgradeGMMutation])

  const handleClose = useCallback(() => {
    upgradeGMMutation.resetStatus()
    upgradeGMModal.onClose()
  }, [upgradeGMMutation, upgradeGMModal])

  const onTryAgain = useCallback(() => {
    upgradeGMMutation.resetStatus()
    upgradeGMMutation.sendTransaction({})
  }, [upgradeGMMutation])

  if (upgradeGMMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={upgradeGMModal.isOpen}
        onClose={handleClose}
        successTitle={t("GM NFT upgraded")}
        status={upgradeGMMutation.error ? "error" : upgradeGMMutation.status}
        errorDescription={upgradeGMMutation.error?.reason}
        errorTitle={upgradeGMMutation.error ? "Error upgrading GM NFT" : undefined}
        showTryAgainButton
        onTryAgain={onTryAgain}
        pendingTitle={"Upgradeing GM NFT..."}
        showExplorerButton
        txId={upgradeGMMutation.txReceipt?.meta.txID ?? upgradeGMMutation.sendTransactionTx?.txid}
      />
    )

  return (
    <>
      <Modal isOpen={upgradeGMModal.isOpen} onClose={handleClose} size={"2xl"}>
        <ModalOverlay />
        <CustomModalContent>
          <ModalCloseButton />
          <ModalHeader>
            <Heading fontSize="lg">{t("Upgrade GM NFT")}</Heading>
          </ModalHeader>
          <ModalBody>
            <Text>{t("Upgrading your GM NFT will increase its level and unlock new benefits.")}</Text>
          </ModalBody>
          <ModalFooter w="full">
            <VStack align="stretch" w="full">
              <Button variant={"primaryAction"} w={"full"} onClick={handleUpgradeGM}>
                {t("Upgrade GM NFT")}
              </Button>
              <Button variant={"secondaryAction"} w={"full"} onClick={upgradeGMModal.onClose}>
                {t("Maybe later")}
              </Button>
            </VStack>
          </ModalFooter>
        </CustomModalContent>
      </Modal>
    </>
  )
}
