"use client"

import { Heading, HStack, Image, Text, VStack } from "@chakra-ui/react"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

import { AppEndorsedEvent, useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { useXAppMetadata } from "@/api/contracts/xApps/hooks/useXAppMetadata"
import { BaseModal } from "@/components/BaseModal"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import { convertUriToUrl } from "@/utils/uri"

import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"

type EndorsementHistoryModalProps = {
  node: UserNode
  isOpen: boolean
  onClose: () => void
}

const HistoryRow = ({ event }: { event: AppEndorsedEvent }) => {
  const { t } = useTranslation()
  const { data: metadata } = useXAppMetadata(event.appId)
  const timestamp = useEstimateBlockTimestamp({ blockNumber: event.blockNumber })
  const dateStr = timestamp ? dayjs(timestamp).format("DD MMM, YYYY") : "—"
  const pointsColor = event.endorsed ? "status.positive.primary" : "status.negative.primary"

  return (
    <HStack
      p={2}
      borderRadius="16px"
      border="sm"
      bg="bg.primary"
      borderColor="border.secondary"
      w="full"
      align="center"
      justify="space-between">
      <HStack gap={2} flex={1}>
        <Image src={convertUriToUrl(metadata?.logo ?? "")} alt={metadata?.name ?? ""} w="8" h="8" rounded="md" />
        <VStack align="start" gap={0}>
          <Text textStyle="sm" fontWeight="semibold">
            {metadata?.name ?? event.appId}
          </Text>
          <Text textStyle="xs" color="text.subtle">
            {dateStr}
          </Text>
        </VStack>
      </HStack>
      <Text fontWeight="semibold" color={pointsColor}>
        {event.endorsed ? `+${event.points}` : `-${event.points}`} {t("pts")}
      </Text>
    </HStack>
  )
}

export const EndorsementHistoryModal = ({ node, isOpen, onClose }: EndorsementHistoryModalProps) => {
  const { t } = useTranslation()
  const { data: events } = useAppEndorsedEvents({ nodeId: node.id.toString() })
  const sortedEvents = (events ?? []).slice().sort((a, b) => b.blockNumber - a.blockNumber)

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      isCloseable
      showCloseButton
      modalContentProps={{ maxH: "80vh" }}
      modalBodyProps={{ overflowY: "auto" }}>
      <VStack align="start" gap={4} w="full">
        <HStack gap={3}>
          <Image src={node?.metadata?.image} alt={node?.metadata?.name ?? ""} w="10" h="10" rounded="lg" />
          <VStack align="start" gap={0}>
            <Heading size="2xl">{t("Activity history")}</Heading>
            <Text textStyle="sm" color="text.subtle">
              {node?.metadata?.name ?? ""} {"#"}
              {node?.id?.toString()}
            </Text>
          </VStack>
        </HStack>

        {sortedEvents.length > 0 ? (
          <VStack gap={2} w="full">
            {sortedEvents.map(event => (
              <HistoryRow key={`${event.appId}-${event.nodeId}-${event.blockNumber}`} event={event} />
            ))}
          </VStack>
        ) : (
          <Text textStyle="sm" color="text.subtle">
            {t("No endorsement events")}
          </Text>
        )}
      </VStack>
    </BaseModal>
  )
}
