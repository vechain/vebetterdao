import { BaseModal } from "@/components/BaseModal"
import { VStack, Heading, Text, Button, UseDisclosureProps, Box, HStack, Image } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"
import { useNodesEndorsementScore, useXNode } from "@/api"
import { allNodeStrengthLevelToName, NodeStrengthLevelToImage } from "@/constants/XNode"
import { humanAddress } from "@repo/utils/FormattingUtils"

type Props = {
  modal: UseDisclosureProps
}

export const MultipleXNodesInfoModal = ({ modal }: Props) => {
  const { t } = useTranslation()
  const { allNodes } = useXNode()
  const nodeLevelToEndorsementScore = useNodesEndorsementScore()

  return (
    <BaseModal isOpen={modal.isOpen ?? false} onClose={modal.onClose ?? (() => {})}>
      <VStack align="stretch" gap={6}>
        <Heading fontSize="2xl">{t("Your Nodes")}</Heading>
        <Text>
          {t(
            "You currently have multiple Nodes under your control. We recommend keeping only one Node per account for optimal functionality.",
          )}
        </Text>
        <VStack align="stretch" gap={4}>
          {allNodes.map(node => (
            <Box
              key={`node-info-${node.nodeId}`}
              p={4}
              bg="#FAFAFA"
              borderRadius="xl"
              backgroundImage={"/assets/backgrounds/xnode-page-background.webp"}>
              <HStack align="stretch" gap={6}>
                <Image
                  src={NodeStrengthLevelToImage[Number(node.nodeLevel)] as string}
                  w="68px"
                  h="68px"
                  rounded="8px"
                  alt={node.nodeId}
                />
                <VStack flex="1" align="flex-start" justify="center" spacing={2}>
                  <Text fontWeight={700} fontSize="md" color="#fff">
                    {allNodeStrengthLevelToName[Number(node.nodeLevel)] as string}
                  </Text>
                  <HStack spacing={2}>
                    {!node.isXNodeDelegated && (
                      <Box bg="#FFFFFF4A" color="#fff" rounded="8px" padding="4px 8px">
                        <Text fontSize="xs">{t("Owned")}</Text>
                      </Box>
                    )}
                    {node.isXNodeDelegated && (
                      <Box bg="#FFFFFF4A" color="#fff" rounded="8px" padding="4px 8px">
                        {node.isXNodeDelegator && (
                          <Text fontSize="xs" fontWeight={400}>
                            {t("Managed by")} {humanAddress(node.delegatee, 4, 4)}
                          </Text>
                        )}

                        {node.isXNodeDelegatee && (
                          <Text fontSize="xs" fontWeight={400}>
                            {t("Managing for")} {humanAddress(node.xNodeOwner, 4, 4)}
                          </Text>
                        )}
                      </Box>
                    )}
                    <Box bg="#FFFFFF4A" color="#fff" rounded="8px" padding="4px 8px">
                      <HStack spacing={1}>
                        <Text fontSize="xs" fontWeight={600}>
                          {Number(nodeLevelToEndorsementScore?.data?.[node.nodeLevel ?? 0] ?? 0)}
                        </Text>
                        <Text fontSize="xs" fontWeight={400}>
                          {t("points to endorse")}
                        </Text>
                      </HStack>
                    </Box>
                  </HStack>
                </VStack>
              </HStack>
            </Box>
          ))}
        </VStack>
        <Button variant="primaryGhost" onClick={modal.onClose}>
          {t("Close")}
        </Button>
      </VStack>
    </BaseModal>
  )
}
