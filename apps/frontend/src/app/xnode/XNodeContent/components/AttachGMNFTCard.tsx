import { useSelectedGmNft, useXNode } from "@/api"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"
import { FeatureFlagWrapper } from "@/components"
import { FeatureFlag } from "@/constants"
import {
  Box,
  Button,
  Card,
  CardBody,
  Flex,
  Heading,
  HStack,
  Image,
  Skeleton,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { UilInfoCircle, UilLink, UilLinkBroken } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa6"
import { BaseTooltip } from "@/components"

export const AttachGMNFTCard = () => {
  const { t } = useTranslation()
  const { gmId, gmImage, gmName, gmRewardMultiplier, isGMLoading, gmLevel } = useSelectedGmNft()
  const { isXNodeDelegator } = useXNode()

  const { isXNodeAttachedToGM } = useXNode()

  const router = useRouter()
  const goToGmNftPage = useCallback(() => {
    router.push("/galaxy-member")
  }, [router])

  const attachGmToXNodeModal = useDisclosure()
  const detachGmToXNodeModal = useDisclosure()

  if (!Number(gmId)) {
    return null
  }

  return (
    <Card variant="baseWithBorder" w="full">
      <CardBody>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="lg">{t(isXNodeAttachedToGM ? "Attached GM" : "Attach to upgrade")}</Heading>
              <BaseTooltip text={t("Once the GM NFT is attached to your XNode, it can't be transferred anymore")}>
                <Box as="button">
                  <UilInfoCircle color="#004CFC" />
                </Box>
              </BaseTooltip>
            </HStack>
            <Text fontSize="sm">
              {t(
                isXNodeAttachedToGM
                  ? "Your XNode is attached to the following GM NFT"
                  : isXNodeDelegator
                    ? "Remove the XNode delegation to attach GM NFT to this node"
                    : "Attach your Node to your GM NFT to upgrade it for free and earn more rewards!",
              )}
            </Text>
          </VStack>
          <Flex border="1px solid" rounded="12px" position="relative" onClick={goToGmNftPage} cursor="pointer">
            <Image
              src={"/images/nft-page-background.png"}
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
              <Skeleton isLoaded={!isGMLoading} w={"68px"} h={"68px"} rounded="8px">
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
                <Text fontWeight={700} noOfLines={1}>
                  {gmName}
                </Text>
                <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
                  <HStack gap={1}>
                    <Text fontSize="sm" fontWeight={600}>
                      {gmRewardMultiplier}
                      {"x"}
                    </Text>
                    <Text fontSize="sm" fontWeight={400} noOfLines={1}>
                      {t("Voting reward multiplier")}
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
              isDisabled={isXNodeDelegator}
              onClick={detachGmToXNodeModal.onOpen}>
              {t("Detach")}
            </Button>
          ) : (
            <FeatureFlagWrapper
              feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
              fallback={
                <Button leftIcon={<UilLink color="#004CFC" />} variant={"primarySubtle"} isDisabled={true}>
                  {t("Coming soon!")}
                </Button>
              }>
              <Button
                leftIcon={<UilLink color="#004CFC" />}
                variant={"primarySubtle"}
                onClick={attachGmToXNodeModal.onOpen}
                isDisabled={isXNodeDelegator}>
                {t("Attach now!")}
              </Button>
            </FeatureFlagWrapper>
          )}
        </VStack>
      </CardBody>
      <AttachGMToXNodeModal isOpen={attachGmToXNodeModal.isOpen} onClose={attachGmToXNodeModal.onClose} />
      <DetachGMToXNodeModal isOpen={detachGmToXNodeModal.isOpen} onClose={detachGmToXNodeModal.onClose} />
    </Card>
  )
}
