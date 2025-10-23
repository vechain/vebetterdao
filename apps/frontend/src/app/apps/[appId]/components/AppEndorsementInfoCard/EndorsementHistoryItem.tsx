import { Text, HStack, VStack, Skeleton } from "@chakra-ui/react"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import { Trans, useTranslation } from "react-i18next"

import { AppEndorsedEvent } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { Clipboard } from "@/components/ui/clipboard"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import { useNodeEndorsementScore } from "@/hooks/useNodeEndorsementScore"

import { useGetNodeManager } from "../../../../../hooks/useNodeManager"

type Props = {
  event: AppEndorsedEvent
}
export const EndorsementHistoryItem = ({ event }: Props) => {
  const { t } = useTranslation()
  // Retrieve the nodeId, blockNumber, and endorsed from the event
  const { nodeId, blockNumber, endorsed: isEndorsing } = event
  const isEndorsingColor = isEndorsing ? "status.positive.primary" : "status.negative.primary"
  // Obtain address managing the node, which is not necessarily the same as the event txOrigin
  const { data: endorserAddress, isLoading: endorserAddressLoading } = useGetNodeManager(nodeId)
  // Obtain the node points
  const { data: nodePoints, isLoading: nodePointsLoading } = useNodeEndorsementScore(nodeId)
  // Obtain the date
  const endorsementEpoch = useEstimateBlockTimestamp({ blockNumber })
  const endorsingDate = dayjs(endorsementEpoch).format("MMM D, YYYY")
  const { data: vnsData } = useVechainDomain(endorserAddress)
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
        <Skeleton loading={endorserAddressLoading}>
          <HStack>
            <Text>{domain ? humanDomain(domain, 4, 26) : humanAddress(endorserAddress ?? "", 6, 3)}</Text>
            <Clipboard value={endorserAddress || ""} />
          </HStack>
        </Skeleton>

        <Text textStyle="xs" color="text.subtle">
          {t("{{date}}", {
            date: endorsingDate,
          })}
        </Text>
      </VStack>
      <VStack align="end" gap={0}>
        <HStack gap={1} align="flex-start">
          <Text fontWeight="semibold" color={isEndorsingColor}>
            {`${isEndorsing ? "+" : "-"}`}
          </Text>
          <Skeleton loading={nodePointsLoading}>
            <Text fontWeight="semibold" color={isEndorsingColor}>
              <Trans
                i18nKey="{{value}} pts."
                values={{ value: nodePoints }}
                components={{
                  Text: <Text as="span" fontWeight="semibold" color={isEndorsingColor} />,
                }}
              />
            </Text>
          </Skeleton>
        </HStack>
      </VStack>
    </HStack>
  )
}
