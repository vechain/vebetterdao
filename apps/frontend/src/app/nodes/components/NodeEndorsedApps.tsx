"use client"

import { Button, Card, HStack, Icon, Image, Link, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuPencil, LuUsers } from "react-icons/lu"

import { useAppEndorsementStatus } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useAppEndorsers } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsers"
import { useMaxPointsPerApp } from "@/api/contracts/xApps/hooks/endorsement/useMaxPointsPerApp"
import { useXAppMetadata } from "@/api/contracts/xApps/hooks/useXAppMetadata"
import { EndorsementStatusCallout } from "@/app/apps/[appId]/components/AppEndorsementInfoCard/EndorsementStatusCallout"
import { XAppStatus } from "@/types/appDetails"
import { convertUriToUrl } from "@/utils/uri"

import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"

type NodeEndorsedAppsProps = {
  node: UserNode
}

const EndorsedAppRow = ({ appId, points }: { appId: string; points: bigint }) => {
  const { t } = useTranslation()
  const { data: metadata } = useXAppMetadata(appId)
  const { status: endorsementStatus, score } = useAppEndorsementStatus(appId)
  const { data: rawEndorsers } = useAppEndorsers(appId)
  const { data: maxPointsPerApp } = useMaxPointsPerApp()

  const uniqueEndorsersCount = useMemo(() => {
    if (!rawEndorsers) return 0
    return new Set(rawEndorsers.map(a => a.toLowerCase())).size
  }, [rawEndorsers])

  return (
    <HStack bg="bg.subtle" p={4} rounded="xl" gap={6} w="full" align="center">
      <Image
        src={convertUriToUrl(metadata?.logo ?? "")}
        alt={metadata?.name ?? ""}
        w="11"
        h="11"
        rounded="lg"
        flexShrink={0}
      />
      <VStack align="start" gap={1} flex={1} minW={0}>
        <Text textStyle="md" fontWeight="semibold" lineClamp={1}>
          {metadata?.name ?? appId}
        </Text>
        <HStack gap={3} w="full" align="center">
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
          <HStack gap={2} borderLeftWidth="1px" borderColor="border" pl={3} align="center">
            <Icon boxSize={4} color="text.subtle">
              <LuUsers />
            </Icon>
            <Text textStyle="sm" color="text.subtle">
              {uniqueEndorsersCount}
            </Text>
          </HStack>
          <HStack borderLeftWidth="1px" borderColor="border" pl={3}>
            <Text textStyle="sm" color="text.subtle">
              {score ?? "0"} {" / "} {maxPointsPerApp?.toString() ?? "0"} {t("pts")}
            </Text>
          </HStack>
        </HStack>
      </VStack>
      <Text textStyle="md" fontWeight="semibold" flexShrink={0}>
        {points.toString()} {t("pts")}
      </Text>
      <Link asChild>
        <NextLink href={`/apps/${appId}`}>
          <Icon boxSize={4} color="text.subtle">
            <LuPencil />
          </Icon>
        </NextLink>
      </Link>
    </HStack>
  )
}

export const NodeEndorsedApps = ({ node }: NodeEndorsedAppsProps) => {
  const { t } = useTranslation()
  const endorsements = node?.activeEndorsements ?? []
  const hasEndorsements = endorsements.length > 0

  return (
    <Card.Root variant="outline" w="full" cursor="default">
      <Card.Body>
        <VStack align="stretch" gap={3}>
          <Text textStyle="sm" color="text.subtle">
            {(t as (k: string) => string)(
              "Endorse your favourite apps to help them activate and unlock rewards for users.",
            )}
          </Text>
          {hasEndorsements ? (
            <VStack align="stretch" gap={3}>
              {endorsements.map(e => (
                <EndorsedAppRow key={e.appId} appId={e.appId} points={e.points} />
              ))}
            </VStack>
          ) : (
            <Button asChild variant="outline" size="sm" colorPalette="blue">
              <NextLink href="/apps">{t("Endorse")}</NextLink>
            </Button>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
