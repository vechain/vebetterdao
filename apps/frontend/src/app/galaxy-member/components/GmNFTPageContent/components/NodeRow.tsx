import { Badge, Button, Card, Image, Text, VStack } from "@chakra-ui/react"
import { useTranslation } from "react-i18next"

import { Tooltip } from "@/components/ui/tooltip"
import { gmNfts } from "@/constants/gmNfts"

import { useGetNodeToFreeLevel } from "../../../../../api/contracts/galaxyMember/hooks/useGetNodeToFreeLevel"
import { UserNode } from "../../../../../api/contracts/xNodes/useGetUserNodes"

type Props = {
  node: UserNode
  currentGMLevel: string
  isAttachedToCurrentGM: boolean
  isAttachedToOtherGM: boolean
  hasAttachedNode: boolean
  onAttach: () => void
  onDetach: () => void
}

export const NodeRow = ({
  node,
  currentGMLevel,
  isAttachedToCurrentGM,
  isAttachedToOtherGM,
  hasAttachedNode,
  onAttach,
  onDetach,
}: Props) => {
  const { t } = useTranslation()
  const { data: freeLevel } = useGetNodeToFreeLevel(node.levelId)

  const freeLevelNum = Number(freeLevel ?? "0")
  const currentLevelNum = Number(currentGMLevel)
  const canUpgrade = freeLevelNum > currentLevelNum
  const freeLevelName = gmNfts.find(nft => nft.level === freeLevel)?.name

  return (
    <Card.Root variant="subtle" alignItems="center" flexDirection="row" gap={3} p="4" rounded="xl">
      <Image
        src={node?.metadata?.image ?? ""}
        alt={node?.metadata?.name}
        w="14"
        h="14"
        rounded="lg"
        objectFit="contain"
        flexShrink={0}
      />

      <VStack align="start" gap={1} flex={1} minW={0}>
        <Text textStyle="sm" fontWeight="semibold">
          {node?.metadata?.name} {"#"}
          {node.id.toString()}
        </Text>

        {isAttachedToCurrentGM ? (
          <Badge colorPalette="green" w="fit-content">
            {t("Attached")}
          </Badge>
        ) : canUpgrade && freeLevelName ? (
          <Badge colorPalette="purple" w="fit-content">
            {t("Free upgrade to {{name}}", { name: freeLevelName })}
          </Badge>
        ) : freeLevelNum > 0 && freeLevelName ? (
          <Text textStyle="xs" color="text.subtle">
            {t("Grants {{name}} level (already reached)", { name: freeLevelName })}
          </Text>
        ) : (
          <Text textStyle="xs" color="text.subtle">
            {t("No free GM upgrade")}
          </Text>
        )}
      </VStack>

      {isAttachedToCurrentGM ? (
        <Button colorPalette="red" size="sm" onClick={onDetach}>
          {t("Detach")}
        </Button>
      ) : isAttachedToOtherGM ? (
        <Tooltip content={t("This node is already attached to another GM")}>
          <span>
            <Button disabled variant="secondary" size="sm">
              {t("In use")}
            </Button>
          </span>
        </Tooltip>
      ) : (
        <Tooltip disabled={!hasAttachedNode} content={t("Only one node can be attached to a GM")}>
          <span>
            <Button
              disabled={hasAttachedNode}
              variant={canUpgrade ? "primary" : "secondary"}
              size="sm"
              onClick={onAttach}>
              {canUpgrade ? t("Attach") : t("Attach")}
            </Button>
          </span>
        </Tooltip>
      )}
    </Card.Root>
  )
}
