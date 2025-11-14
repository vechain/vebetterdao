import { Button, Card, Flex, Heading, HStack, Text, useDisclosure, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"

import { useGetUserGMs } from "../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { UserNode } from "../../../../api/contracts/xNodes/useGetUserNodes"
import { GMNFTCard } from "../../../../components/GMNFTCard"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../../../../constants/AnalyticsEvents"
import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"

export const AttachGMNFTCard = ({ xNode }: { xNode: UserNode }) => {
  const { t } = useTranslation()
  const { data: userGms, isLoading: isUserGmsLoading } = useGetUserGMs()
  const isXNodeDelegator = xNode.isXNodeDelegator
  const isXNodeAttachedToGM = !!xNode.gmTokenIdAttachedToNode
  const attachedGMNFT = userGms?.find(gm => gm.tokenId === xNode.gmTokenIdAttachedToNode)
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

  if (!attachedGMNFT) return null

  return (
    <Card.Root variant="primary" w="full">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading textStyle="lg">
                {t(isXNodeAttachedToGM ? "Attached Galaxy Member NFTs" : "Attach to upgrade")}
              </Heading>
            </HStack>
            <Text textStyle="sm">
              {t(
                isXNodeAttachedToGM
                  ? "Your Node is attached to the following GM NFT"
                  : isXNodeDelegator
                    ? "Remove the Node delegation to attach GM NFT to this node"
                    : "Attach your Node to your GM NFT to upgrade it for free and earn more rewards!",
              )}
            </Text>
          </VStack>
          <Flex asChild border="1px solid" rounded="12px" position="relative" cursor="pointer">
            <NextLink href={`/galaxy-member/${attachedGMNFT?.tokenId}`}>
              <GMNFTCard
                imageUrl={attachedGMNFT?.metadata?.image}
                name={attachedGMNFT?.metadata?.name}
                tokenLevel={Number(attachedGMNFT?.tokenLevel)}
                multiplier={attachedGMNFT?.multiplier}
                isLoading={isUserGmsLoading}
                size="medium">
                {isXNodeAttachedToGM ? (
                  <Button colorPalette="red" disabled={isXNodeDelegator} onClick={handleDetachOnClick}>
                    {t("Detach")}
                  </Button>
                ) : (
                  <Button variant="link" onClick={() => handleAttachOnClick()} disabled={isXNodeDelegator}>
                    {t("Attach")}
                  </Button>
                )}
              </GMNFTCard>
            </NextLink>
          </Flex>
        </VStack>
      </Card.Body>
      <AttachGMToXNodeModal
        gmId={xNode.gmTokenIdAttachedToNode || ""}
        node={xNode}
        isOpen={attachGmToXNodeModal.open}
        onClose={attachGmToXNodeModal.onClose}
      />
      <DetachGMToXNodeModal
        gmId={xNode.gmTokenIdAttachedToNode || ""}
        gmLevel={attachedGMNFT?.tokenLevel || ""}
        xNodeId={xNode.nodeId}
        isOpen={detachGmToXNodeModal.open}
        onClose={detachGmToXNodeModal.onClose}
      />
    </Card.Root>
  )
}
