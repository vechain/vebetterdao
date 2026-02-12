"use client"

import { Button, Card, HStack, Text, VStack, useDisclosure } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { TbPaperclip } from "react-icons/tb"

import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"

import { useGetUserGMs, UserGM } from "../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"
import { GMNFTCard } from "../../../components/GMNFTCard"

type NodeGMSectionProps = {
  node: UserNode
}

export const NodeGMSection = ({ node }: NodeGMSectionProps) => {
  const { t } = useTranslation()
  const { data: userGms } = useGetUserGMs()
  const attachModal = useDisclosure()
  const detachModal = useDisclosure()

  const isAttached = node?.isGmAttached
  const attachedGM = userGms?.find((gm: UserGM) => gm.tokenId === node?.gmAttachedTokenId?.toString())
  const isNodeDelegator = !node?.currentUserIsManager && node?.currentUserIsOwner
  const availableGMs = (userGms ?? []).filter(
    (gm: UserGM) => !gm.nodeIdAttached || gm.nodeIdAttached === node.id.toString(),
  )

  return (
    <Card.Root variant="outline" w="full" cursor="default">
      <Card.Body>
        <VStack align="stretch" gap={3}>
          <Text textStyle="sm" color="text.subtle">
            {(t as (k: string) => string)("NFTs provide reward multipliers. You can attach one GM NFT to this node.")}
          </Text>
          {isAttached && attachedGM ? (
            <HStack gap={4} align="start">
              <GMNFTCard
                imageUrl={attachedGM.metadata?.image}
                name={attachedGM.metadata?.name}
                tokenLevel={Number(attachedGM.tokenLevel)}
                multiplier={attachedGM.multiplier}
                size="medium">
                <HStack>
                  <Button asChild size="sm" variant="outline">
                    <NextLink href={`/galaxy-member/${attachedGM.tokenId}`}>
                      <HStack gap={1} as="span">
                        <TbPaperclip /> {(t as (k: string) => string)("View GM")}
                      </HStack>
                    </NextLink>
                  </Button>
                  {!isNodeDelegator && (
                    <Button
                      size="sm"
                      colorPalette="red"
                      variant="ghost"
                      onClick={e => {
                        e.stopPropagation()
                        detachModal.onOpen()
                      }}>
                      {t("Detach")}
                    </Button>
                  )}
                </HStack>
              </GMNFTCard>
            </HStack>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={attachModal.onOpen}
              disabled={isNodeDelegator || availableGMs.length === 0}>
              <TbPaperclip /> {(t as (k: string) => string)("Attach")}
            </Button>
          )}
        </VStack>
      </Card.Body>
      {attachedGM && (
        <>
          <AttachGMToXNodeModal
            gmId={attachedGM.tokenId}
            node={node}
            isOpen={attachModal.open}
            onClose={attachModal.onClose}
          />
          <DetachGMToXNodeModal
            gmId={attachedGM.tokenId}
            gmLevel={attachedGM.tokenLevel}
            xNodeId={node.id.toString()}
            isOpen={detachModal.open}
            onClose={detachModal.onClose}
          />
        </>
      )}
      {!attachedGM && attachModal.open && availableGMs[0] && (
        <AttachGMToXNodeModal
          gmId={availableGMs[0].tokenId}
          node={node}
          isOpen={attachModal.open}
          onClose={attachModal.onClose}
        />
      )}
    </Card.Root>
  )
}
