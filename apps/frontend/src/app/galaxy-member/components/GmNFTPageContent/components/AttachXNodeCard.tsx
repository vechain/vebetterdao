import { useSelectedGmNft, useXNode } from "@/api"
import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"
import { FeatureFlagWrapper } from "@/components"
import { FeatureFlag } from "@/constants"
import { Button, Card, CardBody, Flex, Heading, HStack, Image, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UilInfoCircle, UilLinkBroken } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa6"

export const AttachXNodeCard = () => {
  const { t } = useTranslation()
  const { gmId } = useSelectedGmNft()
  const { xNodeName, xNodeImage, xNodePoints, isXNodeHolder, attachedGMTokenId, isXNodeAttachedToGM } = useXNode()

  const router = useRouter()
  const goToXnodePage = useCallback(() => {
    router.push("/xnode")
  }, [router])

  const attachGmToXNodeModal = useDisclosure()
  const detachGmToXNodeModal = useDisclosure()

  const description = useMemo(() => {
    if (isXNodeAttachedToGM) {
      if (attachedGMTokenId && attachedGMTokenId !== gmId) {
        return t("You have attached this Node to a different GM NFT. Detach it to attach to this GM NFT.")
      }
      return t("Your GM NFT is attached to this Node. You can detach it anytime.")
    }
    return t("Attach your Node to your GM NFT to upgrade it for free and earn more rewards!")
  }, [attachedGMTokenId, gmId, isXNodeAttachedToGM, t])

  if (!isXNodeHolder) {
    return null
  }
  return (
    <Card variant="baseWithBorder" w="full">
      <CardBody>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="lg">{t(isXNodeAttachedToGM ? "Attached Node" : "Attach to upgrade")}</Heading>
              <UilInfoCircle color="#004CFC" />
            </HStack>
            <Text fontSize="sm">{description}</Text>
          </VStack>
          <Flex border="1px solid" rounded="12px" position="relative">
            <Image
              src={"/images/xnode-page-background.png"}
              alt="gm-nft-header"
              position={"absolute"}
              rounded={"12px"}
              left={0}
              top={0}
              w="100%"
              h="100%"
              zIndex={0}
            />
            <HStack
              p="9px 12px"
              justify="space-between"
              gap={6}
              flex={1}
              zIndex={1}
              color="#FFFFFF"
              onClick={goToXnodePage}>
              <Image src={xNodeImage} alt="gm" w="68px" h="68px" rounded="8px" />
              <VStack flex="1" align={"flex-start"}>
                <Text fontWeight={700} noOfLines={1}>
                  {xNodeName}
                </Text>
                <HStack gap={1}>
                  <Text fontSize="sm" fontWeight={600}>
                    {xNodePoints}
                  </Text>
                  <Text fontSize="sm" fontWeight={400} noOfLines={1}>
                    {t("to endorse Apps")}
                  </Text>
                </HStack>
              </VStack>
              <FaChevronRight size={"24px"} />
            </HStack>
          </Flex>
          {isXNodeAttachedToGM ? (
            <Button
              leftIcon={<UilLinkBroken color="#C84968" />}
              color="#C84968"
              variant={"link"}
              onClick={detachGmToXNodeModal.onOpen}>
              {t("Detach")}
            </Button>
          ) : (
            <FeatureFlagWrapper
              feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
              fallback={
                <Button leftIcon={<UilLinkBroken color="#004CFC" />} variant={"primarySubtle"} isDisabled={true}>
                  {t("Coming soon!")}
                </Button>
              }>
              <Button
                leftIcon={<UilLinkBroken color="#004CFC" />}
                variant={"primarySubtle"}
                onClick={attachGmToXNodeModal.onOpen}>
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
