import { HStack, Text, VStack, Skeleton } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { EndorsersIcon } from "./EndorsersIcon"
import { XAppStatus } from "@/types"
import { useXAppStatusConfig } from "../../hooks"

type Props = {
  endorsementScore?: string
  endorsementStatus: XAppStatus
  endorsementThreshold?: string
  isEndorsementStatusLoading: boolean
  xNodePoints: number
  isUserAppEndorser: boolean
  isXNodeLoading: boolean
  endorsers: string[]
  isAppEndorsersLoading: boolean
}

export const EndorsementDetails = ({
  endorsementScore,
  endorsementStatus,
  endorsementThreshold,
  isEndorsementStatusLoading,
  xNodePoints,
  isUserAppEndorser,
  isXNodeLoading,
  endorsers,
  isAppEndorsersLoading,
}: Props) => {
  const { t } = useTranslation()

  const STATUS_CONFIG = useXAppStatusConfig()
  const { color } = STATUS_CONFIG[endorsementStatus] ?? { color: "#6A6A6A" }

  return (
    <HStack w="full" justify="space-between" gap={4}>
      <VStack gap={0} alignItems="center">
        <Skeleton loading={isEndorsementStatusLoading}>
          <HStack gap={1} alignItems="flex-end">
            <Text fontSize={"24px"} fontWeight="700" color={color}>
              {endorsementScore}
            </Text>
            <Text fontSize={"14px"} color={color} pb="3.5px">{`/${endorsementThreshold}`}</Text>
          </HStack>
        </Skeleton>
        <Text fontSize="12px" color="#6A6A6A">
          {t("Total score")}
        </Text>
      </VStack>

      {isUserAppEndorser && (
        <VStack gap={0} alignItems="center">
          <Skeleton loading={isXNodeLoading}>
            <Text fontSize={"24px"} fontWeight="700" color="#004CFC">
              {xNodePoints}
            </Text>
          </Skeleton>
          <Text fontSize="12px" color="#6A6A6A">
            {t("Your score")}
          </Text>
        </VStack>
      )}

      <VStack gap={0} alignItems="center">
        <Skeleton loading={isAppEndorsersLoading}>
          <HStack>
            {endorsers && endorsers.length > 0 && <EndorsersIcon endorsers={endorsers} />}
            <Text fontSize={"24px"} fontWeight="700" color="#004CFC">
              {endorsers?.length}
            </Text>
          </HStack>
        </Skeleton>
        <Text fontSize="12px" color="#6A6A6A">
          {t("Users endorsing")}
        </Text>
      </VStack>
    </HStack>
  )
}
