import { useUserB3trBalance, useUserVot3Balance } from "@/api"
import { notFoundImage } from "@/constants"
import {
  Box,
  Button,
  Card,
  Circle,
  Flex,
  Heading,
  HStack,
  Image,
  Skeleton,
  Stack,
  Text,
  useDisclosure,
  useMediaQuery,
  VStack,
} from "@chakra-ui/react"
import { UilExchangeAlt } from "@iconscout/react-unicons"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { FaChevronRight } from "react-icons/fa6"
import { ConvertModal } from "../Convert/ConvertModal"
import { GMUpgradeButton } from "./components/GMUpgradeButton"

const compactFormatter = getCompactFormatter(4)

export const GmNFTLevel = () => {
  const { t } = useTranslation()
  const { isOpen, onClose, onOpen } = useDisclosure()

  // TODO: map data
  //gm
  const gmLevel = "1"
  const rewardMultiplier = "X3"
  const gmLevelName = "Planet Venus"
  const gmImage = notFoundImage
  //node
  const node = "X-Node"
  const nodeImage = notFoundImage
  const nodePoints = "100"

  // both
  const isNodeHolder = false
  const isNodeAttached = isNodeHolder && false
  const nodeAttachedColor = isNodeAttached ? "#B1F16C" : "#FFFFFF80"

  const { data: b3trBalance, isLoading: isB3trBalanceLoading } = useUserB3trBalance()
  const { data: vot3Balance, isLoading: isVot3BalanceLoading } = useUserVot3Balance()

  const hasNoBalance = (!b3trBalance || b3trBalance.scaled === "0") && (!vot3Balance || vot3Balance.scaled === "0")
  const isLoading = isB3trBalanceLoading || isVot3BalanceLoading

  const buttonDisabled = isLoading || hasNoBalance

  const [isAbove1200] = useMediaQuery("(min-width: 1200px)")

  return (
    <Card bg="#004CFC" rounded="12px" p="24px" color="white" position="relative" overflow={"hidden"}>
      <Box
        position="absolute"
        top={isAbove1200 ? "-50%" : "-10%"}
        left={isAbove1200 ? "0" : "-50%"}
        w={isAbove1200 ? "100%" : "200%"}
        h="auto"
        zIndex="2">
        <Image src={"/images/cloud-background.png"} alt="cloud" objectFit={"contain"} />
      </Box>
      <Stack gap={8} align="stretch" justify={"stretch"} direction={isAbove1200 ? "row" : "column-reverse"} zIndex="10">
        <VStack flex="3" align={"stretch"} gap="24px">
          <HStack gap="40px" align={"baseline"} justify={"space-between"}>
            <Heading fontSize={"20px"} fontWeight={600}>
              {t("You are on level {{level}}", { level: gmLevel })}
            </Heading>
            {isAbove1200 && isNodeAttached && (
              <>
                <Text fontSize={"12px"} fontWeight={600} color="#B1F16C">
                  {t("GM NFT attached to {{node}}", { node })}
                </Text>
                <Box flexBasis={"150px"} />
              </>
            )}
          </HStack>
          <Stack gap="0" direction={isAbove1200 ? "row" : "column"} align="stretch" justify="stretch">
            <HStack
              p="9px 12px"
              border="1px solid"
              borderColor={nodeAttachedColor}
              justify="space-between"
              rounded="12px"
              gap={6}
              flex={1}>
              <Image
                src={gmImage}
                alt="gm"
                w="68px"
                h="68px"
                rounded="4px"
                border="1px solid"
                borderColor={nodeAttachedColor}
              />
              <VStack flex="1" align={"flex-start"}>
                <Text fontWeight={700}>{gmLevelName}</Text>
                <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
                  <Text fontSize={"12px"} fontWeight={600}>
                    {rewardMultiplier}
                  </Text>
                  <Text fontSize={"12px"} fontWeight={400}>
                    {t("Reward multiplier")}
                  </Text>
                </HStack>
              </VStack>
              <FaChevronRight size={"24px"} />
            </HStack>
            {isNodeHolder && (
              <>
                <Flex mx={"-10px"} my={"-10px"} position={"relative"} align="center" justify="center">
                  <Image
                    src={isNodeAttached ? "/images/nft-attachment.png" : "/images/nft-attachment-off.png"}
                    alt="nft-attachment"
                    w="50px"
                    h="50px"
                    transform={isAbove1200 ? undefined : "rotate(90deg)"}
                  />
                  {isAbove1200 && isNodeAttached && (
                    <>
                      <Flex h="62px" w="1px" bg="#B1F16C" position={"absolute"} bottom="50%" left="50%" />
                      <Circle size="6px" bg="#B1F16C" position={"absolute"} top="-12px" left="calc(50% - 3px)" />
                    </>
                  )}
                </Flex>
                <HStack
                  p="9px 12px"
                  border="1px solid"
                  borderColor={nodeAttachedColor}
                  justify="space-between"
                  rounded="12px"
                  gap={6}
                  flex={1}>
                  <Image src={nodeImage} alt="gm" w="68px" h="68px" rounded="4px" />
                  <VStack flex="1" align={"flex-start"}>
                    <Text fontWeight={700}>{node}</Text>
                    <HStack gap={1}>
                      <Text fontSize={"14px"} fontWeight={600}>
                        {nodePoints}
                      </Text>
                      <Text fontSize={"14px"} fontWeight={400}>
                        {t("to endorse Apps")}
                      </Text>
                    </HStack>
                  </VStack>
                  <FaChevronRight size={"24px"} />
                </HStack>
              </>
            )}
          </Stack>
          <GMUpgradeButton />
        </VStack>
        <Flex w={isAbove1200 ? "1px" : "auto"} h={isAbove1200 ? "auto" : "1px"} bg="#FFFFFF80" />
        <VStack flex="2" align={"stretch"} gap="24px">
          <Text fontSize={"20px"} fontWeight={700}>
            {t("Your token balance")}
          </Text>
          <Stack gap="24px" direction={isAbove1200 ? "row" : "column"}>
            <VStack
              align={"stretch"}
              flex="1"
              gap="8px"
              bg="#FFFFFF26"
              borderColor={"#FFFFFF33"}
              p="12px 16px"
              rounded="8px">
              <Text fontSize={"14px"} color="#FFFFFFB2">
                {t("Total B3TR Balance")}
              </Text>
              <HStack>
                <Image src={"/images/logo/b3tr_logo_dark.svg"} boxSize={"30px"} alt="B3TR Icon" />
                <Skeleton isLoaded={!isB3trBalanceLoading}>
                  <Heading fontSize={"28px"}>{compactFormatter.format(Number(b3trBalance?.scaled ?? "0"))}</Heading>
                </Skeleton>
              </HStack>
            </VStack>
            <VStack
              align={"stretch"}
              flex="1"
              gap="8px"
              bg="#FFFFFF26"
              borderColor={"#FFFFFF33"}
              p="12px 16px"
              rounded="8px">
              <Text fontSize={"14px"} color="#FFFFFFB2">
                {t("Total VOT3 Balance")}
              </Text>
              <HStack>
                <Image src={"/images/logo/vot3_logo_dark.svg"} boxSize={"30px"} alt="VOT3 Icon" />
                <Skeleton isLoaded={!isVot3BalanceLoading}>
                  <Heading fontSize={"28px"}>{compactFormatter.format(Number(vot3Balance?.scaled ?? "0"))}</Heading>
                </Skeleton>
              </HStack>
            </VStack>
          </Stack>
          <Button
            isDisabled={buttonDisabled}
            onClick={onOpen}
            leftIcon={
              <UilExchangeAlt
                size={"16px"}
                style={{
                  transform: "rotate(90deg)",
                }}
              />
            }
            variant={"tertiaryAction"}
            rounded={"full"}
            fontSize="16px"
            fontWeight={500}
            px="24px"
            color="#004CFC"
            bgColor="rgba(224, 233, 254, 1)"
            _hover={{
              bg: "rgba(224, 233, 254, 0.9)",
              _disabled: {
                bg: "rgba(224, 233, 254, 0.7)",
              },
            }}>
            {t("Convert tokens")}
          </Button>
        </VStack>
      </Stack>
      <ConvertModal isOpen={isOpen} onClose={onClose} />
    </Card>
  )
}
