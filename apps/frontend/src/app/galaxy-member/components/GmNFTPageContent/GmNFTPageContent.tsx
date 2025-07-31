import {
  Card,
  Stack,
  VStack,
  Image,
  Text,
  Box,
  Heading,
  Button,
  useDisclosure,
  Spinner,
  useMediaQuery,
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
        {userNodes?.allNodes?.length && userNodes?.allNodes?.length > 0 && (
          <Card.Root flex={3} variant="outline" p={isAbove800 ? "1.25rem" : "0.5rem"} maxH={"fit-content"}>
            <Card.Header p="1.25rem" pb="0">
              <Heading fontSize="lg" lineHeight={1}>
                {t("Nodes")} {`(${userNodes?.allNodes?.length})`}
              </Heading>
            </Card.Header>
            <Card.Body p={isAbove800 ? "1.25rem" : "0.5rem"}>
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
                      variant="outline"
                      alignItems="center"
                      direction="row"
                      gap="8px"
                      p="16px"
                      rounded="8px">
                      <Card.Header p="0">
                        <Image
                          src={node?.image}
                          // fallbackSrc="/assets/icons/not-found-image-fallback.svg"
                          alt={node?.name}
                          boxSize="62px"
                          rounded="8px"
                        />
                      </Card.Header>

                      <Card.Body p="0" gap="8px">
                        <Text fontSize="sm" lineHeight={1} _dark={{ color: "#FFFFFFB2" }}>
                          {t("Node")}
                        </Text>
                        <Text
                          fontSize={isAbove800 ? "sm" : "xs"}
                          fontWeight={700}
                          lineHeight={isAbove800 ? 1.6 : 1.2}
                          lineClamp={isAbove800 ? 1 : undefined}>
                          {`${node.name} #${node.nodeId}`}
                        </Text>
                        <Box display="inline-block" p="4px 8px" rounded="8px" bg="#F2F2F269">
                          <Text fontSize="xs" _dark={{ color: "#FFFFFFB2" }}>
                            {t("{{value}} points", { value: node.xNodePoints })}
                          </Text>
                        </Box>
                      </Card.Body>

                      <Card.Footer p="0">
                        {attachedNode?.nodeId === node.nodeId ? (
                          <Button
                            variant="dangerFilledTonal"
                            size={isAbove800 ? "sm" : "xs"}
                            onClick={onDetachGMToXNodeModalOpen}>
                            {t("Detach")}
                          </Button>
                        ) : nodesAttachedToGMs?.[node.nodeId] ? (
                          <Tooltip content={t("This node is already attached to another GM")}>
                            <span>
                              <Button
                                disabled={!!nodesAttachedToGMs?.[node.nodeId]}
                                variant="whiteAction"
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
                                variant="whiteAction"
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
