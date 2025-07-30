import { AppEndorsedEvent } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { Text, HStack, VStack, Skeleton } from "@chakra-ui/react"
import { UilCheck, UilCopy } from "@iconscout/react-unicons"
import { useCallback, useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import dayjs from "dayjs"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import { useNodeEndorsementScore } from "@/hooks/useNodeEndorsementScore"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useGetNodeManager } from "@/hooks"

type Props = {
  event: AppEndorsedEvent
}

export const EndorsementHistoryItem = ({ event }: Props) => {
  const { t } = useTranslation()

  // Retrieve the nodeId, blockNumber, and endorsed from the event
  const { nodeId, blockNumber, endorsed: isEndorsing } = event
  const isEndorsingColor = isEndorsing ? "#3DBA67" : "#C84968"

  // Obtain address managing the node, which is not necessarily the same as the event txOrigin
  const { data: endorserAddress, isLoading: endorserAddressLoading } = useGetNodeManager(nodeId)

  // Obtain the node points
  const { data: nodePoints, isLoading: nodePointsLoading } = useNodeEndorsementScore(nodeId)

  // Obtain the date
  const endorsementEpoch = useEstimateBlockTimestamp({ blockNumber })
  const endorsingDate = dayjs(endorsementEpoch).format("MMM D, YYYY")

  // Allow users to copy endorser addresses on history list to clipboard
  const [showCopiedLink, setShowCopiedLink] = useState(false)
  const handleCopyEndorserAddress = useCallback(async () => {
    await navigator.clipboard.writeText(endorserAddress ?? "")
    setShowCopiedLink(true)
    setTimeout(() => {
      setShowCopiedLink(false)
    }, 2000)
  }, [endorserAddress])

  const { data: vnsData } = useVechainDomain(endorserAddress)
  const domain = vnsData?.domain
  return (
    <HStack
      p={2}
      borderRadius={"16px"}
      border="none"
      borderBottom={"1px solid #EFEFEF"}
      w={"full"}
      alignItems={"center"}
      justify={"space-between"}>
      <VStack align="start" justifyContent={"flex-start"} gap={0} flex={1}>
        <Skeleton loading={endorserAddressLoading}>
          <HStack>
            <Text>{domain ? humanDomain(domain, 4, 26) : humanAddress(endorserAddress ?? "", 6, 3)}</Text>
            {showCopiedLink ? (
              <UilCheck size={"18px"} color="#6DCB09" />
            ) : (
              <UilCopy size={"18px"} color="#6A6A6A" onClick={handleCopyEndorserAddress} cursor="pointer" />
            )}
          </HStack>
        </Skeleton>

        <Text fontSize="xs" color="#6A6A6A">
          {t("{{date}}", {
            date: endorsingDate,
          })}
        </Text>
      </VStack>
      <VStack align="end" gap={0} flex={1} w="full">
        <HStack gap={1} align="flex-start">
          <Text fontWeight={600} color={isEndorsingColor}>
            {`${isEndorsing ? "+" : "-"}`}
          </Text>
          <Skeleton loading={nodePointsLoading}>
            <Text fontWeight={600} color={isEndorsingColor}>
              <Trans
                i18nKey="{{value}} pts."
                values={{ value: nodePoints }}
                components={{
                  Text: <Text as="span" fontWeight={600} color={isEndorsingColor} />,
                }}
              />
            </Text>
          </Skeleton>
        </HStack>
      </VStack>
    </HStack>
  )
}
