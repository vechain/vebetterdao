import { useB3trBalance, useSelectedGmNft, useXNode } from "@/api"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { GmActionButton } from "@/components/GmActionButton"
import { Box, Card, Flex, HStack, Image, Skeleton, Stack, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { UilArrowCircleUp, UilTimesCircle } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useWallet } from "@vechain/dapp-kit-react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

const compactFormatter = getCompactFormatter(4)

export const GmNFTPageHeader = () => {
  const { t } = useTranslation()
  const { gmImage, gmName, gmRewardMultiplier, isGMLoading, gmLevel, b3trToUpgradeGMToNextLevel } = useSelectedGmNft()

  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  const { account } = useWallet()
  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useB3trBalance(account ?? "")

  const { isXNodeAttachedToGM, isMaxGmLevelReached } = useSelectedGmNft()
  const { isXNodeHolder } = useXNode()

  const actionDescription = useMemo(() => {
    if (isXNodeHolder && !isXNodeAttachedToGM) {
      return (
        <>
          <HStack>
            <UilArrowCircleUp size={isAbove800 ? "24px" : "16px"} color="#B1F16C" />
            <HStack gap={0} alignItems={"baseline"}>
              <Text color="#FFFFFF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
                {t("You can attach GM NFT to this node")}
              </Text>
            </HStack>
          </HStack>
          <Text color="#FFFFFFBF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
            {t("Attach GM NFT to XNode")}
          </Text>
        </>
      )
    }
    if (isMaxGmLevelReached) {
      return (
        <>
          <HStack>
            <UilTimesCircle size={isAbove800 ? "24px" : "16px"} color="#B1F16C" />
            <HStack gap={0} alignItems={"baseline"}>
              <Text color="#FFFFFF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
                {t("You reached the max GM NFT level")}
              </Text>
            </HStack>
          </HStack>
          <Text color="#FFFFFFBF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
            {t("You can't upgrade your GM NFT anymore")}
          </Text>
        </>
      )
    }
    return (
      <>
        <HStack>
          <UilArrowCircleUp size={isAbove800 ? "24px" : "16px"} color="#B1F16C" />
          <HStack gap={0} alignItems={"baseline"}>
            <Skeleton isLoaded={!isB3trBalanceLoading}>
              <Text color="#B1F16C" fontSize="lg" fontWeight={700}>
                {compactFormatter.format(Number(b3trBalance?.scaled ?? "0"))}
              </Text>
            </Skeleton>
            <Text color="#FFFFFF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
              {"/"}
              {compactFormatter.format(Number(b3trToUpgradeGMToNextLevel))}
              {" B3TR"}
            </Text>
          </HStack>
        </HStack>
        <Text color="#FFFFFFBF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
          {t("B3TR needed to upgrade your GM level")}
        </Text>
      </>
    )
  }, [
    b3trBalance?.scaled,
    b3trToUpgradeGMToNextLevel,
    isAbove800,
    isB3trBalanceLoading,
    isMaxGmLevelReached,
    isXNodeAttachedToGM,
    isXNodeHolder,
    t,
  ])

  return (
    <Card>
      <Image
        src={"/images/nft-page-background.png"}
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
        spacing={4}
        zIndex={"2"}>
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
            isLoaded={!isGMLoading}
            w={isAbove800 ? "132px" : "68px"}
            h={isAbove800 ? "132px" : "68px"}
            rounded="8px">
            <Box
              w={isAbove800 ? "132px" : "68px"}
              h={isAbove800 ? "132px" : "68px"}
              rounded="8px"
              bgGradient={getLevelGradient(Number(gmLevel))}
              display="flex"
              alignItems="center"
              justifyContent="center">
              <Image
                src={gmImage}
                alt="gm"
                w={isAbove800 ? "126px" : "64px"}
                h={isAbove800 ? "126px" : "64px"}
                rounded="7px"
              />
            </Box>
          </Skeleton>
          <VStack flex="1" align={"flex-start"} justify={"center"} gap={isAbove800 ? 2 : 1}>
            <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight="400" noOfLines={1} color="#FFFFFF80">
              {t("LEVEL {{level}}", { level: gmLevel })}
            </Text>
            <Text fontWeight={700} noOfLines={1} fontSize={isAbove800 ? "xl" : "md"}>
              {gmName}
            </Text>
            <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
              <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={600}>
                {gmRewardMultiplier}
                {"x"}
              </Text>
              <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={400} noOfLines={1}>
                {t("Voting reward multiplier")}
              </Text>
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
          {actionDescription}
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
    </Card>
  )
}
