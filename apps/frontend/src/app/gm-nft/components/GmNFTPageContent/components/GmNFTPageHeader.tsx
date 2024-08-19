import { useGMNFT } from "@/api"
import { Box, Card, Flex, HStack, Image, Skeleton, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa6"

export const GmNFTPageHeader = () => {
  const { t } = useTranslation()
  const { gmImage, gmName, gmRewardMultiplier, isGMLoading } = useGMNFT()

  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")

  return (
    <Card>
      <HStack p="9px 12px" justify="space-between" rounded="12px" gap={6} flex={1} cursor={"pointer"}>
        <Skeleton isLoaded={!isGMLoading} w="68px" h="68px" rounded="8px">
          <Image src={gmImage} alt="gm" w="68px" h="68px" rounded="8px" border="4px solid #1A8FC1" />
        </Skeleton>
        <VStack flex="1" align={"flex-start"}>
          <Text fontWeight={700} noOfLines={1}>
            {gmName}
          </Text>
          <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
            <Text fontSize={"12px"} fontWeight={600}>
              {gmRewardMultiplier}
            </Text>
            <Text fontSize={"12px"} fontWeight={400} noOfLines={1}>
              {t("Reward multiplier")}
            </Text>
          </HStack>
        </VStack>
        <FaChevronRight size={"24px"} />
      </HStack>
      <Flex w={isAbove1200 ? "1px" : "auto"} h={isAbove1200 ? "auto" : "1px"} bg="#FFFFFF80" />
      <Box></Box>
    </Card>
  )
}
