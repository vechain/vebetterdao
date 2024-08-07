import { Box, Button, Circle, HStack, Skeleton, Stack, Text, useMediaQuery } from "@chakra-ui/react"
import { UilArrowCircleUp } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useUserB3trBalance } from "@/api"
import { useMemo } from "react"
import { SparklesIcon } from "@/components/Icons"

const compactFormatter = getCompactFormatter(4)

export const GMUpgradeButton = () => {
  const { t } = useTranslation()
  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")
  const isGMMinted = false
  const isNodeHolder = false
  const isNodeAttached = true
  const b3trToUpgradeGM = 5000000
  const rewardMultiplier = "X3"

  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useUserB3trBalance()

  const isEnoughBalanceToUpgradeGM = b3trBalance && Number(b3trBalance.scaled) >= b3trToUpgradeGM

  const upgradeMessage = useMemo(() => {
    if (!isGMMinted) {
      if (isNodeHolder) {
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

    if (isNodeHolder && !isNodeAttached) {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("Attach your XNode to you GM NFT and")}
          </Text>
          <Text as="strong" fontSize={"14px"} mx="5px" fontWeight={600}>
            {t("upgrade")}
          </Text>
          <Text as="span" fontSize={"14px"}>
            {t("it to Venus for free!")}
          </Text>
        </Box>
      )
    }

    if (isEnoughBalanceToUpgradeGM) {
      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("You can upgrade and get {{rewardMultiplier}} on your rewards for", { rewardMultiplier })}
          </Text>
          <Text as="span" fontSize={"16px"} color="#B1F16C" mx="5px">
            {compactFormatter.format(b3trToUpgradeGM)}
          </Text>
          <Text as="span" fontSize={"14px"}>
            {"!"}
          </Text>
        </Box>
      )
    } else {
      const missingB3tr = b3trToUpgradeGM - Number(b3trBalance?.scaled || 0)

      return (
        <Box>
          <Text as="span" fontSize={"14px"}>
            {t("You need")}
          </Text>
          <Text as="span" fontSize={"14px"} color="#B1F16C" mx="5px">
            {t("{{b3trToUpgradeGM}} B3TR", { b3trToUpgradeGM: compactFormatter.format(missingB3tr) })}
          </Text>
          <Text as="span" fontSize={"14px"}>
            {t("to upgrade your NFT to the next level")}
          </Text>
        </Box>
      )
    }
  }, [b3trBalance?.scaled, isEnoughBalanceToUpgradeGM, isGMMinted, isNodeAttached, isNodeHolder, t])

  const actionLabel = useMemo(() => {
    if (!isGMMinted) {
      return t("Mint now!")
    }
    if (isNodeHolder && !isNodeAttached) {
      return t("Attach and Upgrade!")
    }
    return t("Upgrade now!")
  }, [isGMMinted, isNodeAttached, isNodeHolder, t])

  const isActionDisabled = useMemo(() => {
    if ((isNodeHolder && !isNodeAttached) || !isGMMinted) {
      return false
    }
    return !isEnoughBalanceToUpgradeGM
  }, [isEnoughBalanceToUpgradeGM, isGMMinted, isNodeAttached, isNodeHolder])

  return (
    <Stack justify="space-between" align="center" direction={isAbove1200 ? "row" : "column"} gap={"20px"}>
      <Skeleton isLoaded={!isB3trBalanceLoading}>
        <HStack gap={2}>
          {isGMMinted ? (
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
        <Button variant={"tertiaryAction"} isDisabled={isActionDisabled}>
          {actionLabel}
        </Button>
      </Skeleton>
    </Stack>
  )
}
