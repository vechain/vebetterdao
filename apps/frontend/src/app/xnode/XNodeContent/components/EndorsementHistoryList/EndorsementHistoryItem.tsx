import { useXAppMetadata } from "@/api"
import { AppEndorsedEvent } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { useIpfsImage } from "@/api/ipfs"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import { HStack, Image, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

type Props = {
  event: AppEndorsedEvent
}

export const EndorsementHistoryItem = ({ event }: Props) => {
  const { t } = useTranslation()
  const { data: appMetadata } = useXAppMetadata(event.appId)
  const { data: logo } = useIpfsImage(appMetadata?.logo)
  const eventTimestamp = useEstimateBlockTimestamp({ blockNumber: event.blockNumber })

  return (
    <HStack>
      <Image src={logo?.image} alt="endorsed-app" w="12" h="12" rounded="xl" />
      <VStack align="stretch" gap={0}>
        <HStack gap={1} fontSize={["sm", "sm", "md"]}>
          <Text>{t("You endorsed")} </Text>
          <Text fontWeight="600">{appMetadata?.name}</Text>
        </HStack>
        <Text fontSize={["2xs", "2xs", "sm"]} color="#6A6A6A">
          {dayjs(eventTimestamp).fromNow()}
        </Text>
      </VStack>
    </HStack>
  )
}
