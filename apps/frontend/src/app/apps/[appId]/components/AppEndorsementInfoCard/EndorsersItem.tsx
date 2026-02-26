import { Text, HStack, VStack, Popover, Portal, Image, Skeleton } from "@chakra-ui/react"
import { UilTrash, UilCheck } from "@iconscout/react-unicons"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Trans, useTranslation } from "react-i18next"
import { HiDotsVertical } from "react-icons/hi"

import { useNodeMetadata } from "@/api/contracts/xNodes/useNodeMetadata"
import { AddressIcon } from "@/components/AddressIcon"

export type EndorserGroupData = {
  endorserAddress: string
  totalPoints: bigint
  nodes: Array<{
    nodeId: string
    points: bigint
    latestBlockNumber: number
  }>
}

type Props = {
  group: EndorserGroupData
  isAppAdmin: boolean
  onRemoveNode: (nodeId: string, endorserAddress: string, points: string) => void
}

const EndorserNodeRow = ({
  nodeId,
  points,
  isAppAdmin,
  endorserAddress,
  onRemoveNode,
}: {
  nodeId: string
  points: bigint
  isAppAdmin: boolean
  endorserAddress: string
  onRemoveNode: (nodeId: string, endorserAddress: string, points: string) => void
}) => {
  const { data: metadata, isLoading } = useNodeMetadata(nodeId)

  return (
    <HStack w="full" justify="space-between" pl={2} pr={2} py={2} borderRadius="md" bg="bg.subtle">
      <HStack gap={2}>
        <Skeleton loading={isLoading} boxSize="28px" rounded="md">
          <Image src={metadata?.image} alt={metadata?.name} boxSize="28px" rounded="sm" objectFit="cover" />
        </Skeleton>
        <Skeleton loading={isLoading}>
          <Text textStyle="sm" color="text.subtle" lineClamp={1}>
            {metadata?.name}
            {" #"}
            {nodeId}
          </Text>
        </Skeleton>
      </HStack>
      <HStack gap={3}>
        <Text textStyle="sm" fontWeight="semibold">
          <Trans
            i18nKey="{{value}} pts."
            values={{ value: points.toString() }}
            components={{ Text: <Text as="span" /> }}
          />
        </Text>
        {isAppAdmin && (
          <HStack
            as="button"
            color="status.negative.primary"
            cursor="pointer"
            onClick={() => onRemoveNode(nodeId, endorserAddress, points.toString())}>
            <UilTrash size="16" />
          </HStack>
        )}
      </HStack>
    </HStack>
  )
}

export const EndorsersItem = ({ group, isAppAdmin, onRemoveNode }: Props) => {
  const { t } = useTranslation()
  const router = useRouter()
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  const { data: vnsData } = useVechainDomain(group.endorserAddress)
  const domain = vnsData?.domain
  const displayName = domain ? humanDomain(domain, 4, 26) : humanAddress(group.endorserAddress, 6, 3)

  const goToEndorserUserProfilePage = () => {
    router.push("/profile/" + group.endorserAddress + "?tab=gm")
  }

  return (
    <VStack p={"12px"} borderRadius={"16px"} border="sm" borderColor="border.secondary" w={"full"} gap={2}>
      <HStack w="full" justify="space-between">
        <HStack alignItems={"center"} gap={4}>
          <AddressIcon address={group.endorserAddress} rounded="full" h="28px" w="28px" />
          <VStack align="start" justify={"center"} gap={0}>
            <Text>{displayName}</Text>
            <Text textStyle="xs" color="text.subtle">
              <Trans
                i18nKey="{{count}} node(s)"
                values={{ count: group.nodes.length }}
                components={{ Text: <Text as="span" /> }}
              />
            </Text>
          </VStack>
        </HStack>
        <HStack alignItems={"center"} gap={4}>
          <Popover.Root
            positioning={{ placement: "bottom-end" }}
            open={isPopoverOpen}
            onOpenChange={details => setIsPopoverOpen(details.open)}>
            <Popover.Trigger asChild>
              <HStack as="button" onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
                <HiDotsVertical />
              </HStack>
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner>
                <Popover.Content width="auto" boxShadow="md" border="1px solid #EFEFEF">
                  <Popover.Body p={2}>
                    <VStack alignItems="stretch" gap={3}>
                      <HStack onClick={goToEndorserUserProfilePage} cursor="pointer">
                        <UilCheck color={"#004CFC"} />
                        <Text textStyle={["sm", "md"]}>{t("See endorser info")}</Text>
                      </HStack>
                    </VStack>
                  </Popover.Body>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        </HStack>
      </HStack>

      {group.nodes.map(node => (
        <EndorserNodeRow
          key={node.nodeId}
          nodeId={node.nodeId}
          points={node.points}
          isAppAdmin={isAppAdmin}
          endorserAddress={group.endorserAddress}
          onRemoveNode={onRemoveNode}
        />
      ))}
    </VStack>
  )
}
