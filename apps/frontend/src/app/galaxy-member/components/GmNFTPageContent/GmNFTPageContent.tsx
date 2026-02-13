import {
  Card,
  Stack,
  VStack,
  Text,
  Heading,
  Button,
  useDisclosure,
  Spinner,
  useMediaQuery,
  Avatar,
  Badge,
} from "@chakra-ui/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"
import { Tooltip } from "@/components/ui/tooltip"

import { useGetUserGMs } from "../../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { useGetUserNodes, UserNode } from "../../../../api/contracts/xNodes/useGetUserNodes"

import { GalaxyLevelsCard } from "./components/GalaxyLevelsCard"
import { GmNFTPageHeader } from "./components/GmNFTPageHeader"
import { GmPoolAmountCard } from "./components/GmPoolAmountCard"

export const GmNFTPageContent = ({ gmId }: { gmId: string }) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery(["(min-width: 800px)"])
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

  //Convert to set to be more efficient searching
  const nodeIdsAttachedToOtherGMs = new Set(
    nodesAttachedToGMs.filter(node => node.gmAttachedTokenId.toString() !== gm.tokenId).map(node => node.id.toString()),
  )

  //Put nodes with attachment first
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
          {userNodes.length > 0 && (
            <Card.Root variant="primary" maxH={"fit-content"}>
              <Card.Header>
                <Heading textStyle="lg">
                  {t("Nodes")} {`(${userNodes.length})`}
                </Heading>
              </Card.Header>
              <Card.Body>
                <VStack align={"stretch"} gap="4">
                  {sortedUserNodes.map((node: UserNode) => {
                    const isNodeAttachedToCurrentGM = attachedNode?.id === node.id
                    const isNodeAttachedToOtherGM = nodeIdsAttachedToOtherGMs.has(node.id.toString())

                    return (
                      <Card.Root
                        key={node.id}
                        variant="subtle"
                        _hover={{ bg: "card.subtle" }}
                        alignItems="center"
                        flexDirection="row"
                        gap="8px"
                        p="4"
                        rounded="8px">
                        <Card.Header p="0">
                          <Avatar.Root shape="rounded" boxSize="16" borderRadius="0.75rem">
                            <Avatar.Image
                              boxSize="16"
                              src={node?.metadata?.image ?? ""}
                              alt={node?.metadata?.name}
                              borderRadius="0.75rem"
                              objectFit="contain"
                            />
                            <Avatar.Fallback name={node?.metadata?.name ?? ""} />
                          </Avatar.Root>
                        </Card.Header>

                        <Card.Body gap="0">
                          <Text textStyle="sm" color="text.subtle">
                            {t("Node")}
                          </Text>
                          <Text
                            textStyle={isAbove800 ? "sm" : "xs"}
                            lineHeight={isAbove800 ? 1.6 : 1.2}
                            lineClamp={isAbove800 ? 1 : undefined}>
                            {`${node?.metadata?.name} #${node.id}`}
                          </Text>
                          <Badge w="fit-content" mt="1">
                            <Text textStyle="xs" fontWeight="semibold" color="text.subtle">
                              {t("{{value}} points", { value: node.endorsementScore.toString() })}
                            </Text>
                          </Badge>
                        </Card.Body>

                        <Card.Footer p="0">
                          {isNodeAttachedToCurrentGM ? (
                            <Button
                              colorPalette="red"
                              size={isAbove800 ? "sm" : "xs"}
                              onClick={onDetachGMToXNodeModalOpen}>
                              {t("Detach")}
                            </Button>
                          ) : isNodeAttachedToOtherGM ? (
                            <Tooltip content={t("This node is already attached to another GM")}>
                              <span>
                                <Button
                                  disabled={true}
                                  variant="secondary"
                                  size={isAbove800 ? "sm" : "xs"}
                                  onClick={() => handleAttachClick(node)}>
                                  {t("Attached")}
                                </Button>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip disabled={!attachedNode} content={t("Only one node can be attached to a GM")}>
                              <span>
                                <Button
                                  disabled={!!attachedNode}
                                  variant="secondary"
                                  size={isAbove800 ? "sm" : "xs"}
                                  onClick={() => handleAttachClick(node)}>
                                  {t("Attach")}
                                </Button>
                              </span>
                            </Tooltip>
                          )}
                        </Card.Footer>
                      </Card.Root>
                    )
                  })}
                </VStack>
              </Card.Body>
            </Card.Root>
          )}
        </VStack>
        <VStack flex={1.5} align={"stretch"}>
          <GmPoolAmountCard />
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
