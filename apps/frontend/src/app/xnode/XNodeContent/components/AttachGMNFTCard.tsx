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
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"

import { useGetUserGMs, UserGM } from "../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { getLevelGradient } from "../../../../api/contracts/galaxyMember/utils/getLevelGradient"
import { UserNode } from "../../../../api/contracts/xNodes/useGetUserNodes"
import { FeatureFlagWrapper } from "../../../../components/FeatureFlagWrapper"
import { buttonClickActions, buttonClicked, ButtonClickProperties } from "../../../../constants/AnalyticsEvents"
import { FeatureFlag } from "../../../../constants/featureFlag"
import AnalyticsUtils from "../../../../utils/AnalyticsUtils/AnalyticsUtils"

export const AttachGMNFTCard = ({ xNode }: { xNode: UserNode }) => {
  const { t } = useTranslation()
  const { data: userGms, isLoading: isUserGmsLoading } = useGetUserGMs()
  const isXNodeDelegator = false //TODO: Get if xNode is delegator
  const isXNodeAttachedToGM = false //TODO: Get if xNode is attached to a GM
  // TODO: Fetch attached GM from contract - use getAttachedGM(xNode.id)
  const attachedGMNFT = userGms?.find((gm: UserGM) => false) // TODO: Placeholder - needs proper implementation
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
            <NextLink href={`/galaxy-member/${(attachedGMNFT as any)?.tokenId ?? ""}`}>
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
              <HStack p="9px 12px" justify="space-between" gap={6} flex={1} zIndex={1} color="white">
                <Skeleton loading={isUserGmsLoading} w={"68px"} h={"68px"} rounded="8px">
                  <Box
                    w={"68px"}
                    h={"68px"}
                    rounded="8px"
                    bgGradient={getLevelGradient(Number((attachedGMNFT as any)?.tokenLevel ?? "0"))}
                    display="flex"
                    alignItems="center"
                    justifyContent="center">
                    <Image
                      src={(attachedGMNFT as any)?.metadata?.image ?? ""}
                      alt="gm"
                      w={"64px"}
                      h={"64px"}
                      rounded="7px"
                    />
                  </Box>
                </Skeleton>
                <VStack flex="1" align={"flex-start"}>
                  <Text lineClamp={1}>{(attachedGMNFT as any)?.metadata?.name ?? ""}</Text>
                  <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
                    <HStack gap={1}>
                      <Text textStyle="sm" fontWeight="semibold">
                        {(attachedGMNFT as any)?.multiplier?.toString() ?? "0"}
                        {"x"}
                      </Text>
                      <Text textStyle="sm" lineClamp={1}>
                        {t("GM reward weight")}
                      </Text>
                    </HStack>
                  </FeatureFlagWrapper>
                </VStack>
                {isXNodeAttachedToGM ? (
                  <Button colorPalette="red" disabled={isXNodeDelegator} onClick={handleDetachOnClick}>
                    {t("Detach")}
                  </Button>
                ) : (
                  <Button variant="link" onClick={() => handleAttachOnClick()} disabled={isXNodeDelegator}>
                    {t("Attach")}
                  </Button>
                )}
              </HStack>
            </NextLink>
          </Flex>
        </VStack>
      </Card.Body>
      <AttachGMToXNodeModal
        gmId={""} //TODO: Get GM ID
        node={xNode}
        isOpen={attachGmToXNodeModal.open}
        onClose={attachGmToXNodeModal.onClose}
      />
      <DetachGMToXNodeModal
        gmId={""} //TODO: Get GM ID
        gmLevel={""} //TODO: Get GM Level
        xNodeId={xNode.id.toString()}
        isOpen={detachGmToXNodeModal.open}
        onClose={detachGmToXNodeModal.onClose}
      />
    </Card.Root>
  )
}
