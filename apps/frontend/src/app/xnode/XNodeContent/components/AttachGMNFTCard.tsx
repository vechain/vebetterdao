import { Button, Card, Flex, Heading, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"

import { useGetUserGMs, UserGM } from "../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { UserNode } from "../../../../api/contracts/xNodes/useGetUserNodes"
import { GMNFTCard } from "../../../../components/GMNFTCard"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../../../../constants/AnalyticsEvents"
import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"

export const AttachGMNFTCard = ({ node }: { node: UserNode }) => {
  const { t } = useTranslation()
  const { data: userGms, isLoading: isUserGmsLoading } = useGetUserGMs()

  const attachGmToXNodeModal = useDisclosure()
  const detachGmToXNodeModal = useDisclosure()

  const handleDetachOnClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    detachGmToXNodeModal.onOpen()
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.DETACHING_GM_FROM_XNODE))
  }
  const handleAttachOnClick = () => {
    attachGmToXNodeModal.onOpen()
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.DETACHING_GM_FROM_XNODE))
  }

  // Derive all data at the top
  const isNodeDelegator = (!node?.currentUserIsManager && node?.currentUserIsOwner) ?? false
  const isNodeAttachedToGM = node?.isGmAttached
  const attachedGMNFT = userGms?.find((_gm: UserGM) => _gm.tokenId === node?.gmAttachedTokenId.toString())

  if (!attachedGMNFT) return null

  // Extract data to avoid repeated type assertions
  const gmTokenId = attachedGMNFT.tokenId
  const gmTokenLevel = attachedGMNFT.tokenLevel

  return (
    <Card.Root variant="primary" w="full">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading textStyle="lg">
                {t(isNodeAttachedToGM ? "Attached Galaxy Member NFTs" : "Attach to upgrade")}
              </Heading>
            </HStack>
            <Text textStyle="sm">
              {t(
                isNodeAttachedToGM
                  ? "Your Node is attached to the following GM NFT"
                  : isNodeDelegator
                    ? "Remove the Node delegation to attach GM NFT to this node"
                    : "Attach your Node to your GM NFT to upgrade it for free and earn more rewards!",
              )}
            </Text>
          </VStack>
          <Flex asChild rounded="12px" position="relative" cursor="pointer">
            <NextLink href={`/galaxy-member/${attachedGMNFT?.tokenId}`}>
              <GMNFTCard
                imageUrl={attachedGMNFT?.metadata?.image}
                name={attachedGMNFT?.metadata?.name}
                tokenLevel={Number(attachedGMNFT?.tokenLevel)}
                multiplier={attachedGMNFT?.multiplier}
                isLoading={isUserGmsLoading}
                size="medium">
                {isNodeAttachedToGM ? (
                  <Button colorPalette="red" disabled={isNodeDelegator} onClick={handleDetachOnClick}>
                    {t("Detach")}
                  </Button>
                ) : (
                  <Button variant="link" onClick={() => handleAttachOnClick()} disabled={isNodeDelegator}>
                    {t("Attach")}
                  </Button>
                )}
              </GMNFTCard>
            </NextLink>
          </Flex>
        </VStack>
      </Card.Body>
      <AttachGMToXNodeModal
        gmId={gmTokenId}
        node={node}
        isOpen={attachGmToXNodeModal.open}
        onClose={attachGmToXNodeModal.onClose}
      />
      <DetachGMToXNodeModal
        gmId={gmTokenId}
        gmLevel={gmTokenLevel}
        xNodeId={node.id.toString()}
        isOpen={detachGmToXNodeModal.open}
        onClose={detachGmToXNodeModal.onClose}
      />
    </Card.Root>
  )
}
