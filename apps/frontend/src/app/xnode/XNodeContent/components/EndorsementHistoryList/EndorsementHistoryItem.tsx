import { AppEndorsedEvent } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { useIpfsImage } from "@/api/ipfs"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import { Box, HStack, Image, Text, VStack } from "@chakra-ui/react"
import { UilCheck, UilTimes } from "@iconscout/react-unicons"
import { useXAppMetadata } from "@vechain/vechain-kit"
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
      <Box position="relative">
        <Image src={logo?.image} alt="endorsed-app" w="12" h="12" rounded="xl" />
        <Box position="absolute" bottom="-6px" right="-6px" bg="white" rounded="full" zIndex={1}>
          {event.endorsed ? <UilCheck size="16" color="green" /> : <UilTimes size="16" color="red" />}
        </Box>
      </Box>
      <VStack align="stretch" gap={0}>
        <HStack gap={1} fontSize={["sm", "sm", "md"]}>
          <Text>{t(event.endorsed ? "You endorsed" : "You unendorsed")} </Text>
          <Text fontWeight="600">{appMetadata?.name}</Text>
        </HStack>
        <Text fontSize={["2xs", "2xs", "sm"]} color="#6A6A6A">
          {dayjs(eventTimestamp).fromNow()}
        </Text>
      </VStack>
    </HStack>
  )
}
