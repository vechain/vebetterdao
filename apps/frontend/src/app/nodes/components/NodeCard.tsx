"use client"

import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  HStack,
  Image,
  Text,
  VStack,
  useDisclosure,
  Separator,
} from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import { useTranslation } from "react-i18next"
import { formatEther } from "viem"

import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"

import { EndorseAppsModal } from "./EndorseAppsModal"
import { EndorsementHistoryModal } from "./EndorsementHistoryModal"
import { NodeEndorsedApps } from "./NodeEndorsedApps"
import { NodeGMSection } from "./NodeGMSection"

const compactFormatter = getCompactFormatter(2)

const CardRoot = Card.Root
const CardBody = Card.Body

type NodeCardProps = {
  node: UserNode
}

const NodeHeader = ({ node }: { node: UserNode }) => {
  const { t } = useTranslation()
  return (
    <HStack gap={4} align="start" minW={0}>
      <Image src={node?.metadata?.image} alt={node?.metadata?.name ?? ""} w="16" h="16" rounded="lg" flexShrink={0} />
      <VStack align="start" gap={2} minW={0}>
        <Heading textStyle="xl" fontWeight="bold">
          {node?.metadata?.name ?? ""} {" #" + node?.id?.toString()}
        </Heading>
        <Text textStyle="sm" color="text.subtle">
          {node?.type}
          {" • "}
          {t("Cost")}
          {": "}
          {compactFormatter.format(Number(formatEther(node.vetAmountStaked)))}
          {" VET"}
          {node.currentUserIsManager && !node.currentUserIsOwner && (
            <>
              {" • "}
              {t("Managed")}
            </>
          )}
        </Text>
      </VStack>
    </HStack>
  )
}

const CompactNodeCard = ({ node }: NodeCardProps) => {
  const { t } = useTranslation()
  return (
    <CardRoot variant="primary" w="full" opacity={0.7}>
      <CardBody>
        <VStack align="stretch" gap={3}>
          <NodeHeader node={node} />
          <Text textStyle="sm" color="text.subtle">
            {t(
              "This node level does not provide endorsement power or GM NFT benefits. Upgrade to at least a Strength node to unlock these features.",
            )}
          </Text>
          <NodeGMSection node={node} />
        </VStack>
      </CardBody>
    </CardRoot>
  )
}

export const NodeCard = ({ node }: NodeCardProps) => {
  const { t } = useTranslation()
  const historyModal = useDisclosure()
  const endorseModal = useDisclosure()

  const hasEndorsementPower = node.endorsementScore > 0n

  if (!hasEndorsementPower) return <CompactNodeCard node={node} />

  const usedPoints = node.activeEndorsements.reduce((sum, e) => sum + e.points, 0n)
  const totalPoints = Number(node.endorsementScore)
  const usedPercent = totalPoints > 0 ? (Number(usedPoints) / totalPoints) * 100 : 0

  return (
    <CardRoot variant="primary" w="full">
      <CardBody>
        <VStack align="stretch" gap={4}>
          <Flex
            direction={{ base: "column", md: "row" }}
            gap={4}
            align={{ base: "stretch", md: "flex-end" }}
            justify={{ md: "space-between" }}
            w="full">
            <NodeHeader node={node} />
            <VStack gap={2} align={{ base: "stretch", md: "end" }} minW={{ md: "240px" }}>
              <HStack w="full" justify="space-between" textStyle="sm" fontWeight="semibold" flexWrap="wrap" gap={2}>
                <HStack gap={1}>
                  <Text color="text.subtle">
                    {t("Used")}
                    {": "}
                  </Text>
                  <Text>
                    {usedPoints.toString()} {t("pts")}
                  </Text>
                </HStack>
                <HStack gap={1}>
                  <Text color="text.subtle">
                    {t("Available")}
                    {": "}
                  </Text>
                  <Text>
                    {node.availablePoints.toString()} {t("pts")}
                  </Text>
                </HStack>
              </HStack>
              <Flex
                w="full"
                h="2"
                borderRadius="full"
                overflow="hidden"
                bg="bg.muted"
                borderWidth="1px"
                borderColor="border.primary">
                {usedPercent > 0 && <Box w={`${usedPercent}%`} h="full" bg="status.positive.primary" flexShrink={0} />}
              </Flex>
            </VStack>
          </Flex>

          <NodeGMSection node={node} />

          <Separator w="full" mt={4} />

          <NodeEndorsedApps node={node} />

          {node.activeEndorsements.length > 0 && (
            <HStack justify="space-between" w="full" pt={2}>
              <Button variant="link" size="sm" onClick={historyModal.onOpen}>
                {t("View history")}
              </Button>
              <Button size="sm" variant="primary" onClick={endorseModal.onOpen} disabled={node.availablePoints === 0n}>
                {t("Endorse")}
              </Button>
            </HStack>
          )}
        </VStack>
      </CardBody>
      <EndorsementHistoryModal node={node} isOpen={historyModal.open} onClose={historyModal.onClose} />
      <EndorseAppsModal isOpen={endorseModal.open} onClose={endorseModal.onClose} node={node} />
    </CardRoot>
  )
}
