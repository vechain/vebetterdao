import { Box, Card, Flex, HStack, Image, Stack, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { UserNode } from "../../../../api/contracts/xNodes/useGetUserNodes"
import { useBreakpoints } from "../../../../hooks/useBreakpoints"

export const XNodePageHeader = ({ node }: { node: UserNode }) => {
  const { t } = useTranslation()
  const { isMobile } = useBreakpoints()
  const isDelegator = !node?.currentUserIsManager && node?.currentUserIsOwner
  const isDelegatee = node?.currentUserIsManager

  const hasEndorsementPower = node.endorsementScore > 0n
  const usedPoints = node.activeEndorsements.reduce((sum, e) => sum + e.points, 0n)
  const totalPoints = Number(node.endorsementScore)
  const usedPercent = totalPoints > 0 ? (Number(usedPoints) / totalPoints) * 100 : 0

  return (
    <Card.Root variant="primary" p="0">
      <Image
        src="/assets/backgrounds/xnode-page-background.webp"
        alt="xnode-header"
        position="absolute"
        w="100%"
        h="100%"
        rounded="16px"
      />
      <Stack
        direction={isMobile ? "column" : "row"}
        p={isMobile ? "16px" : "24px"}
        align={isMobile ? "flex-start" : "stretch"}
        gap={4}
        zIndex="0">
        <HStack
          align={isMobile ? "center" : "stretch"}
          justify="space-between"
          rounded="12px"
          gap={6}
          flex={1}
          color="white"
          flexGrow={4}>
          <Image
            src={node?.metadata?.image}
            alt={node?.metadata?.name ?? ""}
            w={isMobile ? "68px" : "132px"}
            h={isMobile ? "68px" : "132px"}
            rounded="8px"
          />
          <VStack flex="1" align="flex-start" justify="center" gap={isMobile ? 1 : 2}>
            <Text textStyle={isMobile ? "xs" : "md"} lineClamp={1} color="#FFFFFF80">
              {node?.type}
            </Text>
            <Text color="white" fontWeight="bold" lineClamp={1} textStyle={isMobile ? "md" : "xl"}>
              {node?.metadata?.name ?? ""}
            </Text>

            <HStack flexWrap="wrap" gap={2}>
              {(isDelegator || isDelegatee) && (
                <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
                  <Text color="white" textStyle={isMobile ? "xs" : "md"}>
                    {isDelegator ? "Node Owner" : "Manager"}
                  </Text>
                </HStack>
              )}
              <HStack bg="#FFFFFF4A" rounded="8px" padding="4px 8px" gap={1}>
                <Text color="white" textStyle={isMobile ? "xs" : "md"} fontWeight="semibold">
                  {node.endorsementScore.toString()}
                </Text>
                <Text color="white" textStyle={isMobile ? "xs" : "md"} lineClamp={1}>
                  {t("points to endorse")}
                </Text>
              </HStack>
            </HStack>

            {hasEndorsementPower && (
              <Flex direction="column" gap={1} w="full" maxW="320px" mt={1}>
                <HStack justify="space-between" textStyle="xs">
                  <Text color="#FFFFFFCC">
                    {t("Used")}
                    {": "}
                    {usedPoints.toString()} {t("pts")}
                  </Text>
                  <Text color="#FFFFFFCC">
                    {t("Available")}
                    {": "}
                    {node.availablePoints.toString()} {t("pts")}
                  </Text>
                </HStack>
                <Box w="full" h="6px" borderRadius="full" overflow="hidden" bg="#FFFFFF33">
                  {usedPercent > 0 && (
                    <Box w={`${usedPercent}%`} h="full" bg="white" borderRadius="full" flexShrink={0} />
                  )}
                </Box>
              </Flex>
            )}
          </VStack>
        </HStack>
      </Stack>
    </Card.Root>
  )
}
