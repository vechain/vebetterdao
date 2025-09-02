import { HStack, Text, VStack, Skeleton } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { EndorsersIcon } from "./EndorsersIcon"
import { XAppStatus } from "@/types"
import { useXAppStatusConfig } from "../../hooks"
import { useGetUserNodes } from "@/api"

type Props = {
  endorsementScore?: string
  endorsementStatus: XAppStatus
  endorsementThreshold?: string
  isEndorsementStatusLoading: boolean
  isUserAppEndorser: boolean
  endorsers: string[]
  isAppEndorsersLoading: boolean
  appId: string
}

export const EndorsementDetails = ({
  endorsementScore,
  endorsementStatus,
  endorsementThreshold,
  isEndorsementStatusLoading,
  isUserAppEndorser,
  endorsers,
  isAppEndorsersLoading,
  appId,
}: Props) => {
  const { t } = useTranslation()
  const { data: userNodes, isLoading: isUserNodesLoading } = useGetUserNodes()
  const yourScore = userNodes?.allNodes?.find(node => node.endorsedAppId === appId)?.xNodePoints

  const STATUS_CONFIG = useXAppStatusConfig()
  const { color } = STATUS_CONFIG[endorsementStatus] ?? { color: "#6A6A6A" }

  return (
    <HStack w="full" justify="space-between" gap={4}>
      <VStack gap={0} alignItems="center">
        <Skeleton loading={isEndorsementStatusLoading}>
          <HStack gap={1} alignItems="flex-end">
            <Text textStyle={"2xl"} fontWeight="bold" color={color}>
              {endorsementScore}
            </Text>
            <Text textStyle={"sm"} color={color} pb="3.5px">{`/${endorsementThreshold}`}</Text>
          </HStack>
        </Skeleton>
        <Text textStyle="xs" color="text.subtle">
          {t("Total score")}
        </Text>
      </VStack>

      {isUserAppEndorser && (
        <VStack gap={0} alignItems="center">
          <Skeleton loading={isUserNodesLoading}>
            <Text textStyle={"2xl"} fontWeight="bold" color="#004CFC">
              {yourScore}
            </Text>
          </Skeleton>
          <Text textStyle="xs" color="text.subtle">
            {t("Your score")}
          </Text>
        </VStack>
      )}

      <VStack gap={0} alignItems="center">
        <Skeleton loading={isAppEndorsersLoading}>
          <HStack>
            {endorsers && endorsers.length > 0 && <EndorsersIcon endorsers={endorsers} />}
            <Text textStyle={"2xl"} fontWeight="bold" color="#004CFC">
              {endorsers?.length}
            </Text>
          </HStack>
        </Skeleton>
        <Text textStyle="xs" color="text.subtle">
          {t("Users endorsing")}
        </Text>
      </VStack>
    </HStack>
  )
}
