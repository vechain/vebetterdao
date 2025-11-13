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
import { GalaxyRewardCalculatorCard } from "./components/GalaxyRewardCalculatorCard"
import { GmNFTPageHeader } from "./components/GmNFTPageHeader"
import { GmPoolAmountCard } from "./components/GmPoolAmountCard"

export const GmNFTPageContent = ({ gmId }: { gmId: string }) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery(["(min-width: 800px)"])
  const { data: userNodesInfo, isLoading: isUserNodesLoading } = useGetUserNodes()
  const { data: userGMs, isLoading: isUserGMsLoading } = useGetUserGMs()
  const gm = userGMs?.find(gm => gm.tokenId === gmId)
  const [selectedNode, setSelectedNode] = useState(undefined)

  const nodesAttachedToGMs = userGMs?.reduce(
    (acc, gm) => {
      if (gm.nodeIdAttached) {
        acc[gm.nodeIdAttached] = gm.nodeIdAttached
      }
      return acc
    },
    {} as Record<string, string>,
  )

  const attachedNode = userNodesInfo?.nodesManagedByUser?.find(
    node => node.id.toString() === gm?.nodeIdAttached?.toString(),
  )

  const {
    open: isAttachGMToXNodeModalOpen,
    onOpen: onAttachGMToXNodeModalOpen,
    onClose: onAttachGMToXNodeModalClose,
  } = useDisclosure()

  const {
    open: isDetachGMToXNodeModalOpen,
    onOpen: onDetachGMToXNodeModalOpen,
    onClose: onDetachGMToXNodeModalClose,
  } = useDisclosure()

  if (isUserNodesLoading || isUserGMsLoading) return <Spinner size={"lg"} />

  if (!gm) return null

  return (
    <VStack align="stretch" flex="1" gap="4">
      <GmNFTPageHeader gm={gm} />
      <Stack direction={["column", "column", "column", "row"]} gap="4" align={"stretch"}>
        {!!userNodesInfo?.nodesManagedByUser?.length && userNodesInfo?.nodesManagedByUser?.length > 0 && (
          <Card.Root flex={3} variant="primary" maxH={"fit-content"}>
            <Card.Header>
              <Heading textStyle="lg">
                {t("Nodes")} {`(${userNodesInfo?.nodesManagedByUser?.length})`}
              </Heading>
            </Card.Header>
            <Card.Body>
              <VStack align={"stretch"} gap="4">
                {userNodesInfo?.nodesManagedByUser
                  ?.sort((a, b) => {
                    // Sort so that attached node appears first
                    if (a.id.toString() === gm.nodeIdAttached?.toString()) return -1
                    if (b.id.toString() === gm.nodeIdAttached?.toString()) return 1
                    return 0
                  })
                  ?.map((node: UserNode) => (
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
                        <Text textStyle="sm" _dark={{ color: "#FFFFFFB2" }}>
                          {t("Node")}
                        </Text>
                        <Text
                          textStyle={isAbove800 ? "sm" : "xs"}
                          lineHeight={isAbove800 ? 1.6 : 1.2}
                          lineClamp={isAbove800 ? 1 : undefined}>
                          {`${node?.metadata?.name} #${node.id}`}
                        </Text>
                        <Badge w="fit-content" mt="1">
                          <Text textStyle="xs" fontWeight="semibold" _dark={{ color: "#FFFFFFB2" }}>
                            {t("{{value}} points", { value: node.endorsementScore.toString() })}
                          </Text>
                        </Badge>
                      </Card.Body>

                      <Card.Footer p="0">
                        {attachedNode?.id === node.id ? (
                          <Button
                            colorPalette="red"
                            size={isAbove800 ? "sm" : "xs"}
                            onClick={onDetachGMToXNodeModalOpen}>
                            {t("Detach")}
                          </Button>
                        ) : nodesAttachedToGMs?.[node.id.toString()] ? (
                          <Tooltip content={t("This node is already attached to another GM")}>
                            <span>
                              <Button
                                disabled={!!nodesAttachedToGMs?.[node.id.toString()]}
                                variant="secondary"
                                size={isAbove800 ? "sm" : "xs"}
                                onClick={() => {
                                  // setSelectedNode(node)
                                  onAttachGMToXNodeModalOpen()
                                }}>
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
                                onClick={() => {
                                  // setSelectedNode(node)
                                  onAttachGMToXNodeModalOpen()
                                }}>
                                {t("Attach")}
                              </Button>
                            </span>
                          </Tooltip>
                        )}
                      </Card.Footer>
                    </Card.Root>
                  ))}
              </VStack>
            </Card.Body>
          </Card.Root>
        )}
        <VStack flex={1.5} align={"stretch"}>
          <GalaxyRewardCalculatorCard />
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
