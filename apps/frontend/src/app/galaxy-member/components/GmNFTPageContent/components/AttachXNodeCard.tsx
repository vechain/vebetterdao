import { useSelectedGmNft, useXNode } from "@/api"
import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"
import { FeatureFlagWrapper } from "@/components"
import { buttonClickActions, buttonClicked, ButtonClickProperties, FeatureFlag } from "@/constants"
import { AnalyticsUtils } from "@/utils"
import { Button, Card, CardBody, Flex, Heading, HStack, Image, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { UilLinkBroken } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa6"
import { IoWarningOutline } from "react-icons/io5"

export const AttachXNodeCard = () => {
  const { t } = useTranslation()
  const { isXNodeAttachedToGM, gmId, gmName: selectedGmName } = useSelectedGmNft()
  const {
    xNodeName,
    xNodeImage,
    xNodePoints,
    isXNodeHolder,
    isXNodeDelegator,
    attachedGMTokenId,
    isXNodeDelegatee,
    isXNodeAttachedToGM: xNodeHasGMAttached,
    attachedGMTokenName: attachedGmName,
  } = useXNode()

  const router = useRouter()
  const goToXnodePage = useCallback(() => {
    router.push("/xnode")
  }, [router])

  const attachGmToXNodeModal = useDisclosure()
  const detachGmToXNodeModal = useDisclosure()

  const description = useMemo(() => {
    if (isXNodeAttachedToGM || xNodeHasGMAttached) {
      if (attachedGMTokenId && attachedGMTokenId !== gmId) {
        return t("You have attached this Node to a different GM NFT. Detach it to attach to this GM NFT.")
      }
      return t("Your GM NFT is attached to this Node. You can detach it anytime.")
    }

    return t("Attach your Node to your GM NFT to upgrade it for free and earn more rewards!")
  }, [attachedGMTokenId, gmId, isXNodeAttachedToGM, t, xNodeHasGMAttached])

  const handleDetachOnClick = () => {
    detachGmToXNodeModal.onOpen()
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.DETACHING_GM_FROM_XNODE))
  }
  const handleAttachOnClick = () => {
    attachGmToXNodeModal.onOpen()
    AnalyticsUtils.trackEvent(buttonClicked, buttonClickActions(ButtonClickProperties.DETACHING_GM_FROM_XNODE))
  }

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
            </HStack>
            <Text fontSize="sm">{description}</Text>
          </VStack>
          <Flex border="1px solid" rounded="12px" position="relative" cursor="pointer">
            <Image
              src={"/assets/backgrounds/xnode-page-background.webp"}
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
                <HStack>
                  <Text fontWeight={700} noOfLines={1}>
                    {xNodeName}
                  </Text>
                  {(isXNodeDelegator || isXNodeDelegatee) && (
                    <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
                      <Text fontSize={"xs"}>{isXNodeDelegator ? "Delegator" : "Delegatee"}</Text>
                    </HStack>
                  )}
                </HStack>
                <HStack gap={1}>
                  <Text fontSize="sm" fontWeight={600}>
                    {xNodePoints}
                  </Text>
                  <Text fontSize="sm" fontWeight={400} noOfLines={1}>
                    {t("points to endorse Apps")}
                  </Text>
                </HStack>
              </VStack>
              <FaChevronRight size={"24px"} />
            </HStack>
          </Flex>
          {isXNodeAttachedToGM && (
            <HStack w={"full"} px={5} py={4} borderRadius={16} bg={"rgb(255, 250, 235)"}>
              <IoWarningOutline size={24} color={"rgb(217, 119, 6)"} />
              <Text color={"rgb(217, 119, 6)"} fontSize={14}>
                <Trans
                  i18nKey="The GM NFT is <bold>not transferable</bold> while attached to a Node."
                  components={{ bold: <Text as="span" fontWeight={"600"} /> }}
                />
              </Text>
            </HStack>
          )}
          {isXNodeAttachedToGM ? (
            <Button
              leftIcon={<UilLinkBroken color="#C84968" />}
              color="#C84968"
              variant={"link"}
              onClick={() => handleDetachOnClick()}>
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
              {xNodeHasGMAttached ? (
                <HStack w={"full"} px={5} py={4} borderRadius={16} bg={"rgb(255, 250, 235)"}>
                  <IoWarningOutline size={24} color={"rgb(217, 119, 6)"} />
                  <Text color={"rgb(217, 119, 6)"} fontSize={14}>
                    {isXNodeDelegator ? (
                      <Text>{t("Remove the Node delegation to attach GM NFT to this node")}</Text>
                    ) : (
                      <Trans
                        i18nKey="You need to <detach>detach</detach> the <bold>{{gmAttachedName}} GM</bold> to attach <bold>{{gmSelectedName}} GM</bold>"
                        components={{
                          detach: (
                            <Text
                              as="span"
                              fontWeight={"800"}
                              onClick={detachGmToXNodeModal.onOpen}
                              cursor="pointer"
                              textDecoration={"underline"}>
                              {t("detach")}
                            </Text>
                          ),
                          bold: <Text as="span" fontWeight={"600"} />,
                        }}
                        values={{ gmAttachedName: attachedGmName, gmSelectedName: selectedGmName }}
                      />
                    )}
                  </Text>
                </HStack>
              ) : (
                <Button
                  leftIcon={<UilLinkBroken color="#004CFC" />}
                  variant={"primarySubtle"}
                  isDisabled={isXNodeDelegator}
                  onClick={() => handleAttachOnClick()}>
                  {t("Attach now!")}
                </Button>
              )}
            </FeatureFlagWrapper>
          )}
        </VStack>
      </CardBody>
      <AttachGMToXNodeModal isOpen={attachGmToXNodeModal.isOpen} onClose={attachGmToXNodeModal.onClose} />
      <DetachGMToXNodeModal isOpen={detachGmToXNodeModal.isOpen} onClose={detachGmToXNodeModal.onClose} />
    </Card>
  )
}
