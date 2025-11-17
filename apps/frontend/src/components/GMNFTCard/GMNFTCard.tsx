import { Box, HStack, Image, Skeleton, Text, VStack, useMediaQuery } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { getLevelGradient } from "@/api/contracts/galaxyMember/utils/getLevelGradient"
import { FeatureFlagWrapper } from "@/components/FeatureFlagWrapper"
import { FeatureFlag } from "@/constants/featureFlag"

export const GMNFTCard = ({
  imageUrl,
  name,
  tokenLevel,
  multiplier,
  isLoading = false,
  children,
  size = "responsive",
  showMultiplier = true,
  padding,
  onImageClick,
}: {
  imageUrl?: string
  name?: string
  tokenLevel: number
  multiplier?: string | number
  isLoading?: boolean
  children?: React.ReactNode
  size?: "small" | "medium" | "large" | "responsive"
  showMultiplier?: boolean
  padding?: string
  onImageClick?: () => void
}) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery(["(min-width: 800px)"])

  // Calculate image size based on variant
  const getImageSize = () => {
    switch (size) {
      case "small":
        return { outer: "46px", inner: "42px" }
      case "medium":
        return { outer: "68px", inner: "64px" }
      case "large":
        return { outer: "132px", inner: "126px" }
      case "responsive":
      default:
        return {
          outer: isAbove800 ? "132px" : "68px",
          inner: isAbove800 ? "126px" : "64px",
        }
    }
  }

  const imageSize = getImageSize()

  return (
    <>
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
      <HStack p={padding ?? "9px 12px"} justify="space-between" gap={6} flex={1} zIndex={1} color="white">
        <Skeleton loading={isLoading} w={imageSize.outer} h={imageSize.outer} rounded="8px">
          <Box
            w={imageSize.outer}
            h={imageSize.outer}
            rounded="8px"
            bgGradient={getLevelGradient(tokenLevel)}
            display="flex"
            alignItems="center"
            justifyContent="center"
            onClick={onImageClick}
            cursor={onImageClick ? "pointer" : "default"}>
            <Image src={imageUrl} alt="gm" w={imageSize.inner} h={imageSize.inner} rounded="7px" />
          </Box>
        </Skeleton>
        <VStack flex="1" align={"flex-start"}>
          <Text color="white" lineClamp={1}>
            {name}
          </Text>
          {showMultiplier && (
            <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
              <HStack gap={1}>
                <Text color="white" textStyle="sm" fontWeight="semibold">
                  {multiplier}
                  {"x"}
                </Text>
                <Text color="white" textStyle="sm" lineClamp={1}>
                  {t("GM reward weight")}
                </Text>
              </HStack>
            </FeatureFlagWrapper>
          )}
        </VStack>
        {children}
      </HStack>
    </>
  )
}
