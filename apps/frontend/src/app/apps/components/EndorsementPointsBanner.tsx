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
  const { data: userNodesInfo, isLoading: isUserNodesLoading } = useGetUserNodes()
  const nodesEndorsementScore = useNodesEndorsementScore()
  const endorsedApps = useNodesEndorsedApps(userNodesInfo?.nodes?.map(node => node.id.toString()) ?? [])
  const requiredPoints = useEndorsementScoreThreshold()
  const isLoading = isUserNodesLoading || nodesEndorsementScore.isLoading || endorsedApps.isLoading
  const availablePoints = useMemo(() => {
    if (!userNodesInfo?.nodes || !endorsedApps.data || !nodesEndorsementScore.data) return 0
    const availableNodes = userNodesInfo?.nodes?.filter((_node, index) => !endorsedApps.data[index]?.endorsedApp)
    return availableNodes?.reduce((acc, node) => acc + Number(nodesEndorsementScore.data[Number(node.id)]), 0) ?? 0
  }, [nodesEndorsementScore.data, endorsedApps.data, userNodesInfo?.nodes])
  //TODO: Support multiple nodes
  const nodeToDisplay = userNodesInfo?.nodes?.[0]
  const nodeType = (nodeToDisplay?.id ?? 0) >= MinXNodeLevel ? "XNode" : "Node"
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
        src={nodeToDisplay?.metadata?.image ?? ""}
        alt={`node-${nodeToDisplay?.id}-image`}
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
