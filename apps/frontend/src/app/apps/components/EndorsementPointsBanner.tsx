import { Heading, Image, Skeleton, Stack, Text, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useEndorsementScoreThreshold } from "../../../api/contracts/xApps/hooks/useEndorsementScoreThreshold"
import { useGetUserNodes, UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"

export const EndorsementPointsBanner = () => {
  const { t } = useTranslation()
  const { data: userNodesInfo, isLoading: isUserNodesLoading } = useGetUserNodes()
  const requiredPoints = useEndorsementScoreThreshold()
  const isLoading = isUserNodesLoading
  const nodesWithAvailablePoints = useMemo(
    () => userNodesInfo?.nodesManagedByUser?.filter((node: UserNode) => node.availablePoints > BigInt(0)),
    [userNodesInfo?.nodesManagedByUser],
  )
  const availablePoints = useMemo(() => {
    return nodesWithAvailablePoints?.reduce((acc, node) => acc + Number(node.availablePoints), 0) ?? 0
  }, [nodesWithAvailablePoints])

  const firstAvailableNode = useMemo(() => nodesWithAvailablePoints?.[0], [nodesWithAvailablePoints])

  if (!availablePoints) return null
  return (
    <Stack
      direction={["column", "column", "row"]}
      gap={4}
      w="full"
      p="24px"
      borderRadius={"16px"}
      bgGradient="to-r"
      gradientFrom="#29295C"
      gradientTo="#4747A5">
      <Image
        src={firstAvailableNode?.metadata?.image}
        alt={firstAvailableNode?.metadata?.name ?? ""}
        h={["auto", "auto", "50px"]}
        w={["25%", "25%", "auto"]}
        borderRadius={"24px"}
      />
      <VStack w="full" gap={2} align="start">
        <Skeleton loading={isLoading}>
          <Heading size="md" color="white">
            {t("As {{nodeType}} holder, you have {{value}} available points to endorse Apps", {
              nodeType: firstAvailableNode?.type,
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
