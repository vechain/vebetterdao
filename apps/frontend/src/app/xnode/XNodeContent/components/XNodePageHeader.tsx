import { useParticipatedInGovernance, useSelectedGmNft, useXNode } from "@/api"
import { GmActionButton } from "@/components/GmActionButton"
import { Card, Flex, Heading, HStack, Image, Skeleton, Stack, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { UilArrowCircleUp } from "@iconscout/react-unicons"
import { useWallet } from "@vechain/vechain-kit"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const XNodePageHeader = () => {
  const { t } = useTranslation()
  const {
    xNodeName,
    xNodeImage,
    xNodePoints,
    isXNodeLoading,
    isXNodeHolder,
    isXNodeDelegator,
    isXNodeDelegatee,
    nodeType,
  } = useXNode()

  const [isAbove800] = useMediaQuery(["(min-width: 800px)"])

  const { account } = useWallet()
  const { data: hasUserVoted } = useParticipatedInGovernance(account?.address ?? "")
  const { isGMOwned, isXNodeAttachedToGM, isMaxGmLevelReached } = useSelectedGmNft()

  const [actionTitle, actionDescription] = useMemo(() => {
    if (!hasUserVoted && !isGMOwned) {
      return [t("Vote to mint GM NFT"), t("Vote now and mint your GM NFT for free")]
    }
    if (!isGMOwned) {
      return [t("Mint GM NFT"), t("Mint now and get more rewards")]
    }
    if (isXNodeHolder && !isXNodeAttachedToGM && !isXNodeDelegator) {
      return [t("You can attach GM NFT to this node"), t("Attach GM NFT to Node")]
    }
    if (isMaxGmLevelReached) {
      return [t("You reached the max GM NFT level"), t("You can't upgrade your GM NFT anymore")]
    }
    return [t("You can upgrade your GM NFT"), t("Upgrade the GM NFT")]
  }, [hasUserVoted, isGMOwned, isMaxGmLevelReached, isXNodeAttachedToGM, isXNodeHolder, isXNodeDelegator, t])

  return (
    <Card.Root>
      <Image
        src={"/assets/backgrounds/xnode-page-background.webp"}
        alt="gm-nft-header"
        position={"absolute"}
        w="100%"
        h="100%"
        rounded={"16px"}
      />
      <Stack
        direction={isAbove800 ? "row" : "column"}
        p={isAbove800 ? "24px" : "16px"}
        align={isAbove800 ? "stretch" : "flex-start"}
        gap={4}
        zIndex={"0"}>
        <HStack
          align={isAbove800 ? "stretch" : "center"}
          justify="space-between"
          rounded="12px"
          gap={6}
          flex={1}
          cursor={"pointer"}
          color="#FFFFFF"
          flexGrow={4}>
          <Skeleton
            loading={isXNodeLoading}
            w={isAbove800 ? "132px" : "68px"}
            h={isAbove800 ? "132px" : "68px"}
            rounded="8px">
            <Image
              src={xNodeImage}
              alt="gm"
              w={isAbove800 ? "132px" : "68px"}
              h={isAbove800 ? "132px" : "68px"}
              rounded="8px"
            />
          </Skeleton>
          <VStack flex="1" align={"flex-start"} justify={"center"} gap={isAbove800 ? 2 : 1}>
            <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight="400" lineClamp={1} color="#FFFFFF80">
              {nodeType}
            </Text>

            <Text fontWeight={700} lineClamp={1} fontSize={isAbove800 ? "xl" : "md"}>
              {xNodeName}
            </Text>

            <HStack>
              {(isXNodeDelegator || isXNodeDelegatee) && (
                <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
                  <Text fontSize={isAbove800 ? "md" : "xs"}>{isXNodeDelegator ? "Node Owner" : "Manager"}</Text>
                </HStack>
              )}
              <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
                <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={600}>
                  {xNodePoints}
                </Text>
                <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={400} lineClamp={1}>
                  {t("points to endorse")}
                </Text>
              </HStack>
            </HStack>
          </VStack>
        </HStack>
        <Flex w={isAbove800 ? "1px" : "full"} h={isAbove800 ? "auto" : "1px"} bg="#FFFFFF4D" flexBasis={"1px"} />
        <VStack
          align={"stretch"}
          justify={"center"}
          gap={isAbove800 ? 2 : 1}
          w={isAbove800 ? "auto" : "full"}
          flexGrow={1}>
          <HStack>
            <UilArrowCircleUp size={isAbove800 ? "24px" : "16px"} color="#B1F16C" />
            <Heading color="#FFFFFF" fontSize={isAbove800 ? "xl" : "md"} fontWeight={400}>
              {actionTitle}
            </Heading>
          </HStack>
          <Text color="#FFFFFFBF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
            {actionDescription}
          </Text>
          <GmActionButton
            buttonProps={{
              variant: "tertiaryAction",
              w: "full",
              boxShadow: "0px 0px 9.4px 0px #B1F16C",
              color: "#080F1E",
              fontSize: "sm",
              h: "30px",
              mt: 2,
            }}
          />
        </VStack>
      </Stack>
    </Card.Root>
  )
}
