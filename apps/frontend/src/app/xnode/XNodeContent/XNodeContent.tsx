import { Button, Card, HStack, Spinner, VStack, useDisclosure } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { useNodeById } from "@/api/contracts/xNodes/useNodeById"
import { NodeEndorsedApps } from "@/app/nodes/components/NodeEndorsedApps"
import { NodeGMSection } from "@/app/nodes/components/NodeGMSection"

import { EndorsementHistoryModal } from "../../nodes/components/EndorsementHistoryModal"

import { ConnectWithCreators } from "./components/ConnectWithCreators/ConnectWithCreators"
import { XNodePageHeader } from "./components/XNodePageHeader"

type Props = {
  xNodeId: string
}
export const XNodeContent = ({ xNodeId }: Props) => {
  const { t } = useTranslation()
  const { data: node, isLoading } = useNodeById(xNodeId)
  const historyModal = useDisclosure()

  const isOwnerOrManager = node?.currentUserIsManager || node?.currentUserIsOwner
  const readOnly = !isOwnerOrManager

  if (isLoading) {
    return (
      <VStack w="full" h="60vh" justify="center">
        <Spinner size="lg" />
      </VStack>
    )
  }

  if (!node) return null

  const hasEndorsements = node.activeEndorsements.length > 0

  return (
    <VStack align="stretch" flex="1" gap="4">
      <XNodePageHeader node={node} />
      <Card.Root variant="primary" w="full">
        <Card.Body>
          <VStack align="stretch" gap={4}>
            <NodeEndorsedApps node={node} readOnly={readOnly} />
            {!readOnly && <NodeGMSection node={node} />}
            {hasEndorsements && (
              <HStack justify="start" w="full" pt={2}>
                <Button variant="link" size="sm" onClick={historyModal.onOpen}>
                  {t("View history")}
                </Button>
              </HStack>
            )}
          </VStack>
        </Card.Body>
      </Card.Root>
      {!readOnly && <ConnectWithCreators />}
      <EndorsementHistoryModal node={node} isOpen={historyModal.open} onClose={historyModal.onClose} />
    </VStack>
  )
}
