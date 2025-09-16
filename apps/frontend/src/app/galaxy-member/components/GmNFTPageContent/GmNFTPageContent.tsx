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
import { GmNFTPageHeader } from "./components/GmNFTPageHeader"
import { GalaxyLevelsCard } from "./components/GalaxyLevelsCard"
import { GalaxyRewardCalculatorCard } from "./components/GalaxyRewardCalculatorCard"
import { GmPoolAmountCard } from "./components/GmPoolAmountCard"
import { UserNode, useGetUserGMs, useGetUserNodes } from "@/api"
import { useTranslation } from "react-i18next"
import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { useState } from "react"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"
import { Tooltip } from "@/components/ui/tooltip"

export const GmNFTPageContent = ({ gmId }: { gmId: string }) => {
  const { t } = useTranslation()
  const [isAbove800] = useMediaQuery(["(min-width: 800px)"])
  const { data: userNodes, isLoading: isUserNodesLoading } = useGetUserNodes()
  const { data: userGMs, isLoading: isUserGMsLoading } = useGetUserGMs()
  const gm = userGMs?.find(gm => gm.tokenId === gmId)
  const [selectedNode, setSelectedNode] = useState<UserNode | undefined>(undefined)

  const nodesAttachedToGMs = userGMs?.reduce(
    (acc, gm) => {
      if (gm.nodeIdAttached) {
        acc[gm.nodeIdAttached] = gm.nodeIdAttached
      }
      return acc
    },
    {} as Record<string, string>,
  )

  const attachedNode = userNodes?.allNodes?.find(node => node.nodeId === gm?.nodeIdAttached)

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
        {!!userNodes?.allNodes?.length && userNodes?.allNodes?.length > 0 && (
          <Card.Root flex={3} variant="primary" maxH={"fit-content"}>
            <Card.Header>
              <Heading textStyle="lg">
                {t("Nodes")} {`(${userNodes?.allNodes?.length})`}
              </Heading>
            </Card.Header>
            <Card.Body>
              <VStack align={"stretch"} gap="4">
                {userNodes?.allNodes
                  ?.sort((a, b) => {
                    // Sort so that attached node appears first
                    if (a.nodeId === gm.nodeIdAttached) return -1
                    if (b.nodeId === gm.nodeIdAttached) return 1
                    return 0
                  })
                  ?.map(node => (
                    <Card.Root
                      key={node.nodeId}
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
                            src={node?.image}
                            alt={node?.name}
                            borderRadius="0.75rem"
                            objectFit="contain"
                          />
                          <Avatar.Fallback name={node?.name} />
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
                          {`${node.name} #${node.nodeId}`}
                        </Text>
                        <Badge w="fit-content" mt="1">
                          <Text textStyle="xs" fontWeight="semibold" _dark={{ color: "#FFFFFFB2" }}>
                            {t("{{value}} points", { value: node.xNodePoints })}
                          </Text>
                        </Badge>
                      </Card.Body>

                      <Card.Footer p="0">
                        {attachedNode?.nodeId === node.nodeId ? (
                          <Button
                            colorPalette="red"
                            size={isAbove800 ? "sm" : "xs"}
                            onClick={onDetachGMToXNodeModalOpen}>
                            {t("Detach")}
                          </Button>
                        ) : nodesAttachedToGMs?.[node.nodeId] ? (
                          <Tooltip content={t("This node is already attached to another GM")}>
                            <span>
                              <Button
                                disabled={!!nodesAttachedToGMs?.[node.nodeId]}
                                variant="secondary"
                                size={isAbove800 ? "sm" : "xs"}
                                onClick={() => {
                                  setSelectedNode(node)
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
                                  setSelectedNode(node)
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
