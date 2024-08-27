import { useSelectedGmNft, useXNode } from "@/api"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import { Box, Button, Card, CardBody, Flex, Heading, HStack, Image, Skeleton, Text, VStack } from "@chakra-ui/react"
import { UilInfoCircle, UilLink, UilLinkBroken } from "@iconscout/react-unicons"
import { useRouter } from "next/navigation"
import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa6"

export const AttachGMNFTCard = () => {
  const { t } = useTranslation()
  const { isXNodeAttachedToGM } = useXNode()
  const { gmImage, gmName, gmRewardMultiplier, isGMLoading, gmLevel } = useSelectedGmNft()

  const router = useRouter()
  const goToGmNftPage = useCallback(() => {
    router.push("/gm-nft")
  }, [router])

  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={4}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="lg">{t(isXNodeAttachedToGM ? "Attached XNode" : "Attach to upgrade")}</Heading>
              <UilInfoCircle color="#004CFC" />
            </HStack>
            <Text fontSize="sm">
              {t(
                isXNodeAttachedToGM
                  ? "Your GM NFT is attached to your XNode"
                  : "Attach your XNode to your GM NFT to upgrade it for free and earn more rewards!",
              )}
            </Text>
          </VStack>
          <Flex border="1px solid" rounded="12px" position="relative" onClick={goToGmNftPage} cursor="pointer">
            <Image
              src={"/images/nft-page-background.png"}
              alt="gm-nft-header"
              position={"absolute"}
              rounded={"12px"}
              left={0}
              top={0}
              w="100%"
              h="100%"
              zIndex={0}
            />
            <HStack p="9px 12px" justify="space-between" gap={6} flex={1} zIndex={1} color="#FFFFFF">
              <Skeleton isLoaded={!isGMLoading} w={"68px"} h={"68px"} rounded="8px">
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
                <Text fontWeight={700} noOfLines={1}>
                  {gmName}
                </Text>
                <HStack gap={1}>
                  <Text fontSize="sm" fontWeight={600}>
                    {gmRewardMultiplier}
                    {"x"}
                  </Text>
                  <Text fontSize="sm" fontWeight={400} noOfLines={1}>
                    {t("Voting reward multiplier")}
                  </Text>
                </HStack>
              </VStack>
              <FaChevronRight size={"24px"} />
            </HStack>
          </Flex>
          {isXNodeAttachedToGM ? (
            <Button leftIcon={<UilLinkBroken color="#C84968" />} color="#C84968" variant={"link"}>
              {t("Detach")}
            </Button>
          ) : (
            <Button leftIcon={<UilLink color="#004CFC" />} variant={"primarySubtle"}>
              {t("Attach now!")}
            </Button>
          )}
        </VStack>
      </CardBody>
    </Card>
  )
}
