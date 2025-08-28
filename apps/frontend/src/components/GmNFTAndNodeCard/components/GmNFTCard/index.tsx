import { Box, HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { FeatureFlagWrapper } from "@/components/FeatureFlagWrapper"
import { FeatureFlag } from "@/constants"

interface GmNFTCardProps {
  isGMLoading: boolean
  gmImage?: string
  gmName?: string
  gmLevel?: string
  gmRewardMultiplier?: number
  nodeAttachedColor: string
  viewMode?: boolean
  onCardClick?: () => void
  domain?: string
  profile?: string
}

export const GmNFTCard = ({
  isGMLoading,
  gmImage,
  gmName,
  gmLevel,
  gmRewardMultiplier,
  nodeAttachedColor,
  viewMode,
  onCardClick,
}: GmNFTCardProps) => {
  const { t } = useTranslation()

  return (
    <HStack
      bg="#0D5DFB"
      p="9px 12px"
      border="1px solid"
      borderColor={nodeAttachedColor}
      justify="space-between"
      rounded="12px"
      gap={6}
      flex={1}
      cursor={viewMode ? "default" : "pointer"}
      onClick={viewMode ? undefined : onCardClick}>
      <Skeleton loading={isGMLoading} w="68px" h="68px" rounded="8px">
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
          <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
            <Text textStyle="xs" fontWeight={600}>
              {gmRewardMultiplier}
              {"x"}
            </Text>
            <Text textStyle="xs" lineClamp={1}>
              {t("GM reward weight")}
            </Text>
          </HStack>
        </FeatureFlagWrapper>
      </VStack>
    </HStack>
  )
}
