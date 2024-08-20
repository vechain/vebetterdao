import { useGMNFT } from "@/api"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  HStack,
  Image,
  Skeleton,
  Stack,
  Text,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react"
import { UilInfoCircle } from "@iconscout/react-unicons"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const GMNFTListCard = () => {
  const { t } = useTranslation()
  const { gmImage, gmName, gmRewardMultiplier, isGMLoading, gmLevel, isGMActive } = useGMNFT()

  const actionButton = useMemo(() => {
    return (
      <Button variant="primarySubtle" w={"full"} isDisabled={isGMActive}>
        {t(isGMActive ? "Active NFT" : "Select as active")}
      </Button>
    )
  }, [isGMActive, t])

  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  return (
    <Card variant="baseWithBorder">
      <CardBody>
        <VStack align="stretch" gap={6}>
          <VStack align="stretch">
            <HStack justify="space-between">
              <Heading fontSize="lg">{t("My Galaxy NFTs")}</Heading>
              <UilInfoCircle color="#004CFC" />
            </HStack>
            <Text fontSize="sm">
              {t(
                "You can choose which NFT use for rewards multiplier. Also you can min new earth to upgrade and sell them in the secondary market.",
              )}
            </Text>
          </VStack>
          <VStack align="stretch" gap={6}>
            <Card variant={isGMActive ? "primaryBoxShadow" : "baseWithBorder"} rounded="8px">
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
                    <Stack
                      direction={isAbove800 ? "row" : "column"}
                      flex="1"
                      align={"flex-start"}
                      justify={isAbove800 ? "space-between" : "center"}
                      gap={1}>
                      <VStack align={"flex-start"}>
                        <Text fontSize={"xs"} fontWeight="400" noOfLines={1} color="#6DCB09">
                          {isGMActive ? t("Active") : ""}
                        </Text>
                        <Text fontWeight={700} noOfLines={1} fontSize={"md"}>
                          {gmName}
                        </Text>
                      </VStack>
                      <HStack gap={6}>
                        <HStack gap={1}>
                          <Text fontSize={"xs"} fontWeight={600}>
                            {gmRewardMultiplier}
                            {"x"}
                          </Text>
                          <Text fontSize={"xs"} fontWeight={400} noOfLines={1} whiteSpace={"nowrap"}>
                            {t("Voting reward multiplier")}
                          </Text>
                        </HStack>
                        {isAbove800 && actionButton}
                      </HStack>
                    </Stack>
                  </HStack>
                  {!isAbove800 && actionButton}
                </VStack>
              </CardBody>
            </Card>
            <Card
              rounded="8px"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%23004CFC' stroke-width='1' stroke-dasharray='12%2c 15' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
              }}>
              <CardBody bg={"#EBF1FE"} rounded="8px">
                <Stack
                  direction={isAbove800 ? "row" : "column"}
                  justify={isAbove800 ? "space-between" : "flex-start"}
                  align="stretch"
                  gap={4}>
                  <VStack align="stretch" gap={1}>
                    <Heading fontSize="lg">{t("Mint a GM Earth NFT")}</Heading>
                    <Text fontSize="sm" color="#6A6A6A">
                      {t("To upgrade and sell in the secondary market")}
                    </Text>
                  </VStack>
                  <Button variant="primaryAction">{t("Mint a GM Earth NFT")}</Button>
                </Stack>
              </CardBody>
            </Card>
          </VStack>
        </VStack>
      </CardBody>
    </Card>
  )
}
