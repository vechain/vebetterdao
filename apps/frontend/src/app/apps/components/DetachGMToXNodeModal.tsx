import { VStack, Heading, Text, Button, HStack } from "@chakra-ui/react"
import { useCallback } from "react"
import { useTranslation, Trans } from "react-i18next"
import { IoWarningOutline } from "react-icons/io5"

import { BaseModal } from "@/components/BaseModal"
import { gmNfts } from "@/constants/gmNfts"
import { useTransactionModal } from "@/providers/TransactionModalProvider"
import AnalyticsUtils from "@/utils/AnalyticsUtils/AnalyticsUtils"

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
    <BaseModal
      isOpen={isOpen && !isTxModalOpen}
      onClose={handleClose}
      ariaTitle={t("Detach Node from GM NFT")}
      showCloseButton>
      <VStack align="stretch" gap={6}>
        <Heading textStyle="xl">{t("Detach Node from GM NFT")}</Heading>

        {willDowngrade && (
          <HStack w="full" px={5} py={4} borderRadius="xl" bg="bg.error">
            <IoWarningOutline size={80} color="var(--chakra-colors-fg-error)" />
            <Text color="fg.error" textStyle="sm">
              <Trans
                i18nKey="Detaching your Node will downgrade your GM to <bold>level {{level}} ({{name}})</bold>. Your reward weight will drop from {{currentMultiplier}}x to {{afterMultiplier}}x, reducing your share of the GM Rewards Pool."
                values={{
                  level: levelAfterDetach,
                  name: levelAfterName,
                  currentMultiplier,
                  afterMultiplier,
                }}
                components={{ bold: <Text as="span" color="fg.error" fontWeight="semibold" /> }}
              />
            </Text>
          </HStack>
        )}

        <Text textStyle="sm" color="text.subtle">
          {t("Your Node will be freed and can be attached to another GM NFT. You can always re-attach it later.")}
        </Text>

        <VStack align="stretch" w="full">
          <Button colorPalette="red" w="full" onClick={handleDetachment}>
            {t("Detach my Node")}
          </Button>
          <Button variant="link" w="full" onClick={handleClose}>
            {t("Keep attached")}
          </Button>
        </VStack>
      </VStack>
    </BaseModal>
  )
}
