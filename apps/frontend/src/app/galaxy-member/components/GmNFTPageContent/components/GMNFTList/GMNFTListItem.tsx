import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { Box, Card, CardBody, HStack, Image, Skeleton, Stack, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { NFTMetadata } from "@/api/contracts/galaxyMember/hooks/useNFTImage"
import { useIpfsImage, useIpfsMetadata } from "@/api/ipfs"
import { useSelectedTokenId } from "@/api/contracts/galaxyMember/hooks/useSelectedTokenId"
import { SelectGMButton } from "./SelectGMButton"
import { gmNfts } from "@/constants/gmNfts"
import { FeatureFlag, notFoundImage } from "@/constants"
import { FeatureFlagWrapper } from "@/components"
import { useSelectedGmNft } from "@/api"
interface GMNFTListItemProps {
  token: {
    tokenId: string
    tokenURI: string
    tokenLevel: string
    b3trToUpgrade: string
  }
}

export const GMNFTListItem: React.FC<GMNFTListItemProps> = ({ token }) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  const { data: selectedTokenId } = useSelectedTokenId()
  const { isXNodeAttachedToGM, gmRewardMultiplier } = useSelectedGmNft()

  const isGMSelected = useMemo(() => selectedTokenId === token.tokenId, [selectedTokenId, token.tokenId])

  const actionButton = useMemo(() => {
    return (
      <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
        <SelectGMButton tokenId={token.tokenId} isSelected={isGMSelected} />
      </FeatureFlagWrapper>
    )
  }, [isGMSelected, token.tokenId])

  const { data: nftMetadata } = useIpfsMetadata<NFTMetadata>(token.tokenURI)

  const { data: image } = useIpfsImage(nftMetadata?.image ?? null)

  const gmImage = useMemo(() => {
    return image?.image || gmNfts[Number(token.tokenLevel) - 1]?.image || notFoundImage
  }, [image, token.tokenLevel])

  const gmName = useMemo(() => {
    const nftName = nftMetadata?.name || gmNfts[Number(token.tokenLevel) - 1]?.name
    return `${nftName} #${token.tokenId}`
  }, [nftMetadata, token.tokenId, token.tokenLevel])

  return (
    <Card variant={isGMSelected ? "primaryBoxShadow" : "baseWithBorder"} rounded="8px">
      <CardBody p={"4"}>
        <VStack align="stretch" gap={4}>
          <HStack
            color="#252525"
            align={"center"}
            justify="space-between"
            rounded="12px"
            gap={4}
            flex={1}
            cursor={"pointer"}
            flexGrow={4}>
            <Skeleton isLoaded={true} w={"68px"} h={"68px"} rounded="8px">
              <Box
                w={"68px"}
                h={"68px"}
                rounded="8px"
                bgGradient={getLevelGradient(Number(token.tokenLevel))}
                display="flex"
                alignItems="center"
                justifyContent="center">
                <Image src={gmImage} alt="gm" w={"64px"} h={"64px"} rounded="7px" />
              </Box>
            </Skeleton>
            <Stack
              direction={isAbove800 ? "row" : "column"}
              flex="1"
              align={"flex-start"}
              justify={isAbove800 ? "space-between" : "center"}
              gap={1}>
              <VStack align={"flex-start"}>
                <Text fontSize={"xs"} fontWeight="400" noOfLines={1} color="#6DCB09">
                  {isGMSelected && isXNodeAttachedToGM ? t("Active and attached") : isGMSelected ? t("Active") : ""}
                </Text>
                <Text fontWeight={700} noOfLines={1} fontSize={"md"}>
                  {gmName}
                </Text>
              </VStack>
              <HStack gap={6}>
                <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
                  <HStack gap={1}>
                    <Text fontSize={"xs"} fontWeight={600}>
                      {gmRewardMultiplier}
                      {"x"}
                    </Text>
                    <Text fontSize={"xs"} fontWeight={400} noOfLines={1} whiteSpace={"nowrap"}>
                      {t("Voting reward multiplier")}
                    </Text>
                  </HStack>
                </FeatureFlagWrapper>
                {isAbove800 && actionButton}
              </HStack>
            </Stack>
          </HStack>
          {!isAbove800 && actionButton}
        </VStack>
      </CardBody>
    </Card>
  )
}
