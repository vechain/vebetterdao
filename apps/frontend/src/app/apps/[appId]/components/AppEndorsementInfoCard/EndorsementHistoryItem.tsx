import { Text, HStack, VStack } from "@chakra-ui/react"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { Trans, useTranslation } from "react-i18next"

import { AppEndorsedEvent } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { Clipboard } from "@/components/ui/clipboard"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"

type Props = {
  event: AppEndorsedEvent
}
export const EndorsementHistoryItem = ({ event }: Props) => {
  const { t } = useTranslation()
  const { endorsed: isEndorsing, points, endorser, blockNumber } = event
  const isEndorsingColor = isEndorsing ? "status.positive.primary" : "status.negative.primary"

  const endorsementEpoch = useEstimateBlockTimestamp({ blockNumber })
  const endorsingDate = dayjs(endorsementEpoch).format("MMM D, YYYY")
  const { data: vnsData } = useVechainDomain(endorser)
  const domain = vnsData?.domain

  return (
    <HStack
      p={2}
      borderRadius={"16px"}
      border="sm"
      bg="bg.primary"
      borderColor="border.secondary"
      w={"full"}
      alignItems={"center"}
      justify={"space-between"}>
      <VStack align="start" justifyContent={"flex-start"} gap={0} flex={1}>
        <HStack>
          <Text>{domain ? humanDomain(domain, 4, 26) : humanAddress(endorser, 6, 3)}</Text>
          <Clipboard value={endorser} />
        </HStack>

        <Text textStyle="xs" color="text.subtle">
          {t("{{date}}", { date: endorsingDate })}
        </Text>
      </VStack>
      <VStack align="end" gap={0}>
        <Text fontWeight="semibold" color={isEndorsingColor}>
          <Trans
            i18nKey="{{value}} pts."
            values={{ value: `${isEndorsing ? "+" : "-"}${points}` }}
            components={{
              Text: <Text as="span" fontWeight="semibold" color={isEndorsingColor} />,
            }}
          />
        </Text>
      </VStack>
    </HStack>
  )
}
