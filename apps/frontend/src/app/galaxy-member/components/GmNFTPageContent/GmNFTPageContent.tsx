import {
  Card,
  CardHeader,
  CardBody,
  Stack,
  VStack,
  Image,
  Text,
  Box,
  Heading,
  CardFooter,
  Button,
  useDisclosure,
  Spinner,
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
import { BaseTooltip } from "@/components"

export const GmNFTPageContent = ({ gmId }: { gmId: string }) => {
  const { t } = useTranslation()
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
    isOpen: isAttachGMToXNodeModalOpen,
    onOpen: onAttachGMToXNodeModalOpen,
    onClose: onAttachGMToXNodeModalClose,
  } = useDisclosure()

  const {
    isOpen: isDetachGMToXNodeModalOpen,
    onOpen: onDetachGMToXNodeModalOpen,
    onClose: onDetachGMToXNodeModalClose,
  } = useDisclosure()

  if (isUserNodesLoading || isUserGMsLoading) return <Spinner size={"lg"} />

  if (!gm) return null

  return (
    <VStack align="stretch" flex="1" gap="4">
      <GmNFTPageHeader gm={gm} />
      <Stack direction={["column", "column", "column", "row"]} spacing="4" align={"stretch"}>
        {userNodes?.allNodes?.length && userNodes?.allNodes?.length > 0 && (
          <Card flex={3} variant="outline">
            <CardHeader p="1.25rem" pb="0">
              <Heading fontSize="lg" lineHeight={1}>
                {t("Nodes")} {`(${userNodes?.allNodes?.length})`}
              </Heading>
            </CardHeader>
            <CardBody p="1.25rem">
              <VStack align={"stretch"} gap="4">
                {userNodes?.allNodes
                  ?.sort((a, b) => {
                    // Sort so that attached node appears first
                    if (a.nodeId === gm.nodeIdAttached) return -1
                    if (b.nodeId === gm.nodeIdAttached) return 1
                    return 0
                  })
                  ?.map(node => (
                    <Card
                      key={node.nodeId}
                      variant="outline"
                      alignItems="center"
                      direction="row"
                      gap="8px"
                      p="16px"
                      rounded="8px">
                      <CardHeader p="0">
                        <Image
                          src={node?.image}
                          fallbackSrc="/assets/icons/not-found-image-fallback.svg"
                          alt={node?.name}
                          boxSize="62px"
                          rounded="8px"
                        />
                      </CardHeader>

                      <CardBody p="0" gap="8px">
                        <Text fontSize="sm" lineHeight={1} color="#FFFFFFB2">
                          {t("Node")}
                        </Text>
                        <Text fontWeight={700} lineHeight={1.6} noOfLines={1}>
                          {`${node.name} #${node.nodeId}`}
                        </Text>
                        <Box display="inline-block" p="4px 8px" rounded="8px" bg="#F2F2F269">
                          <Text fontSize="xs" _dark={{ color: "#FFFFFFB2" }}>
                            {t("{{value}} points", { value: node.xNodePoints })}
                          </Text>
                        </Box>
                      </CardBody>

                      <CardFooter>
                        {attachedNode?.nodeId === node.nodeId ? (
                          <Button variant="dangerFilledTonal" size="sm" onClick={onDetachGMToXNodeModalOpen}>
                            {t("Detach")}
                          </Button>
                        ) : nodesAttachedToGMs?.[node.nodeId] ? (
                          <BaseTooltip text={t("This node is already attached to another GM")}>
                            <span>
                              <Button
                                disabled={!!nodesAttachedToGMs?.[node.nodeId]}
                                variant="whiteAction"
                                size="sm"
                                onClick={() => {
                                  setSelectedNode(node)
                                  onAttachGMToXNodeModalOpen()
                                }}>
                                {t("Attached")}
                              </Button>
                            </span>
                          </BaseTooltip>
                        ) : (
                          <Button
                            disabled={!!attachedNode}
                            variant="whiteAction"
                            size="sm"
                            onClick={() => {
                              setSelectedNode(node)
                              onAttachGMToXNodeModalOpen()
                            }}>
                            {t("Attach")}
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
              </VStack>
            </CardBody>
          </Card>
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
