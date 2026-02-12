"use client"

import { Button, Card, HStack, Image, Link, Tag, Text, VStack } from "@chakra-ui/react"
import { UilEdit } from "@iconscout/react-unicons"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import { useAppEndorsementStatus } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useXAppMetadata } from "@/api/contracts/xApps/hooks/useXAppMetadata"
import { useXAppStatusConfig } from "@/app/apps/[appId]/hooks/useXAppStatusConfig"
import { XAppStatus } from "@/types/appDetails"
import { convertUriToUrl } from "@/utils/uri"

import { UserNode } from "../../../api/contracts/xNodes/useGetUserNodes"

type NodeEndorsedAppsProps = {
  node: UserNode
}

const EndorsedAppRow = ({ appId, points }: { appId: string; points: bigint }) => {
  const { t } = useTranslation()
  const { data: metadata } = useXAppMetadata(appId)
  const { status: endorsementStatus } = useAppEndorsementStatus(appId)
  const statusConfig = useXAppStatusConfig()
  const config = statusConfig[endorsementStatus as XAppStatus]

  return (
    <HStack justify="space-between" align="center" gap={4} w="full">
      <HStack gap={3} minW={0} flex={1}>
        <Image src={convertUriToUrl(metadata?.logo ?? "")} alt={metadata?.name ?? ""} w="10" h="10" rounded="lg" />
        <VStack align="start" gap={0} minW={0}>
          <Text textStyle="sm" fontWeight="semibold" lineClamp={1}>
            {metadata?.name ?? appId}
          </Text>
          {config && (
            <Tag.Root size="sm" variant="subtle" colorPalette="gray">
              <Tag.Label>{config.title}</Tag.Label>
            </Tag.Root>
          )}
        </VStack>
      </HStack>
      <HStack gap={2} flexShrink={0}>
        <Text textStyle="sm" color="text.subtle">
          {points.toString()} {t("pts")}
        </Text>
        <Link asChild>
          <NextLink href={`/apps/${appId}`}>
            <Button size="xs" variant="ghost" aria-label="Edit">
              <UilEdit />
            </Button>
          </NextLink>
        </Link>
      </HStack>
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
