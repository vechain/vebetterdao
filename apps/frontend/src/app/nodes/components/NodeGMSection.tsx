"use client"

import {
  Button,
  HStack,
  Heading,
  Image,
  LinkBox,
  LinkOverlay,
  Separator,
  Text,
  VStack,
  useDisclosure,
} from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"
import { TbPaperclip } from "react-icons/tb"

import { AttachGMToXNodeModal } from "@/app/apps/components/AttachGMToXNodeModal"
import { DetachGMToXNodeModal } from "@/app/apps/components/DetachGMToXNodeModal"

import { useGetUserGMs, UserGM } from "../../../api/contracts/galaxyMember/hooks/useGetUserGMs"
import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"

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
    (gm: UserGM) => !gm.nodeIdAttached || gm.nodeIdAttached === "0" || gm.nodeIdAttached === node.id.toString(),
  )

  const gmAttachedToOtherNode = !isAttached && availableGMs.length === 0 && (userGms ?? []).length > 0

  if (gmAttachedToOtherNode) return null

  return (
    <>
      <Separator w="full" mt={4} />
      <Heading textStyle="lg">{t("Attached Galaxy Member NFTs")}</Heading>

      <VStack align="stretch" gap={3}>
        {isAttached && attachedGM ? (
          <HStack bg="bg.subtle" p={4} rounded="xl" gap={3} w="full" align="center">
            <LinkBox flexShrink={0}>
              <LinkOverlay asChild>
                <NextLink href={`/galaxy-member/${attachedGM.tokenId}`} />
              </LinkOverlay>
              <Image
                src={attachedGM.metadata?.image}
                alt={attachedGM.metadata?.name ?? ""}
                w="11"
                h="11"
                rounded="lg"
                cursor="pointer"
              />
            </LinkBox>
            <VStack align="start" gap={0} flex={1} minW={0}>
              <Text textStyle="md" fontWeight="semibold" lineClamp={1}>
                {attachedGM.metadata?.name}
              </Text>
              {attachedGM.multiplier && (
                <Text textStyle="sm" color="text.subtle">
                  {attachedGM.multiplier}
                  {"x"} {t("reward weight")}
                </Text>
              )}
            </VStack>
            {!isNodeDelegator && (
              <Button size="sm" colorPalette="red" variant="ghost" flexShrink={0} onClick={detachModal.onOpen}>
                {t("Detach")}
              </Button>
            )}
          </HStack>
        ) : (
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="text.subtle">
              {t("NFTs provide reward multipliers. You can attach one GM NFT to this node.")}
            </Text>
            <Button
              size="sm"
              variant="primary"
              onClick={attachModal.onOpen}
              disabled={isNodeDelegator || availableGMs.length === 0}>
              <TbPaperclip /> {t("Attach")}
            </Button>
          </HStack>
        )}
      </VStack>
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
    </>
  )
}
