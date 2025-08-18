import { CustomModalContent } from "@/components"
import { useDetachGMFromXNode } from "@/hooks"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "@/constants"
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
  HStack,
} from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation, Trans } from "react-i18next"
import { IoWarningOutline } from "react-icons/io5"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import { useGetLevelAfterDetachingNode } from "../hooks/useGetLevelAfterDetachingNode"

type Props = {
  gmId: string
  xNodeId: string
  isOpen: boolean
  onClose: () => void
}

export const DetachGMToXNodeModal = ({ gmId, xNodeId, isOpen, onClose }: Props) => {
  const { t } = useTranslation()
  const { isTxModalOpen } = useTransactionModal()

  const { data: levelAfterDetach } = useGetLevelAfterDetachingNode(gmId)

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const detachGMFromXNodeMutation = useDetachGMFromXNode({
    xNodeId,
    onSuccess: handleClose,
  })

  const handleDetachment = useCallback(() => {
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.DETACHED_GM_FROM_XNODE))
    detachGMFromXNodeMutation.sendTransaction()
  }, [detachGMFromXNodeMutation])

  return (
    <Modal isOpen={isOpen && !isTxModalOpen} onClose={handleClose} size={"2xl"}>
      <ModalOverlay />
      <CustomModalContent p={{ base: 3, md: 5 }}>
        <ModalCloseButton />
        <ModalHeader>
          <Heading fontSize="lg">{t("Detach Node from GM NFT")}</Heading>
        </ModalHeader>
        <ModalBody>
          <HStack w={"full"} px={5} py={4} borderRadius={16} bg={"rgba(252, 238, 241, 1)"}>
            <IoWarningOutline size={24} color={"rgba(200, 73, 104, 1)"} />
            <Text color={"rgba(200, 73, 104, 1)"} fontSize={14}>
              <Trans
                i18nKey="Detaching your Node will downgrade the level of the GM attached to <bold>level {{level}}</bold>."
                values={{ level: levelAfterDetach }}
                components={{ bold: <Text as="span" fontWeight={"600"} /> }}
              />
            </Text>
          </HStack>
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
