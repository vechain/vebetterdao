import { CustomModalContent, TransactionModal } from "@/components"
import { useDetachGMFromXNode } from "@/hooks"
import {
  Modal,
  ModalOverlay,
  ModalBody,
  VStack,
  Heading,
  Text,
  Button,
  ModalCloseButton,
  ModalHeader,
  ModalFooter,
} from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

type Props = {
  isOpen: boolean
  onClose: () => void
  detachToActive?: boolean
}

export const DetachGMToXNodeModal = ({ isOpen, onClose, detachToActive }: Props) => {
  const { t } = useTranslation()

  const detachGMFromXNodeMutation = useDetachGMFromXNode({
    onSuccess: onClose,
  })

  const handleDetachment = useCallback(() => {
    detachGMFromXNodeMutation.resetStatus()
    detachGMFromXNodeMutation.sendTransaction(undefined)
  }, [detachGMFromXNodeMutation])

  if (detachGMFromXNodeMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={onClose}
        successTitle={t("Detach GM from Node")}
        status={detachGMFromXNodeMutation.error ? "error" : detachGMFromXNodeMutation.status}
        errorDescription={detachGMFromXNodeMutation.error?.reason}
        errorTitle={detachGMFromXNodeMutation.error ? t("Error detaching") : undefined}
        showTryAgainButton
        onTryAgain={handleDetachment}
        pendingTitle={t("Detaching GM from Node...")}
        showExplorerButton
        txId={detachGMFromXNodeMutation.txReceipt?.meta.txID ?? detachGMFromXNodeMutation.sendTransactionTx?.txid}
      />
    )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={"2xl"}>
      <ModalOverlay />
      <CustomModalContent>
        <ModalCloseButton />
        <ModalHeader>
          <Heading fontSize="lg">{t("Detach Node from GM NFT")}</Heading>
        </ModalHeader>
        <ModalBody>
          {detachToActive ? (
            <Text>
              {t("To active the selected GM NFT, you need to detach the node from the previous attached node.")}
            </Text>
          ) : (
            <Text>{t("Detaching your Node will downgrade your GM level to the one it was before.")}</Text>
          )}
        </ModalBody>
        <ModalFooter w="full">
          <VStack align="stretch" w="full">
            <Button variant={"primaryAction"} w={"full"} onClick={handleDetachment}>
              {t("Detach my Node")}
            </Button>
            <Button variant={"secondaryAction"} w={"full"} onClick={onClose}>
              {t("Maybe later")}
            </Button>
          </VStack>
        </ModalFooter>
      </CustomModalContent>
    </Modal>
  )
}
