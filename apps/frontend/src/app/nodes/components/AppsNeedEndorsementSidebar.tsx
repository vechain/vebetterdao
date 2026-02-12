"use client"

import { Card, Heading, HStack, Image, Link, Text, VStack } from "@chakra-ui/react"
import NextLink from "next/link"
import { useTranslation } from "react-i18next"

import { useAppEndorsementScore } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementScore"
import { useMaxPointsPerApp } from "@/api/contracts/xApps/hooks/endorsement/useMaxPointsPerApp"
import { useXAppMetadata } from "@/api/contracts/xApps/hooks/useXAppMetadata"
import { convertUriToUrl } from "@/utils/uri"

import type { UnendorsedApp } from "../../../api/contracts/xApps/getXApps"

type AppsNeedEndorsementSidebarProps = {
  gracePeriodApps: UnendorsedApp[]
  endorsementLostApps: UnendorsedApp[]
  newLookingForEndorsement: UnendorsedApp[]
}

const AppSidebarItem = ({ appId }: { appId: string }) => {
  const { t } = useTranslation()
  const { data: metadata } = useXAppMetadata(appId)
  const { data: score } = useAppEndorsementScore(appId)
  const { data: maxPoints } = useMaxPointsPerApp()
  const scoreStr = score ?? "0"
  const maxStr = maxPoints?.toString() ?? "110"

  return (
    <Link asChild variant="plain" textDecoration="none" _hover={{ textDecoration: "none" }}>
      <NextLink href={`/apps/${appId}`}>
        <HStack gap={3} p={2} rounded="md" _hover={{ bg: "bg.subtle" }} w="full" justify="space-between">
          <HStack gap={2} minW={0} flex={1}>
            <Image src={convertUriToUrl(metadata?.logo ?? "")} alt={metadata?.name ?? ""} w="8" h="8" rounded="md" />
            <Text textStyle="sm" fontWeight="medium" lineClamp={1}>
              {metadata?.name ?? appId}
            </Text>
          </HStack>
          <VStack gap={0} alignItems="flex-end" flexShrink={0}>
            <HStack gap={1} alignItems="flex-end">
              <Text textStyle="2xl" fontWeight="bold" color="text.default">
                {scoreStr}
              </Text>
              <Text textStyle="sm" color="text.subtle" pb="3.5px">{`/${maxStr}`}</Text>
            </HStack>
            <Text textStyle="xs" color="text.subtle">
              {t("Total score")}
            </Text>
          </VStack>
        </HStack>
      </NextLink>
    </Link>
  )
}

const AppListSection = ({ title, apps }: { title: string; apps: UnendorsedApp[] }) => {
  if (!apps.length) return null
  return (
    <VStack align="stretch" gap={2}>
      <Text textStyle="md" fontWeight="bold" color="text.subtle">
        {title}
      </Text>
      {apps.map(app => (
        <AppSidebarItem key={app.id} appId={app.id} />
      ))}
    </VStack>
  )
}

export const AppsNeedEndorsementSidebar = ({
  gracePeriodApps,
  endorsementLostApps,
  newLookingForEndorsement,
}: AppsNeedEndorsementSidebarProps) => {
  const { t } = useTranslation()
  const hasAny = gracePeriodApps.length > 0 || endorsementLostApps.length > 0 || newLookingForEndorsement.length > 0

  return (
    <Card.Root variant="outline" w="full">
      <Card.Body>
        <VStack align="stretch" gap={4}>
          <Heading textStyle="lg" size="xl">
            {t("Apps looking for endorsement")}
          </Heading>
          {hasAny ? (
            <VStack align="stretch" gap={4}>
              <AppListSection title={t("New")} apps={newLookingForEndorsement} />
              <AppListSection title={t("In grace period")} apps={gracePeriodApps} />
              <AppListSection title={t("Endorsement lost")} apps={endorsementLostApps} />
            </VStack>
          ) : (
            <Text textStyle="sm" color="text.subtle">
              {t("No apps looking for endorsement right now.")}
            </Text>
          )}
        </VStack>
      </Card.Body>
    </Card.Root>
  )
}
