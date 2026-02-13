import { Dialog, VStack, Heading, Text, Button, HStack, CloseButton } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation, Trans } from "react-i18next"
import { IoWarningOutline } from "react-icons/io5"

import { gmNfts } from "@/constants/gmNfts"
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
  const willDowngrade = levelAfterDetach && gmLevel !== levelAfterDetach
  const levelAfterName = gmNfts.find(nft => nft.level === levelAfterDetach)?.name
  const currentMultiplier = gmNfts.find(nft => nft.level === gmLevel)?.multiplier
  const afterMultiplier = gmNfts.find(nft => nft.level === levelAfterDetach)?.multiplier

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
        <Dialog.Body>
          <VStack align="stretch" gap={8}>
            {willDowngrade && (
              <HStack w="full" mt={4} px={5} py={4} borderRadius={16} bg="rgba(252, 238, 241, 1)">
                <IoWarningOutline size={80} color="rgba(200, 73, 104, 1)" />
                <Text color="rgba(200, 73, 104, 1)" textStyle="sm">
                  <Trans
                    i18nKey="Detaching your Node will downgrade your GM to <bold>level {{level}} ({{name}})</bold>. Your reward weight will drop from {{currentMultiplier}}x to {{afterMultiplier}}x, reducing your share of the GM Rewards Pool."
                    values={{
                      level: levelAfterDetach,
                      name: levelAfterName,
                      currentMultiplier,
                      afterMultiplier,
                    }}
                    components={{ bold: <Text as="span" color="rgba(200, 73, 104, 1)" fontWeight="semibold" /> }}
                  />
                </Text>
              </HStack>
            )}
            <Text textStyle="sm" color="text.subtle">
              {t("Your Node will be freed and can be attached to another GM NFT. You can always re-attach it later.")}
            </Text>
          </VStack>
        </Dialog.Body>
        <Dialog.Footer w="full">
          <VStack alignItems="stretch" w="full">
            <Button colorPalette="red" w="full" onClick={handleDetachment}>
              {t("Detach my Node")}
            </Button>
            <Button variant="link" w="full" onClick={handleClose}>
              {t("Keep attached")}
            </Button>
          </VStack>
        </Dialog.Footer>
      </CustomModalContent>
    </Dialog.Root>
  )
}
