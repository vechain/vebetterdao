import { useXNode } from "@/api"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"
import { FeatureFlagWrapper } from "@/components"
import { buttonClickActions, buttonClicked, ButtonClickProperties, FeatureFlag } from "@/constants"
import { useGMNFTData } from "@/hooks/useGMNFTData"
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
import { UilLink, UilLinkBroken } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa6"

export const AttachGMNFTCard = () => {
  const { t } = useTranslation()
  const { isXNodeDelegator, isXNodeAttachedToGM, attachedGMTokenId } = useXNode()

  const { gmImage, gmName, gmLevel, gmRewardMultiplier, isLoading: isGMLoading } = useGMNFTData(attachedGMTokenId)

  const router = useRouter()
  const goToGmNftPage = useCallback(() => {
    // If I'm connected as a delegator, we cannot go to the GM NFT page of another token for now,
    // because we do not have a page that displays GM NFT info based on the tokenId
    if (isXNodeDelegator) return

    router.push("/galaxy-member")
  }, [router, isXNodeDelegator])

  const attachGmToXNodeModal = useDisclosure()
  const detachGmToXNodeModal = useDisclosure()

  const handleDetachOnClick = () => {
    detachGmToXNodeModal.onOpen()
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.DETACHING_GM_FROM_XNODE))
  }
  const handleAttachOnClick = () => {
    attachGmToXNodeModal.onOpen()
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.DETACHING_GM_FROM_XNODE))
  }

  if (!Number(attachedGMTokenId)) {
    return null
  }

  return (
    <Card.Root variant="baseWithBorder" w="full">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="lg">{t(isXNodeAttachedToGM ? "Attached GM" : "Attach to upgrade")}</Heading>
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
              <Skeleton loading={isGMLoading} w={"68px"} h={"68px"} rounded="8px">
                <Box
                  w={"68px"}
                  h={"68px"}
                  rounded="8px"
                  bgGradient={getLevelGradient(Number(gmLevel))}
                  display="flex"
                  alignItems="center"
                  justifyContent="center">
                  <Image src={gmImage} alt="gm" w={"64px"} h={"64px"} rounded="7px" />
                </Box>
              </Skeleton>
              <VStack flex="1" align={"flex-start"}>
                <Text fontWeight={700} lineClamp={1}>
                  {gmName}
                </Text>
                <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
                  <HStack gap={1}>
                    <Text fontSize="sm" fontWeight={600}>
                      {gmRewardMultiplier}
                      {"x"}
                    </Text>
                    <Text fontSize="sm" fontWeight={400} lineClamp={1}>
                      {t("GM reward weight")}
                    </Text>
                  </HStack>
                </FeatureFlagWrapper>
              </VStack>
              <FaChevronRight size={"24px"} />
            </HStack>
          </Flex>
          {isXNodeAttachedToGM ? (
            <Button
              leftIcon={<UilLinkBroken color="#C84968" />}
              color="#C84968"
              variant={"link"}
              disabled={isXNodeDelegator}
              onClick={() => handleDetachOnClick()}>
              {t("Detach")}
            </Button>
          ) : (
            <FeatureFlagWrapper
              feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
              fallback={
                <Button leftIcon={<UilLink color="#004CFC" />} variant={"primarySubtle"} disabled={true}>
                  {t("Coming soon!")}
                </Button>
              }>
              <Button
                leftIcon={<UilLink color="#004CFC" />}
                variant={"primarySubtle"}
                onClick={() => handleAttachOnClick()}
                disabled={isXNodeDelegator}>
                {t("Attach now!")}
              </Button>
            </FeatureFlagWrapper>
          )}
        </VStack>
      </Card.Body>
      <AttachGMToXNodeModal isOpen={attachGmToXNodeModal.isOpen} onClose={attachGmToXNodeModal.onClose} />
      <DetachGMToXNodeModal isOpen={detachGmToXNodeModal.isOpen} onClose={detachGmToXNodeModal.onClose} />
    </Card.Root>
  )
}
