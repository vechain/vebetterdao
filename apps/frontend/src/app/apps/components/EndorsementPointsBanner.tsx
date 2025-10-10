import { Heading, Image, Skeleton, Stack, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { MinXNodeLevel } from "@/constants/XNode"

import { useNodesEndorsementScore } from "../../../api/contracts/xApps/hooks/endorsement/useNodesEndorsementScore"
import { useNodesEndorsedApps } from "../../../api/contracts/xApps/hooks/endorsement/useUserNodesEndorsement"
import { useEndorsementScoreThreshold } from "../../../api/contracts/xApps/hooks/useEndorsementScoreThreshold"
import { useGetUserNodes } from "../../../api/contracts/xNodes/useGetUserNodes"

export const EndorsementPointsBanner = () => {
  const { t } = useTranslation()
  const { data: nodes, isLoading: isUserNodesLoading } = useGetUserNodes()
  const nodesEndorsementScore = useNodesEndorsementScore()
  const endorsedApps = useNodesEndorsedApps(nodes?.allNodes?.map(node => node.nodeId) ?? [])
  const requiredPoints = useEndorsementScoreThreshold()
  const isLoading = isUserNodesLoading || nodesEndorsementScore.isLoading || endorsedApps.isLoading
  const availablePoints = useMemo(() => {
    if (!nodes?.allNodes || !endorsedApps.data || !nodesEndorsementScore.data) return 0
    const availableNodes = nodes?.allNodes?.filter((_node, index) => !endorsedApps.data[index]?.endorsedApp)
    return (
      availableNodes?.reduce((acc, node) => acc + Number(nodesEndorsementScore.data[Number(node.nodeLevel)]), 0) ?? 0
    )
  }, [nodesEndorsementScore.data, endorsedApps.data, nodes?.allNodes])
  //TODO: Support multiple nodes
  const nodeToDisplay = nodes?.allNodes?.[0]
  const nodeType = (nodeToDisplay?.nodeLevel ?? 0) >= MinXNodeLevel ? "XNode" : "Node"
  if (!availablePoints) return null
  return (
    <Stack
      direction={["column", "column", "row"]}
      gap={4}
      w="full"
      p="24px"
      borderRadius={"16px"}
      bgGradient={"linear(to-r, #29295C,#4747A5)"}>
      <Image
        src={nodeToDisplay?.image}
        alt={`node-${nodeToDisplay?.nodeLevel}-image`}
        h={["auto", "auto", "50px"]}
        w={["25%", "25%", "auto"]}
        borderRadius={"24px"}
      />
      <VStack w="full" gap={2} align="start">
        <Skeleton loading={isLoading}>
          <Heading size="md" color="white">
            {t("As {{nodeType}} holder, you have {{value}} available points to endorse Apps", {
              nodeType,
              value: availablePoints,
            })}
          </Heading>
        </Skeleton>
        <Skeleton loading={requiredPoints.isLoading}>
          <Text textStyle={"sm"} color="white">
            {t("Help a project to reach {{value}} points and join the next allocation round and secure funding.", {
              value: requiredPoints.data,
            })}
          </Text>
        </Skeleton>
      </VStack>
    </Stack>
  )
}
