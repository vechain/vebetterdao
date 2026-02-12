"use client"

import { Dialog, Heading, HStack, Image, Portal, Table, Text, VStack } from "@chakra-ui/react"
import { UilCheck, UilTimes } from "@iconscout/react-unicons"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"

import { AppEndorsedEvent, useAppEndorsedEvents } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsedEvents"
import { useXAppMetadata } from "@/api/contracts/xApps/hooks/useXAppMetadata"
import { useEstimateBlockTimestamp } from "@/hooks/useEstimateBlockTimestamp"
import { convertUriToUrl } from "@/utils/uri"

import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"

type EndorsementHistoryModalProps = {
  node: UserNode
  isOpen: boolean
  onClose: () => void
}

const HistoryRow = ({ event }: { event: AppEndorsedEvent }) => {
  const { data: metadata } = useXAppMetadata(event.appId)
  const timestamp = useEstimateBlockTimestamp({ blockNumber: event.blockNumber })
  const dateStr = timestamp ? dayjs(timestamp).format("DD MMM, YYYY") : "—"

  return (
    <Table.Row>
      <Table.Cell>
        <HStack gap={2}>
          <Image src={convertUriToUrl(metadata?.logo ?? "")} alt={metadata?.name ?? ""} w="8" h="8" rounded="md" />
          <Text textStyle="sm">{metadata?.name ?? event.appId}</Text>
        </HStack>
      </Table.Cell>
      <Table.Cell>
        <HStack gap={1}>
          {event.endorsed ? <UilCheck size={16} color="green" /> : <UilTimes size={16} color="red" />}
          <Text textStyle="sm">{event.endorsed ? "Endorsed" : "Unendorsed"}</Text>
        </HStack>
      </Table.Cell>
      <Table.Cell>
        <Text textStyle="sm">{event.endorsed ? event.points : "—"}</Text>
      </Table.Cell>
      <Table.Cell>
        <Text textStyle="sm" color="text.subtle">
          {dateStr}
        </Text>
      </Table.Cell>
    </Table.Row>
  )
}

export const EndorsementHistoryModal = ({ node, isOpen, onClose }: EndorsementHistoryModalProps) => {
  const { t } = useTranslation()
  const { data: events } = useAppEndorsedEvents({ nodeId: node.id.toString() })
  const sortedEvents = (events ?? []).slice().sort((a, b) => b.blockNumber - a.blockNumber)

  return (
    <Dialog.Root open={isOpen} onOpenChange={e => !e.open && onClose()}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Heading textStyle="lg">{t("Activity history")}</Heading>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack align="stretch" gap={4}>
                <HStack gap={2}>
                  <Image src={node?.metadata?.image} alt={node?.metadata?.name ?? ""} w="10" h="10" rounded="lg" />
                  <Text textStyle="sm" fontWeight="semibold">
                    {node?.metadata?.name ?? ""}
                    {" #"}
                    {node?.id?.toString()}
                  </Text>
                </HStack>
                {sortedEvents.length > 0 ? (
                  <Table.Root size="sm">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader>{t("App")}</Table.ColumnHeader>
                        <Table.ColumnHeader>{t("Action")}</Table.ColumnHeader>
                        <Table.ColumnHeader>{t("Points endorsed")}</Table.ColumnHeader>
                        <Table.ColumnHeader>{t("Date")}</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {sortedEvents.map(event => (
                        <HistoryRow key={`${event.appId}-${event.nodeId}-${event.blockNumber}`} event={event} />
                      ))}
                    </Table.Body>
                  </Table.Root>
                ) : (
                  <Text textStyle="sm" color="text.subtle">
                    {t("No endorsement events")}
                  </Text>
                )}
              </VStack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  )
}
