import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { CustomModalContent, TransactionModal } from "@/components"
import { useUpgradeGM } from "@/hooks"
import {
  Button,
  useDisclosure,
  Box,
  Image,
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
  gmImage: string
  tokenId: string
  b3trToUpgradeGMToNextLevel: string
  upgradeGMModal: ReturnType<typeof useDisclosure>
}

export const UpgradeGMModal: React.FC<UpgradeGMModalProps> = ({
  gmImage,
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
        pendingTitle={"Upgrading GM NFT..."}
        showExplorerButton
        txId={upgradeGMMutation.txReceipt?.meta.txID ?? upgradeGMMutation.sendTransactionTx?.txid}
      />
    )

  return (
    <>
      <Modal isOpen={upgradeGMModal.isOpen} onClose={handleClose} size={"2xl"}>
        <ModalOverlay />
        <CustomModalContent p={{ base: 3, md: 5 }}>
          <ModalCloseButton />
          <ModalHeader>
            <Heading fontSize="lg">{t("Upgrade GM NFT")}</Heading>
          </ModalHeader>
          <ModalBody>
            <Text size={"md"}>{t("Upgrading your GM NFT will increase its level and unlock new benefits.")}</Text>
            <VStack align="stretch" w="full" mt={4}>
              <Box
                alignSelf={"center"}
                py={10}
                px={7}
                w={"200px"}
                bgGradient={
                  "linear-gradient(137deg, rgba(178, 242, 109, 0.6) 2.2%, rgba(0, 76, 252, 0.6) 98.29%), linear-gradient(137deg, rgba(178, 242, 109, 0.6) 2.2%, rgba(0, 76, 252, 0.6) 98.29%)"
                }
                rounded={34}>
                <Box bgGradient={"linear-gradient(137deg, #B2F26D 2.2%, #004CFC 98.29%)"} p={5} rounded={34}>
                  <Box bg={"#0B0D0C"} p={3} rounded={34}>
                    <Image src={gmImage} maxW={"auto"} rounded={34} alt={`GM NFT #${tokenId}`} />
                  </Box>
                </Box>
              </Box>
            </VStack>
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
