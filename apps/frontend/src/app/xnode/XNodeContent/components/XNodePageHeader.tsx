import { UserNode } from "@/api"
import { Card, HStack, Image, Stack, Text, useMediaQuery, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

export const XNodePageHeader = ({ xNode }: { xNode: UserNode }) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery(["(min-width: 800px)"])

  const { image: xNodeImage, name: xNodeName, nodeType, xNodePoints, isXNodeDelegator, isXNodeDelegatee } = xNode

  return (
    <Card.Root variant="primary" p="0">
      <Image
        src={"/assets/backgrounds/xnode-page-background.webp"}
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
        gap={4}
        zIndex={"0"}>
        <HStack
          align={isAbove800 ? "stretch" : "center"}
          justify="space-between"
          rounded="12px"
          gap={6}
          flex={1}
          cursor={"pointer"}
          color="white"
          flexGrow={4}>
          <Image
            src={xNodeImage}
            alt="gm"
            w={isAbove800 ? "132px" : "68px"}
            h={isAbove800 ? "132px" : "68px"}
            rounded="8px"
          />
          <VStack flex="1" align={"flex-start"} justify={"center"} gap={isAbove800 ? 2 : 1}>
            <Text textStyle={isAbove800 ? "md" : "xs"} lineClamp={1} color="#FFFFFF80">
              {nodeType}
            </Text>

            <Text color="white" fontWeight="bold" lineClamp={1} textStyle={isAbove800 ? "xl" : "md"}>
              {xNodeName}
            </Text>

            <HStack>
              {(isXNodeDelegator || isXNodeDelegatee) && (
                <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
                  <Text textStyle={isAbove800 ? "md" : "xs"}>{isXNodeDelegator ? "Node Owner" : "Manager"}</Text>
                </HStack>
              )}
              <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
                <Text color="white" textStyle={isAbove800 ? "md" : "xs"} fontWeight="semibold">
                  {xNodePoints}
                </Text>
                <Text color="white" textStyle={isAbove800 ? "md" : "xs"} lineClamp={1}>
                  {t("points to endorse")}
                </Text>
              </HStack>
            </HStack>
          </VStack>
        </HStack>
      </Stack>
    </Card.Root>
  )
}
