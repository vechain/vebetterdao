import { useEndorsementScoreThreshold, useNodesEndorsedApps, useNodesEndorsementScore, useUserXNodes } from "@/api"
import { MinXNodeLevel } from "@/constants/XNode"
import { Heading, Image, Skeleton, Stack, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

export const EndorsementPointsBanner = () => {
  const { t } = useTranslation()
  const userXNodes = useUserXNodes()
  const nodesEndorsementScore = useNodesEndorsementScore()
  const endorsedApps = useNodesEndorsedApps(userXNodes.data?.map(node => node.id) ?? [])
  const requiredPoints = useEndorsementScoreThreshold()

  const isLoading = userXNodes.isLoading || nodesEndorsementScore.isLoading || endorsedApps.isLoading
  const availablePoints = useMemo(() => {
    if (!userXNodes.data || !endorsedApps.data || !nodesEndorsementScore.data) return 0

    const availableNodes = userXNodes.data?.filter((_node, index) => !endorsedApps.data[index]?.endorsedApp)
    return availableNodes?.reduce((acc, node) => acc + Number(nodesEndorsementScore.data[Number(node.level)]), 0) ?? 0
  }, [nodesEndorsementScore.data, endorsedApps.data, userXNodes.data])

  //TODO: Support multiple nodes
  const nodeToDisplay = userXNodes.data?.[0]
  const nodeType = (nodeToDisplay?.level ?? 0) >= MinXNodeLevel ? "XNode" : "Node"

  if (!availablePoints) return null

  return (
    <Stack
      direction={["column", "column", "row"]}
      spacing={2}
      w="full"
      p="24px"
      borderRadius={"24px"}
      bgGradient={"linear(to-r, #29295C,#4747A5)"}>
      <Image
        src={nodeToDisplay?.image}
        alt={`node-${nodeToDisplay?.level}-image`}
        h={["auto", "auto", "50px"]}
        w={["25%", "25%", "auto"]}
        borderRadius={"24px"}
      />

      <VStack w="full" spacing={2} align="start">
        <Skeleton isLoaded={!isLoading}>
          <Heading fontSize={"16px"} fontWeight={700} color="white">
            {t("As {{nodeType}} holder, you have {{value}} available points to endorse Apps", {
              nodeType,
              value: availablePoints,
            })}
          </Heading>
        </Skeleton>
        <Skeleton isLoaded={!requiredPoints.isLoading}>
          <Text fontSize={"14px"} fontWeight={400} color="white">
            {t("Help a project to reach {{value}} points and join the next allocations to get funding.", {
              value: requiredPoints.data,
            })}
          </Text>
        </Skeleton>
      </VStack>
    </Stack>
  )
}
