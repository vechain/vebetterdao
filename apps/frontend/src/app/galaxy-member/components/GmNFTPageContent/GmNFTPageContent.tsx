import { Card, Stack, VStack, Text, Heading, useDisclosure, Spinner } from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"

import { useGetUserGMs } from "../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useGetUserNodes, UserNode } from "../../../../api/contracts/xNodes/useGetUserNodes"

import { GalaxyLevelsCard } from "./components/GalaxyLevelsCard"
import { GmNFTPageHeader } from "./components/GmNFTPageHeader"
import { GmPoolAmountCard } from "./components/GmPoolAmountCard"
import { NodeRow } from "./components/NodeRow"

export const GmNFTPageContent = ({ gmId }: { gmId: string }) => {
  const { t } = useTranslation()
  const { data: userNodesInfo, isLoading: isUserNodesLoading } = useGetUserNodes()
  const { data: userGMs, isLoading: isUserGMsLoading } = useGetUserGMs()
  const [selectedNode, setSelectedNode] = useState<UserNode | undefined>(undefined)

  const {
    open: isAttachGMToXNodeModalOpen,
    onOpen: onAttachGMToXNodeModalOpen,
    onClose: onAttachGMToXNodeModalClose,
  } = useDisclosure()

  const handleAttachClick = (node: UserNode) => {
    setSelectedNode(node)
    onAttachGMToXNodeModalOpen()
  }

  const {
    open: isDetachGMToXNodeModalOpen,
    onOpen: onDetachGMToXNodeModalOpen,
    onClose: onDetachGMToXNodeModalClose,
  } = useDisclosure()

  if (isUserNodesLoading || isUserGMsLoading) return <Spinner size={"lg"} />

  const gm = userGMs?.find(gm => gm.tokenId === gmId)
  if (!gm) return null

  const userNodes = userNodesInfo?.nodesManagedByUser ?? []
  const nodesAttachedToGMs = userNodes.filter(node => node.isGmAttached)
  const attachedNode = nodesAttachedToGMs.find(node => node.gmAttachedTokenId.toString() === gm.tokenId)

  const nodeIdsAttachedToOtherGMs = new Set(
    nodesAttachedToGMs.filter(node => node.gmAttachedTokenId.toString() !== gm.tokenId).map(node => node.id.toString()),
  )

  const sortedUserNodes = [...userNodes].sort((a, b) => {
    if (a.id.toString() === gm.nodeIdAttached?.toString()) return -1
    if (b.id.toString() === gm.nodeIdAttached?.toString()) return 1
    return 0
  })

  return (
    <VStack align="stretch" flex="1" gap="4">
      <GmNFTPageHeader gm={gm} />
      <Stack direction={["column", "column", "column", "row"]} gap="4" align={"stretch"}>
        <VStack flex={3} align="stretch" gap="4">
          <GmPoolAmountCard />
          {userNodes.length > 0 && (
            <Card.Root variant="primary" maxH={"fit-content"}>
              <Card.Header>
                <VStack align="stretch" gap={1}>
                  <Heading textStyle="lg">
                    {t("Your Nodes")} {`(${userNodes.length})`}
                  </Heading>
                  <Text textStyle="sm" color="text.subtle">
                    {t(
                      "Attach a node to your GM NFT to get a free level upgrade. Higher-tier nodes unlock higher GM levels.",
                    )}
                  </Text>
                </VStack>
              </Card.Header>
              <Card.Body>
                <VStack align={"stretch"} gap="3">
                  {sortedUserNodes.map((node: UserNode) => (
                    <NodeRow
                      key={node.id.toString()}
                      node={node}
                      currentGMLevel={gm.tokenLevel}
                      isAttachedToCurrentGM={attachedNode?.id === node.id}
                      isAttachedToOtherGM={nodeIdsAttachedToOtherGMs.has(node.id.toString())}
                      hasAttachedNode={!!attachedNode}
                      onAttach={() => handleAttachClick(node)}
                      onDetach={onDetachGMToXNodeModalOpen}
                    />
                  ))}
                </VStack>
              </Card.Body>
            </Card.Root>
          )}
        </VStack>
        <VStack flex={1.5} align={"stretch"}>
          <GalaxyLevelsCard />
        </VStack>
      </Stack>
      <DetachGMToXNodeModal
        gmId={gm.tokenId}
        gmLevel={gm.tokenLevel}
        xNodeId={gm.nodeIdAttached ?? ""}
        isOpen={isDetachGMToXNodeModalOpen}
        onClose={() => {
          onDetachGMToXNodeModalClose()
        }}
      />
      <AttachGMToXNodeModal
        gmId={gm.tokenId}
        node={selectedNode}
        isOpen={isAttachGMToXNodeModalOpen}
        onClose={() => {
          setSelectedNode(undefined)
          onAttachGMToXNodeModalClose()
        }}
      />
    </VStack>
  )
}
