import { HStack, Text, VStack, Skeleton } from "@chakra-ui/react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { useGetUserNodes, UserNode } from "../../../../../api/contracts/xNodes/useGetUserNodes"
import { XAppStatus } from "../../../../../types/appDetails"
import { useXAppStatusConfig } from "../../hooks/useXAppStatusConfig"

import { EndorsersIcon } from "./EndorsersIcon"

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
  const yourScore = useMemo(() => {
    let total = BigInt(0)
    userNodes?.nodesManagedByUser?.forEach((node: UserNode) => {
      node.activeEndorsements.forEach(e => {
        if (e.appId === appId) total += e.points
      })
    })
    return total.toString()
  }, [userNodes, appId])
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
            <Text textStyle={"2xl"} fontWeight="bold" color="status.info.primary">
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
            <Text textStyle={"xl"} fontWeight="bold" color="actions.secondary.text-lighter">
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
