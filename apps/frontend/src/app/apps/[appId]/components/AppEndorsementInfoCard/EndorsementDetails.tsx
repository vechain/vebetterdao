import { HStack, Text, VStack, Skeleton } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { EndorsersIcon } from "./EndorsersIcon"
import { XAppStatus } from "@/types"

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

  // TODO refactor
  const STATUS_COLOR_SCHEME: Partial<Record<XAppStatus, string>> = {
    [XAppStatus.LOOKING_FOR_ENDORSEMENT]: "#F29B32",
    [XAppStatus.ENDORSED_NOT_ELIGIBLE]: "#3DBA67",
    [XAppStatus.ENDORSED_AND_ELIGIBLE]: "#3DBA67",
    [XAppStatus.UNENDORSED_AND_ELIGIBLE]: "#F29B32",
    [XAppStatus.UNENDORSED_NOT_ELIGIBLE]: "#C84968",
  }

  // Retrieve color from STATUS_CONFIG or default to a neutral color
  const statusColor = STATUS_COLOR_SCHEME[endorsementStatus] ?? "#6A6A6A"

  return (
    <HStack w="full" spacing={8}>
      <VStack gap={0} alignItems="flex-start">
        <Skeleton isLoaded={!isEndorsementStatusLoading}>
          <HStack spacing={1} alignItems="flex-end">
            <Text fontSize={"24px"} fontWeight="700" color={statusColor}>
              {endorsementScore}
            </Text>
            <Text fontSize={"14px"} color={statusColor} pb="3.5px">{`/${endorsementThreshold}`}</Text>
          </HStack>
        </Skeleton>
        <Text fontSize="12px" color="#6A6A6A">
          {t("Total score")}
        </Text>
      </VStack>

      {isUserAppEndorser && (
        <VStack gap={0} alignItems="flex-start">
          <Skeleton isLoaded={!isXNodeLoading}>
            <Text fontSize={"24px"} fontWeight="700" color="#004CFC">
              {xNodePoints}
            </Text>
          </Skeleton>
          <Text fontSize="12px" color="#6A6A6A">
            {t("Your score")}
          </Text>
        </VStack>
      )}

      <VStack gap={0} alignItems="flex-start">
        <Skeleton isLoaded={!isAppEndorsersLoading}>
          <HStack>
            <EndorsersIcon endorsers={endorsers ?? []} />
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
