import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import {
  Box,
  Card,
  CardBody,
  HStack,
  Image,
  Skeleton,
  Stack,
  Text,
  useMediaQuery,
  VStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
} from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { NFTMetadata } from "@/api/contracts/galaxyMember/hooks/useNFTImage"
import { useIpfsImage, useIpfsMetadata } from "@/api/ipfs"
import { useSelectedTokenId } from "@/api/contracts/galaxyMember/hooks/useSelectedTokenId"
import { SelectGMButton } from "./SelectGMButton"
import { gmNfts } from "@/constants/gmNfts"
import { FeatureFlag, notFoundImage } from "@/constants"
import { FeatureFlagWrapper } from "@/components"
import { useLevelMultiplier, useSelectedGmNft, useXNode } from "@/api"
import { useGetNodeIdAttached } from "@/api/contracts/galaxyMember/hooks/useGetNodeIdAttached"
import { motion } from "framer-motion"

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
  const { isXNodeAttachedToGM: isXNodeAttachedToSelectedGM } = useSelectedGmNft()
  const { data: nodeIdAttachedToToken } = useGetNodeIdAttached(token.tokenId)
  const { xNodeName, xNodeImage, xNodeId: userXNodeId, attachedGMTokenId } = useXNode()
  const { data: gmRewardMultiplier } = useLevelMultiplier(token.tokenLevel)

  const { isOpen, onOpen, onClose } = useDisclosure()

  const isGMSelected = useMemo(() => selectedTokenId === token.tokenId, [selectedTokenId, token.tokenId])
  const currentNFTAttachedToNode = nodeIdAttachedToToken === userXNodeId && attachedGMTokenId === token.tokenId

  const actionButton = useMemo(() => {
    return (
      <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
        <SelectGMButton tokenId={token.tokenId} isSelected={isGMSelected} />
      </FeatureFlagWrapper>
    )
  }, [isGMSelected, token.tokenId])

  const { data: nftMetadata, isLoading: isMetadataLoading } = useIpfsMetadata<NFTMetadata>(token.tokenURI)

  const { data: image } = useIpfsImage(nftMetadata?.image ?? null)

  const gmImage = useMemo(() => {
    return image?.image || gmNfts[Number(token.tokenLevel) - 1]?.image || notFoundImage
  }, [image, token.tokenLevel])

  const gmName = useMemo(() => {
    const nftName = nftMetadata?.name || gmNfts[Number(token.tokenLevel) - 1]?.name
    return `${nftName} #${token.tokenId}`
  }, [nftMetadata, token.tokenId, token.tokenLevel])

  return (
    <Card variant={isGMSelected ? "primaryBoxShadow" : "baseWithBorder"} rounded="8px" w="full">
      <CardBody p={"4"}>
        <VStack align="stretch" gap={4}>
          <HStack
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
                justifyContent="center"
                onClick={onOpen}>
                <Skeleton isLoaded={!isMetadataLoading} w={"64px"} h={"64px"} rounded={"7px"}>
                  <Image src={gmImage} alt="gm" w={"64px"} h={"64px"} rounded="7px" />
                </Skeleton>
              </Box>
            </Skeleton>
            <Stack
              direction={isAbove800 ? "row" : "column"}
              flex="1"
              justify={isAbove800 ? "space-between" : "center"}
              align={isAbove800 ? "center" : "flex-start"}
              gap={1}>
              <VStack align={"flex-start"}>
                <Text fontSize={"xs"} fontWeight="400" noOfLines={1} color="#6DCB09">
                  {isGMSelected && isXNodeAttachedToSelectedGM
                    ? t("Active and attached")
                    : isGMSelected
                    ? t("Active")
                    : ""}
                </Text>

                <Stack direction={isAbove800 ? "column" : "column-reverse"} align={"flex-start"}>
                  <Text fontWeight={700} noOfLines={1} fontSize={"md"}>
                    {gmName}
                  </Text>
                  {currentNFTAttachedToNode ? (
                    <HStack w="full" align={"flex-start"}>
                      <Image src={xNodeImage} alt="gm" w={"20px"} h={"20px"} rounded="7px" />
                      <Text fontSize={"xs"} fontWeight={600}>
                        {t("Attached to {{node}}", { node: xNodeName })}
                      </Text>
                    </HStack>
                  ) : null}
                </Stack>
              </VStack>
              <HStack gap={6} w={{ base: "full", md: "auto" }}>
                <FeatureFlagWrapper feature={FeatureFlag.GALAXY_MEMBER_UPGRADES} fallback={<></>}>
                  <HStack gap={1} maxW={{ base: "full", md: "auto" }}>
                    <Text fontSize={"xs"} fontWeight={600}>
                      {gmRewardMultiplier}
                      {"x"}
                    </Text>
                    <Text
                      fontSize={"xs"}
                      fontWeight={400}
                      noOfLines={{ base: 2, md: 1 }}
                      whiteSpace={["normal", "nowrap"]}
                      wordBreak="break-word"
                      overflowWrap="break-word">
                      {t("GM reward weight")}
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
      {/* Modal for Image Preview */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
        <ModalOverlay />
        <ModalContent
          as={motion.div}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: "0.3", ease: "easeOut" }}
          boxShadow="none"
          background="transparent"
          maxW="500px"
          w="full"
          p={0}
          m={0}>
          <ModalBody p={0}>
            <Box
              position="relative"
              display="flex"
              alignItems="center"
              justifyContent="center"
              overflow="hidden"
              bgGradient={getLevelGradient(Number(token.tokenLevel))}
              p={1}
              rounded="16px">
              <Image src={gmImage} alt="gm" w="100%" h="100%" objectFit="cover" rounded="16px" />
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Card>
  )
}
