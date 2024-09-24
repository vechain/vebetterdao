import { Box, Circle, HStack, Skeleton, Stack, Text, useMediaQuery } from "@chakra-ui/react"
import { UilArrowCircleUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useSelectedGmNft, useParticipatedInGovernance, useUserB3trBalance, useXNode } from "@/api"
import { useMemo } from "react"
import { SparklesIcon } from "@/components/Icons"
import { useWallet } from "@vechain/dapp-kit-react"
import { GmActionButton } from "@/components/GmActionButton"

const compactFormatter = getCompactFormatter(4)

export const GmNFTAndNodeFooter = () => {
  const { t } = useTranslation()
  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")
  const { account } = useWallet()
  const { data: hasUserVoted } = useParticipatedInGovernance(account)
  const {
    nextLevelGMRewardMultiplier,
    isGMOwned,
    b3trToUpgradeGMToNextLevel,
    missingB3trToUpgrade,
    isEnoughBalanceToUpgradeGM,
    isXNodeAttachedToGM,
    isMaxGmLevelReached,
  } = useSelectedGmNft()
  const { isXNodeHolder } = useXNode()

  const { isLoading: isB3trBalanceLoading } = useUserB3trBalance()

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
            <Text as="span" fontSize={"14px"}>
              {t("Mint a GM NFT for free and get more rewards!")}
            </Text>
          </Box>
        )
      }
    }

    if (isXNodeHolder && !isXNodeAttachedToGM) {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("Attach your XNode to you GM NFT and")}{" "}
          </Text>
          <Text as="strong" fontSize={"14px"} fontWeight={600}>
            {t("upgrade")}
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
            {t("You can upgrade and get {{rewardMultiplier}}x on your rewards for", {
              rewardMultiplier: nextLevelGMRewardMultiplier,
            })}
          </Text>{" "}
          <Text as="span" fontSize={"16px"} color="#B1F16C">
            {compactFormatter.format(b3trToUpgradeGMToNextLevel)}
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
            {t("to upgrade your NFT to the next level")}
          </Text>
        </Box>
      )
    }
  }, [
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
