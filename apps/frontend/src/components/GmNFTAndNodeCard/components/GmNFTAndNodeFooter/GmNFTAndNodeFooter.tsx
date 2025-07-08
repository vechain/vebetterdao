import { Box, Circle, HStack, Skeleton, Stack, Text, useMediaQuery } from "@chakra-ui/react"
import { UilArrowCircleUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useSelectedGmNft, useParticipatedInGovernance, useXNode } from "@/api"
import { useMemo } from "react"
import { SparklesIcon } from "@/components/Icons"
import { useWallet } from "@vechain/vechain-kit"
import { GmActionButton } from "@/components/GmActionButton"
import { FeatureFlagWrapper } from "@/components/FeatureFlagWrapper"
import { FeatureFlag } from "@/constants"
import { useGetB3trBalance } from "@/hooks"

const compactFormatter = getCompactFormatter(4)

export const GmNFTAndNodeFooter = () => {
  const { t } = useTranslation()
  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")
  const { account } = useWallet()
  const { data: hasUserVoted } = useParticipatedInGovernance(account?.address ?? "")
  const {
    nextLevelGMRewardMultiplier,
    isGMOwned,
    b3trToUpgradeGMToNextLevel,
    missingB3trToUpgrade,
    isEnoughBalanceToUpgradeGM,
    isXNodeAttachedToGM,
    isMaxGmLevelReached,
    gmLevel,
  } = useSelectedGmNft()
  const { isXNodeHolder, isXNodeDelegator } = useXNode()

  const { isLoading: isB3trBalanceLoading } = useGetB3trBalance(account?.address ?? "")

  const upgradeMessage = useMemo(() => {
    if (!hasUserVoted && !isGMOwned) {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("Vote and mint the GM NFT for free!")}
          </Text>
        </Box>
      )
    }
    if (!isGMOwned) {
      if (isXNodeHolder) {
        return (
          <Box>
            <Text as="span" fontSize={"14px"}>
              {t("Mint a GM NFT for free! You can attach it your Node and get free upgrades!")}
            </Text>
          </Box>
        )
      } else {
        return (
          <Box>
            <FeatureFlagWrapper
              feature={FeatureFlag.GALAXY_MEMBER_UPGRADES}
              fallback={
                <Text as="span" fontSize={"14px"}>
                  {t("Mint a GM NFT for free!")}
                </Text>
              }>
              <Text as="span" fontSize={"14px"}>
                {t("Mint a GM NFT for free and get more rewards!")}
              </Text>
            </FeatureFlagWrapper>
          </Box>
        )
      }
    }

    if (isXNodeHolder && !isXNodeAttachedToGM && !isXNodeDelegator && gmLevel !== "1") {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("Attach your Node to your GM NFT and")}{" "}
          </Text>
          <Text as="strong" fontSize={"14px"} fontWeight={600}>
            {t("upgrade")}{" "}
          </Text>
          <Text as="span" fontSize={"14px"}>
            {t("it for free!")}
          </Text>
        </Box>
      )
    }

    if (isMaxGmLevelReached) {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("You have reached the maximum level for your GM NFT")}
          </Text>
        </Box>
      )
    }

    if (isEnoughBalanceToUpgradeGM) {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("You can upgrade and get {{weight}}x weight on your GM rewards for", {
              weight: nextLevelGMRewardMultiplier,
            })}
          </Text>{" "}
          <Text as="span" fontSize={"16px"} color="#B1F16C">
            {compactFormatter.format(Number(b3trToUpgradeGMToNextLevel))}
          </Text>
          <Text as="span" fontSize={"14px"}>
            {"!"}
          </Text>
        </Box>
      )
    } else {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("You need")}
          </Text>{" "}
          <Text as="span" fontSize={"14px"} color="#B1F16C">
            {t("{{b3trToUpgradeGM}} B3TR", { b3trToUpgradeGM: compactFormatter.format(missingB3trToUpgrade) })}
          </Text>{" "}
          <Text as="span" fontSize={"14px"}>
            {t("to upgrade your NFT to the next level")}{" "}
            {isXNodeHolder && gmLevel === "1" && t("and attach your node to your GM NFT")}
          </Text>
        </Box>
      )
    }
  }, [
    gmLevel,
    b3trToUpgradeGMToNextLevel,
    hasUserVoted,
    isEnoughBalanceToUpgradeGM,
    isGMOwned,
    isMaxGmLevelReached,
    isXNodeAttachedToGM,
    isXNodeHolder,
    missingB3trToUpgrade,
    nextLevelGMRewardMultiplier,
    t,
    isXNodeDelegator,
  ])

  return (
    <Stack
      justify="space-between"
      align={isAbove1200 ? "center" : "stretch"}
      direction={isAbove1200 ? "row" : "column"}
      gap={"20px"}>
      <Skeleton isLoaded={!isB3trBalanceLoading}>
        <HStack gap={2}>
          {isGMOwned ? (
            <UilArrowCircleUp size={"30px"} color="#B1F16C" />
          ) : (
            <Circle overflow={"hidden"} size={"20px"} border="2px solid #B1F16C">
              <SparklesIcon />
            </Circle>
          )}
          {upgradeMessage}
        </HStack>
      </Skeleton>
      <Skeleton isLoaded={!isB3trBalanceLoading}>
        <GmActionButton buttonProps={{ variant: "tertiaryAction" }} />
      </Skeleton>
    </Stack>
  )
}
