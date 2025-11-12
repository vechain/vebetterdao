import { Dialog, VStack, Heading, Text, Button, HStack, CloseButton } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation, Trans } from "react-i18next"
import { IoWarningOutline } from "react-icons/io5"

import { useTransactionModal } from "@/providers/TransactionModalProvider"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

import { CustomModalContent } from "../../../components/CustomModalContent"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../../../constants/AnalyticsEvents"
import { useDetachGMFromXNode } from "../../../hooks/galaxyMember/useDetachGMFromXNode"
import { useGetLevelAfterDetachingNode } from "../hooks/useGetLevelAfterDetachingNode"

type Props = {
  gmId: string
  gmLevel: string
  xNodeId: string
  isOpen: boolean
  onClose: () => void
}
export const DetachGMToXNodeModal = ({ gmId, gmLevel, xNodeId, isOpen, onClose }: Props) => {
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
    <Dialog.Root open={isOpen && !isTxModalOpen} onOpenChange={details => !details.open && handleClose()}>
      <CustomModalContent p={{ base: 3, md: 5 }}>
        <Dialog.CloseTrigger>
          <CloseButton />
        </Dialog.CloseTrigger>
        <Dialog.Header>
          <Heading textStyle="xl">{t("Detach Node from GM NFT")}</Heading>
        </Dialog.Header>
        {levelAfterDetach && gmLevel !== levelAfterDetach && (
          <Dialog.Body>
            <HStack w={"full"} px={5} py={4} borderRadius={16} bg={"rgba(252, 238, 241, 1)"}>
              <IoWarningOutline size={24} color={"rgba(200, 73, 104, 1)"} />
              <Text color={"rgba(200, 73, 104, 1)"} textStyle="sm">
                <Trans
                  i18nKey="Detaching your Node will downgrade the level of the GM attached to <bold>level {{level}}</bold>."
                  values={{ level: levelAfterDetach }}
                  components={{ bold: <Text as="span" fontWeight="semibold" /> }}
                />
              </Text>
            </HStack>
          </Dialog.Body>
        )}
        <Dialog.Footer w="full">
          <VStack alignItems="stretch" w="full">
            <Button variant={"primary"} w={"full"} onClick={handleDetachment}>
              {t("Detach my Node")}
            </Button>
            <Button variant="link" w={"full"} onClick={handleClose}>
              {t("Maybe later")}
            </Button>
          </VStack>
        </Dialog.Footer>
      </CustomModalContent>
    </Dialog.Root>
  )
}
