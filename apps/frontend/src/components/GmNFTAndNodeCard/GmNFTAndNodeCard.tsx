import { useSelectedGmNft, useXNode } from "@/api"
import {
  Box,
  Card,
  Circle,
  Flex,
  Heading,
  HStack,
  Image,
  Skeleton,
  Stack,
  Text,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react"
import { UilPolygon } from "@iconscout/react-unicons"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa6"
import { GmNFTAndNodeFooter } from "./components/GmNFTAndNodeFooter"
import { useCallback, useMemo } from "react"
import { NotConnectedWallet } from "./components/NotConnectedWallet"
import { useWallet } from "@vechain/dapp-kit-react"
import { SwapB3trVot3 } from "./components/SwapB3trVot3"
import { useRouter } from "next/navigation"
import { getLevelGradient } from "@/api/contracts/galaxyMember/utils"

export const GmNFTAndNodeCard = () => {
  const { t } = useTranslation()

  const { gmImage, gmName, gmLevel, gmRewardMultiplier, isGMLoading, isGMOwned, isXNodeAttachedToGM } =
    useSelectedGmNft()

  //node
  const { xNodeName, xNodeImage, xNodePoints, isXNodeHolder } = useXNode()

  const nodeAttachedColor = isXNodeAttachedToGM ? "#B1F16C" : "#FFFFFF80"

  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")
  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  const nodeSeparator = useMemo(() => {
    return (
      <Flex
        ml={isGMOwned ? "-10px" : "-9px"}
        mr={"-10px"}
        my={"-10px"}
        position={"relative"}
        align="center"
        justify="center">
        <Image
          src={isXNodeAttachedToGM ? "/images/nft-attachment.png" : "/images/nft-attachment-off.png"}
          alt="nft-attachment"
          w="50px"
          h="50px"
          transform={isAbove800 ? undefined : "rotate(90deg)"}
        />
        {isAbove800 && isXNodeAttachedToGM && (
          <>
            <Flex h="62px" w="1px" bg="#B1F16C" position={"absolute"} bottom="50%" left="50%" />
            <Circle size="6px" bg="#B1F16C" position={"absolute"} top="-12px" left="calc(50% - 3px)" />
          </>
        )}
      </Flex>
    )
  }, [isAbove800, isXNodeAttachedToGM, isGMOwned])

  const router = useRouter()
  const goToGmNftPage = useCallback(() => {
    router.push("/galaxy-member")
  }, [router])
  const goToXNodePage = useCallback(() => {
    router.push("/xnode")
  }, [router])

  const { account } = useWallet()
  if (!account) {
    return <NotConnectedWallet />
  }

  return (
    <Card
      bg="#004CFC"
      rounded="12px"
      p="24px"
      color="white"
      position="relative"
      overflow={"hidden"}
      bgImage="url('/images/cloud-background.png')"
      bgSize="cover"
      bgPosition="center"
      bgRepeat="no-repeat">
      <Stack gap={8} align="stretch" justify={"stretch"} direction={isAbove1200 ? "row" : "column-reverse"}>
        <VStack flex="3" align={"stretch"} gap="24px">
          <HStack gap="40px" align={"baseline"} justify={"space-between"}>
            <Heading fontSize="xl" fontWeight={600}>
              {t("You are on LEVEL {{level}}", { level: gmLevel })}
            </Heading>
            {isAbove800 && isXNodeAttachedToGM && (
              <>
                <Text fontSize="xs" fontWeight={600} color="#B1F16C">
                  {t("GM NFT attached to {{node}}", { node: xNodeName })}
                </Text>
                <Box flexBasis={"150px"} />
              </>
            )}
          </HStack>
          <Stack gap="0" direction={isAbove800 ? "row" : "column"} align="stretch" justify="stretch">
            {!isGMOwned ? (
              <HStack
                rounded="12px"
                p="24px 12px"
                position="relative"
                flex={1}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='12' ry='12' stroke='%23FFFFFF80' stroke-width='1' stroke-dasharray='12%2c 20' stroke-dashoffset='2' stroke-linecap='square'/%3e%3c/svg%3e")`,
                }}>
                <UilPolygon size={"36px"} color={"#FFFFFF80"} style={{ transform: "rotate(90deg)" }} />
                <Text color={"#FFFFFF80"}>{t("You need to mint an NFT to get reward multipliers")}</Text>
              </HStack>
            ) : (
              <HStack
                bg="#0D5DFB"
                p="9px 12px"
                border="1px solid"
                borderColor={nodeAttachedColor}
                justify="space-between"
                rounded="12px"
                gap={6}
                flex={1}
                cursor={"pointer"}
                onClick={goToGmNftPage}>
                <Skeleton isLoaded={!isGMLoading} w="68px" h="68px" rounded="8px">
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
                  <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
                    <Text fontSize="xs" fontWeight={600}>
                      {gmRewardMultiplier}
                      {"x"}
                    </Text>
                    <Text fontSize="xs" fontWeight={400} noOfLines={1}>
                      {t("Voting reward multiplier")}
                    </Text>
                  </HStack>
                </VStack>
                <FaChevronRight size={"24px"} />
              </HStack>
            )}

            {isXNodeHolder && (
              <>
                {isAbove800 ? (
                  nodeSeparator
                ) : (
                  <HStack justify={"space-between"}>
                    {isXNodeAttachedToGM ? (
                      <Text fontSize="xs" fontWeight={600} color="#B1F16C">
                        {t("GM NFT attached")}
                      </Text>
                    ) : (
                      <Box flexBasis={"100px"} />
                    )}
                    {nodeSeparator}
                    <Box flexBasis={"100px"} />
                  </HStack>
                )}
                <HStack
                  bg="#0D5DFB"
                  p="9px 12px"
                  border="1px solid"
                  borderColor={nodeAttachedColor}
                  justify="space-between"
                  rounded="12px"
                  gap={6}
                  flex={1}
                  onClick={goToXNodePage}
                  cursor="pointer">
                  <Image src={xNodeImage} alt="gm" w="68px" h="68px" rounded="8px" />
                  <VStack flex="1" align={"flex-start"}>
                    <Text fontWeight={700} noOfLines={1}>
                      {xNodeName}
                    </Text>
                    <HStack gap={1}>
                      <Text fontSize="sm" fontWeight={600}>
                        {xNodePoints}
                      </Text>
                      <Text fontSize="sm" fontWeight={400} noOfLines={1}>
                        {t("to endorse Apps")}
                      </Text>
                    </HStack>
                  </VStack>
                  <FaChevronRight size={"24px"} />
                </HStack>
              </>
            )}
          </Stack>
          <GmNFTAndNodeFooter />
        </VStack>
        <Flex w={isAbove800 ? "1px" : "auto"} h={isAbove800 ? "auto" : "1px"} bg="#FFFFFF80" />
        <SwapB3trVot3 />
      </Stack>
    </Card>
  )
}
