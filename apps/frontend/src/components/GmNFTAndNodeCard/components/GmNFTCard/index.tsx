import { Box, HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { UilPolygon } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { FeatureFlagWrapper } from "@/components/FeatureFlagWrapper"
import { FeatureFlag } from "@/constants"
import { useDomainOrAddress } from "@/hooks"

interface GmNFTCardProps {
  isGMOwned: boolean
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
  isGMOwned,
  isGMLoading,
  gmImage,
  gmName,
  gmLevel,
  gmRewardMultiplier,
  nodeAttachedColor,
  viewMode,
  onCardClick,
  domain,
  profile,
}: GmNFTCardProps) => {
  const { t } = useTranslation()
  const domainOrAddress = useDomainOrAddress({ domain: domain ?? "", address: profile ?? "" })

  if (!isGMOwned) {
    return (
      <HStack
        rounded="12px"
        p="24px 12px"
        position="relative"
        flex={1}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%23FFFFFF80' stroke-width='1' stroke-dasharray='12%2c 20' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
        }}>
        <UilPolygon size={"36px"} color={"#FFFFFF80"} style={{ transform: "rotate(90deg)" }} />
        <Text color={"#FFFFFF80"}>
          {viewMode
            ? t("{{value}} needs to mint an NFT to get reward multipliers", {
                value: domainOrAddress,
              })
            : t("You need to mint an NFT to get reward multipliers")}
        </Text>
      </HStack>
    )
  }

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
            <Text fontSize="xs" fontWeight={600}>
              {gmRewardMultiplier}
              {"x"}
            </Text>
            <Text fontSize="xs" fontWeight={400} lineClamp={1}>
              {t("GM reward weight")}
            </Text>
          </HStack>
        </FeatureFlagWrapper>
      </VStack>
    </HStack>
  )
}
