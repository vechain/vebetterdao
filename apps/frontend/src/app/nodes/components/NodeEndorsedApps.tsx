"use client"

import { Button, Heading, HStack, Icon, IconButton, Image, LinkBox, LinkOverlay, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { LuClock, LuPencil } from "react-icons/lu"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useAppEndorsementStatus } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useCooldownPeriod } from "@/api/contracts/xApps/hooks/endorsement/useCooldownPeriod"
import { useXAppMetadata } from "@/api/contracts/xApps/hooks/useXAppMetadata"
import { AppEndorsementInfoCardModal } from "@/app/apps/[appId]/components/AppEndorsementInfoCard/AppEndorsementInfoCardModal"
import { EndorsementStatusCallout } from "@/app/apps/[appId]/components/AppEndorsementInfoCard/EndorsementStatusCallout"
import { XAppStatus } from "@/types/appDetails"
import { convertUriToUrl } from "@/utils/uri"

import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"

import { EditEndorsementModal } from "./EditEndorsementModal"
import { EndorseAppsModal } from "./EndorseAppsModal"

type NodeEndorsedAppsProps = {
  node: UserNode
}

const EndorsedAppRow = ({
  node,
  appId,
  points,
  endorsedAtRound,
}: {
  node: UserNode
  appId: string
  points: bigint
  endorsedAtRound: bigint
}) => {
  const { t } = useTranslation()
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const { data: metadata } = useXAppMetadata(appId)
  const { status: endorsementStatus } = useAppEndorsementStatus(appId)
  const { data: cooldownPeriodData } = useCooldownPeriod()
  const { data: currentRoundStr } = useCurrentAllocationsRoundId()

  const cooldownRemainingRounds = useMemo(() => {
    const cooldownPeriod = cooldownPeriodData ?? BigInt(0)
    const currentRound = BigInt(currentRoundStr ?? 0)
    if (!endorsedAtRound || !cooldownPeriod || !currentRound) return BigInt(0)
    const cooldownEnd = endorsedAtRound + cooldownPeriod
    return currentRound >= cooldownEnd ? BigInt(0) : cooldownEnd - currentRound
  }, [endorsedAtRound, cooldownPeriodData, currentRoundStr])

  const isInCooldown = cooldownRemainingRounds > BigInt(0)

  return (
    <VStack bg="bg.subtle" p={4} rounded="xl" gap={3} w="full" align="stretch">
      <HStack gap={3} w="full" align="center">
        <LinkBox flexShrink={0}>
          <LinkOverlay asChild>
            <NextLink href={`/apps/${appId}`} />
          </LinkOverlay>
          <Image
            src={convertUriToUrl(metadata?.logo ?? "")}
            alt={metadata?.name ?? ""}
            w="11"
            h="11"
            rounded="lg"
            cursor="pointer"
          />
        </LinkBox>
        <Text textStyle="md" fontWeight="semibold" lineClamp={1} flex={1} minW={0}>
          {metadata?.name ?? appId}
        </Text>
        <Text textStyle="md" fontWeight="semibold" flexShrink={0}>
          {points.toString()} {t("pts")}
        </Text>
        <IconButton aria-label={t("Edit endorsement")} variant="ghost" size="xs" onClick={() => setIsEditOpen(true)}>
          <Icon as={LuPencil} boxSize={4} color="text.subtle" />
        </IconButton>
      </HStack>
      <HStack gap={3} w="full" align="center" flexWrap="wrap">
        <EndorsementStatusCallout
          endorsementStatus={endorsementStatus as XAppStatus}
          appId={appId}
          showDescription={false}
          padding={1}
          boxSize={4}
          textStyle="sm"
          flex="0"
          whiteSpace="nowrap"
        />
        {isInCooldown && (
          <HStack gap={1} borderLeftWidth="1px" borderColor="border" pl={3} align="center">
            <Icon as={LuClock} boxSize={4} color="fg.warning" />
            <Text textStyle="sm" color="fg.warning">
              {t("In cooldown")}
            </Text>
          </HStack>
        )}
        <Button variant="ghost" size="xs" ml="auto" onClick={() => setIsDetailsOpen(true)}>
          {t("Details")}
        </Button>
      </HStack>
      <AppEndorsementInfoCardModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        appId={appId}
        userNode={node}
      />
      <EditEndorsementModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        node={node}
        appId={appId}
        currentPoints={points}
        endorsedAtRound={endorsedAtRound}
      />
    </VStack>
  )
}

export const NodeEndorsedApps = ({ node }: NodeEndorsedAppsProps) => {
  const { t } = useTranslation()
  const [isEndorseOpen, setIsEndorseOpen] = useState(false)
  const endorsements = node?.activeEndorsements ?? []
  const hasEndorsements = endorsements.length > 0
  const hasEndorsementPower = node.endorsementScore > 0n

  return (
    <>
      <Heading textStyle="lg">{t("Endorsed apps")}</Heading>
      <VStack align="stretch" gap={3}>
        {!hasEndorsementPower ? (
          <Text textStyle="sm" color="text.subtle">
            {t(
              "This node level does not provide endorsement power. Upgrade to at least a Strength node to endorse apps.",
            )}
          </Text>
        ) : hasEndorsements ? (
          <VStack align="stretch" gap={3}>
            {endorsements.map(e => (
              <EndorsedAppRow
                key={e.appId}
                node={node}
                appId={e.appId}
                points={e.points}
                endorsedAtRound={e.endorsedAtRound}
              />
            ))}
          </VStack>
        ) : (
          <HStack justify="space-between" w="full">
            <Text textStyle="sm" color="text.subtle">
              {t("Endorse your favourite apps to help them activate and unlock rewards for users.")}
            </Text>
            <Button size="sm" variant="primary" onClick={() => setIsEndorseOpen(true)}>
              {t("Endorse")}
            </Button>
          </HStack>
        )}
      </VStack>
      <EndorseAppsModal isOpen={isEndorseOpen} onClose={() => setIsEndorseOpen(false)} node={node} />
    </>
  )
}
