import { useGetUserGMs, UserNode } from "@/api"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"
import { FeatureFlagWrapper } from "@/components"
import { buttonClickActions, buttonClicked, ButtonClickProperties, FeatureFlag } from "@/constants"
import { AnalyticsUtils } from "@/utils"
import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  Image,
  Skeleton,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"

export const AttachGMNFTCard = ({ xNode }: { xNode: UserNode }) => {
  const { t } = useTranslation()
  const { data: userGms, isLoading: isUserGmsLoading } = useGetUserGMs()

  const isXNodeDelegator = xNode.isXNodeDelegator
  const isXNodeAttachedToGM = !!xNode.gmTokenIdAttachedToNode
  const attachedGMNFT = userGms?.find(gm => gm.tokenId === xNode.gmTokenIdAttachedToNode)

  const router = useRouter()
  const goToGmNftPage = useCallback(() => {
    // If I'm connected as a delegator, we cannot go to the GM NFT page of another token for now,
    // because we do not have a page that displays GM NFT info based on the tokenId
    if (isXNodeDelegator) return

    router.push(`/galaxy-member/${attachedGMNFT?.tokenId}`)
  }, [router, isXNodeDelegator, attachedGMNFT?.tokenId])

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
    <Card.Root variant="baseWithBorder" w="full">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="lg">
                {t(isXNodeAttachedToGM ? "Attached Galaxy Member NFTs" : "Attach to upgrade")}
              </Heading>
            </HStack>
            <Text fontSize="sm">
              {t(
                isXNodeAttachedToGM
                  ? "Your Node is attached to the following GM NFT"
                  : isXNodeDelegator
                    ? "Remove the Node delegation to attach GM NFT to this node"
                    : "Attach your Node to your GM NFT to upgrade it for free and earn more rewards!",
              )}
            </Text>
          </VStack>
          <Flex border="1px solid" rounded="12px" position="relative" onClick={goToGmNftPage} cursor="pointer">
            <Image
              src={"/assets/backgrounds/nft-page-background.webp"}
              alt="gm-nft-header"
              position={"absolute"}
              rounded={"12px"}
              left={0}
              top={0}
              w="100%"
              h="100%"
              zIndex={0}
            />
            <HStack p="9px 12px" justify="space-between" gap={6} flex={1} zIndex={1} color="#FFFFFF">
              <Skeleton loading={isUserGmsLoading} w={"68px"} h={"68px"} rounded="8px">
                <Box
                  w={"68px"}
                  h={"68px"}
                  rounded="8px"
                  bgGradient={getLevelGradient(Number(attachedGMNFT?.tokenLevel))}
                  display="flex"
                  alignItems="center"
                  justifyContent="center">
                  <Image src={attachedGMNFT?.metadata?.image} alt="gm" w={"64px"} h={"64px"} rounded="7px" />
                </Box>
              </Skeleton>
              <VStack flex="1" align={"flex-start"}>
                <Text fontWeight={700} lineClamp={1}>
                  {attachedGMNFT?.metadata?.name}
                </Text>
                <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
                  <HStack gap={1}>
                    <Text fontSize="sm" fontWeight={600}>
                      {attachedGMNFT?.multiplier}
                      {"x"}
                    </Text>
                    <Text fontSize="sm" fontWeight={400} lineClamp={1}>
                      {t("GM reward weight")}
                    </Text>
                  </HStack>
                </FeatureFlagWrapper>
              </VStack>
              {isXNodeAttachedToGM ? (
                <Button
                  color="#C84968"
                  variant="dangerFilledTonal"
                  disabled={isXNodeDelegator}
                  onClick={handleDetachOnClick}>
                  {t("Detach")}
                </Button>
              ) : (
                <Button variant={"primarySubtle"} onClick={() => handleAttachOnClick()} disabled={isXNodeDelegator}>
                  {t("Attach")}
                </Button>
              )}
            </HStack>
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
