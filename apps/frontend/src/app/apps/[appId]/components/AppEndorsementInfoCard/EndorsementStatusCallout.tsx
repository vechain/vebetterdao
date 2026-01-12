import { HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { UilExclamationCircle } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { Trans, useTranslation } from "react-i18next"

import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"

import { useGracePeriodEvent } from "../../../../../api/contracts/xApps/hooks/useGracePeriodEvent"
import { XAppStatus } from "../../../../../types/appDetails"
import { useCurrentAppInfo } from "../../hooks/useCurrentAppInfo"
import { useXAppStatusConfig } from "../../hooks/useXAppStatusConfig"

type Props = {
  endorsementStatus: XAppStatus
  showDescription?: boolean
  padding?: number
}
export const EndorsementStatusCallout = ({ endorsementStatus, showDescription = true, padding = 4 }: Props) => {
  const STATUS_CONFIG = useXAppStatusConfig()
  const { t } = useTranslation()
  const { app, isAppInfoLoading } = useCurrentAppInfo()
  const { data: gracePeriodEvent, isLoading: isGracePeriodEventLoading } = useGracePeriodEvent(app?.id)
  const gracePeriodEndBlockNumber = Number(gracePeriodEvent?.endBlock) || 0
  const gracePeriodEndTimestamp = useEstimateBlockTimestamp({ blockNumber: gracePeriodEndBlockNumber })
  const gracePeriodEndDate =
    gracePeriodEndTimestamp === 0 ? "Pending" : dayjs(gracePeriodEndTimestamp).format("ddd DD MMM")
  const { title, description, backgroundColor, color, icon } = STATUS_CONFIG[endorsementStatus] ?? {
    title: t("Endorsement coming soon"),
    description: t("Endorsement details available from next round."),
    backgroundColor: "#F8F8F8",
    color: "#6A6A6A",
    icon: UilExclamationCircle,
  }
  return (
    <VStack flex="1" p={padding} borderRadius="8px" backgroundColor={backgroundColor}>
      <HStack w="full">
        <Icon as={icon} boxSize={6} color={color} />
        <Text textStyle="md" fontWeight="semibold" color={color}>
          {title}
        </Text>
      </HStack>
      {showDescription && (
        <Skeleton loading={isAppInfoLoading || isGracePeriodEventLoading} w="full">
          <Text textStyle="sm" color="text.subtle">
            <Trans i18nKey={description as any} values={{ gracePeriodEndDate }} t={t} />
          </Text>
        </Skeleton>
      )}
    </VStack>
  )
}
