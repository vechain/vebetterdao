import { useXNode } from "@/api"
import {
  Button,
  Card,
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
import { UilArrowCircleUp } from "@iconscout/react-unicons"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const XNodePageHeader = () => {
  const { t } = useTranslation()
  const { xNodeName, xNodeImage, xNodePoints, isXNodeLoading, isXNodeHolder, attachedGMTokenId } = useXNode()

  const isXNodeAttachedToGM = !!attachedGMTokenId

  const [isAbove800] = useMediaQuery("(min-width: 800px)")

  const actionLabel = useMemo(() => {
    if (isXNodeHolder && !isXNodeAttachedToGM) {
      return t("Attach and Upgrade!")
    }
    return t("Upgrade now!")
  }, [isXNodeAttachedToGM, isXNodeHolder, t])

  return (
    <Card>
      <Image
        src={"/images/xnode-page-background.png"}
        alt="gm-nft-header"
        position={"absolute"}
        w="100%"
        h="100%"
        rounded={"16px"}
      />
      <Stack
        direction={isAbove800 ? "row" : "column"}
        p={isAbove800 ? "24px" : "16px"}
        align={isAbove800 ? "stretch" : "flex-start"}
        spacing={4}
        zIndex={"2"}>
        <HStack
          align={isAbove800 ? "stretch" : "center"}
          justify="space-between"
          rounded="12px"
          gap={6}
          flex={1}
          cursor={"pointer"}
          color="#FFFFFF"
          flexGrow={4}>
          <Skeleton
            isLoaded={!isXNodeLoading}
            w={isAbove800 ? "132px" : "68px"}
            h={isAbove800 ? "132px" : "68px"}
            rounded="8px">
            <Image
              src={xNodeImage}
              alt="gm"
              w={isAbove800 ? "132px" : "68px"}
              h={isAbove800 ? "132px" : "68px"}
              rounded="8px"
            />
          </Skeleton>
          <VStack flex="1" align={"flex-start"} justify={"center"} gap={isAbove800 ? 2 : 1}>
            <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight="400" noOfLines={1} color="#FFFFFF80">
              {"XNODE"}
            </Text>
            <Text fontWeight={700} noOfLines={1} fontSize={isAbove800 ? "xl" : "md"}>
              {xNodeName}
            </Text>
            <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
              <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={600}>
                {xNodePoints}
              </Text>
              <Text fontSize={isAbove800 ? "md" : "xs"} fontWeight={400} noOfLines={1}>
                {t("points to endorse")}
              </Text>
            </HStack>
          </VStack>
        </HStack>
        <Flex w={isAbove800 ? "1px" : "full"} h={isAbove800 ? "auto" : "1px"} bg="#FFFFFF4D" flexBasis={"1px"} />
        <VStack
          align={"stretch"}
          justify={"center"}
          gap={isAbove800 ? 2 : 1}
          w={isAbove800 ? "auto" : "full"}
          flexGrow={1}>
          <HStack>
            <UilArrowCircleUp size={isAbove800 ? "24px" : "16px"} color="#B1F16C" />
            <Heading color="#FFFFFF" fontSize={isAbove800 ? "xl" : "md"} fontWeight={400}>
              {t("You can upgrade this node")}
            </Heading>
          </HStack>
          <Text color="#FFFFFFBF" fontSize={isAbove800 ? "md" : "xs"} fontWeight={400}>
            {t("GM NFT attached to XNode")}
          </Text>
          <Button
            variant={"tertiaryAction"}
            w="full"
            onClick={() => {}}
            mt={2}
            boxShadow={"0px 0px 9.4px 0px #B1F16C"}
            color="#080F1E"
            fontSize="sm"
            h="30px">
            {actionLabel}
          </Button>
        </VStack>
      </Stack>
    </Card>
  )
}
