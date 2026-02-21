import { Box, Button, Card, HStack, Stack, Tag, VStack, Text, Heading, useDisclosure, Spinner } from "@chakra-ui/react"
import NextLink from "next/link"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"
import { xNodeToGMstartingLevel } from "@/constants/gmNfts"

import { useGetUserGMs, UserGM } from "../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useGetUserNodes, UserNode } from "../../../../api/contracts/xNodes/useGetUserNodes"

import { GalaxyLevelsCard } from "./components/GalaxyLevelsCard"
import { GmNFTPageHeader } from "./components/GmNFTPageHeader"
import { GmPoolAmountCard } from "./components/GmPoolAmountCard"
import { GmUpgradesActivityList } from "./components/GmUpgradesActivityList"
import { NodeRow } from "./components/NodeRow"

const getActiveGM = (userGMs: UserGM[] | undefined): UserGM | undefined =>
  userGMs?.find(g => g.isSelected) ?? userGMs?.[0]

export const GmNFTPageContent = () => {
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

  if (isUserNodesLoading || isUserGMsLoading)
    return (
      <VStack align="center" justify="center" flex="1">
        <Spinner size={"lg"} />
      </VStack>
    )

  const gm = getActiveGM(userGMs)
  if (!gm) return null

  const userNodes = userNodesInfo?.nodesManagedByUser ?? []
  const nodesAttachedToGMs = userNodes.filter(node => node.isGmAttached)
  const attachedNode = nodesAttachedToGMs.find(node => node.gmAttachedTokenId.toString() === gm.tokenId)

  const nodeIdsAttachedToOtherGMs = new Set(
    nodesAttachedToGMs.filter(node => node.gmAttachedTokenId.toString() !== gm.tokenId).map(node => node.id.toString()),
  )

  const currentLevelNum = Number(gm.tokenLevel)

  const actionableNodes = userNodes
    .filter(node => {
      if (attachedNode?.id === node.id) return true
      if (nodeIdsAttachedToOtherGMs.has(node.id.toString())) return false
      const freeLevel = xNodeToGMstartingLevel[node.levelId] ?? 0
      return freeLevel > currentLevelNum
    })
    .sort((a, b) => {
      if (a.id.toString() === gm.nodeIdAttached?.toString()) return -1
      if (b.id.toString() === gm.nodeIdAttached?.toString()) return 1
      const aLevel = xNodeToGMstartingLevel[a.levelId] ?? 0
      const bLevel = xNodeToGMstartingLevel[b.levelId] ?? 0
      return bLevel - aLevel
    })

  const hasMoreNodes = userNodes.length > actionableNodes.length

  return (
    <VStack align="stretch" flex="1" gap="4">
      <GmNFTPageHeader gm={gm} />
      <Stack direction={["column", "column", "column", "row"]} gap="4" align="stretch">
        <VStack flex={{ base: "none", md: 3 }} align="stretch" gap="4" minW="0">
          <GmPoolAmountCard />

          <GmUpgradesActivityList />
        </VStack>
        <VStack flex={{ base: "none", md: 1.5 }} align="stretch" gap="4" minW="0">
          <Card.Root variant="primary" maxH={"fit-content"}>
            <Card.Header>
              <HStack justify="space-between" align="start">
                <VStack align="stretch" gap={1} flex={1}>
                  <HStack gap={2}>
                    <Heading textStyle="lg">{t("Node upgrades")}</Heading>
                    <Tag.Root size="sm" variant="subtle">
                      <Tag.Label>
                        {actionableNodes.length} {actionableNodes.length === 1 ? t("node") : t("nodes")}
                      </Tag.Label>
                    </Tag.Root>
                  </HStack>
                  <Text textStyle="sm" color="text.subtle">
                    {t(
                      "Attach a node to your GM NFT to get a free level upgrade. Higher-tier nodes unlock higher GM levels.",
                    )}
                  </Text>
                </VStack>
                {hasMoreNodes && (
                  <Box hideBelow="md">
                    <Button variant="ghost" size="sm" asChild>
                      <NextLink href="/nodes">{t("View all nodes")}</NextLink>
                    </Button>
                  </Box>
                )}
              </HStack>
            </Card.Header>
            <Card.Body>
              {actionableNodes.length > 0 ? (
                <VStack align={"stretch"} gap="3">
                  {actionableNodes.map((node: UserNode) => (
                    <NodeRow
                      key={node.id.toString()}
                      node={node}
                      gmId={gm.tokenId}
                      currentGMLevel={gm.tokenLevel}
                      isAttachedToCurrentGM={attachedNode?.id === node.id}
                      isAttachedToOtherGM={nodeIdsAttachedToOtherGMs.has(node.id.toString())}
                      hasAttachedNode={!!attachedNode}
                      onAttach={() => handleAttachClick(node)}
                      onDetach={onDetachGMToXNodeModalOpen}
                    />
                  ))}
                </VStack>
              ) : (
                <Text textStyle="sm" color="text.subtle">
                  {t("None of your nodes can upgrade this GM NFT further.")}
                </Text>
              )}
              {hasMoreNodes && (
                <Box hideFrom="md">
                  <Button variant="ghost" size="sm" asChild width="full">
                    <NextLink href="/nodes">{t("View all nodes")}</NextLink>
                  </Button>
                </Box>
              )}
            </Card.Body>
          </Card.Root>
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
