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
}

export const DetachGMToXNodeModal = ({ isOpen, onClose }: Props) => {
  const { t } = useTranslation()

  const detachGMFromXNodeMutation = useDetachGMFromXNode({
    onSuccess: () => {
      detachGMFromXNodeMutation.resetStatus()
      onClose()
    },
  })

  const handleClose = useCallback(() => {
    detachGMFromXNodeMutation.resetStatus()
    onClose()
  }, [detachGMFromXNodeMutation, onClose])

  const handleDetachment = useCallback(() => {
    detachGMFromXNodeMutation.resetStatus()
    detachGMFromXNodeMutation.sendTransaction(undefined)
  }, [detachGMFromXNodeMutation])

  if (detachGMFromXNodeMutation.status !== "ready")
    return (
      <TransactionModal
        isOpen={isOpen}
        onClose={handleClose}
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
    <Modal isOpen={isOpen} onClose={handleClose} size={"2xl"}>
      <ModalOverlay />
      <CustomModalContent p={{ base: 3, md: 5 }}>
        <ModalCloseButton />
        <ModalHeader>
          <Heading fontSize="lg">{t("Detach Node from GM NFT")}</Heading>
        </ModalHeader>
        <ModalBody>
          <Text>{t("Detaching your Node will downgrade your GM level to the one it was before.")}</Text>
        </ModalBody>
        <ModalFooter w="full">
          <VStack align="stretch" w="full">
            <Button variant={"primaryAction"} w={"full"} onClick={handleDetachment}>
              {t("Detach my Node")}
            </Button>
            <Button variant={"secondaryAction"} w={"full"} onClick={handleClose}>
              {t("Maybe later")}
            </Button>
          </VStack>
        </ModalFooter>
      </CustomModalContent>
    </Modal>
  )
}
