"use client"

import {
  Button,
  Card,
  Collapsible,
  Heading,
  HStack,
  Icon,
  Image,
  Link,
  Skeleton,
  Tag,
  Text,
  VStack,
} from "@chakra-ui/react"
import NextLink from "next/link"
import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { FaChevronDown } from "react-icons/fa6"

import { useAppEndorsementScore } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementScore"
import { useAppEndorsementStatus } from "@/api/contracts/xApps/hooks/endorsement/useAppEndorsementStatus"
import { useMaxPointsPerApp } from "@/api/contracts/xApps/hooks/endorsement/useMaxPointsPerApp"
import { useXAppMetadata } from "@/api/contracts/xApps/hooks/useXAppMetadata"
import { convertUriToUrl } from "@/utils/uri"

import type { AllApps } from "../../../api/contracts/xApps/getXApps"
import { useXAppStatusConfig } from "../../apps/[appId]/hooks/useXAppStatusConfig"

const VISIBLE_COUNT = 8
const TRANSITION_DURATION = "0.5s"

type AppsNeedEndorsementSidebarProps = {
  apps: AllApps[]
}

const AppSidebarItem = ({ appId }: { appId: string }) => {
  const { t } = useTranslation()
  const { data: metadata } = useXAppMetadata(appId)
  const { data: score } = useAppEndorsementScore(appId)
  const { data: maxPoints } = useMaxPointsPerApp()
  const { status, isLoading: isStatusLoading } = useAppEndorsementStatus(appId)
  const STATUS_CONFIG = useXAppStatusConfig()

  const numericScore = Number(score ?? 0)
  const numericMax = Number(maxPoints ?? 0)
  const isFullyEndorsed = numericMax > 0 && numericScore >= numericMax

  if (isFullyEndorsed) return null

  const scoreStr = score ?? "0"
  const maxStr = maxPoints?.toString() ?? "110"
  const statusConfig = STATUS_CONFIG[status]

  return (
    <Link asChild variant="plain" textDecoration="none" _hover={{ textDecoration: "none" }}>
      <NextLink href={`/apps/${appId}`}>
        <HStack gap={3} p={2} rounded="md" _hover={{ bg: "bg.subtle" }} w="full" justify="space-between">
          <HStack gap={2} minW={0} flex={1}>
            <Image src={convertUriToUrl(metadata?.logo ?? "")} alt={metadata?.name ?? ""} w="8" h="8" rounded="md" />
            <VStack gap={0} minW={0} align="start">
              <Text textStyle="sm" fontWeight="medium" lineClamp={1}>
                {metadata?.name ?? appId}
              </Text>
              <Skeleton loading={isStatusLoading} minH="18px">
                {statusConfig && (
                  <HStack gap={1}>
                    <Icon as={statusConfig.icon} boxSize={3} color={statusConfig.color} />
                    <Text textStyle="xs" color={statusConfig.color} fontWeight="semibold">
                      {statusConfig.title}
                    </Text>
                  </HStack>
                )}
              </Skeleton>
            </VStack>
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

export const AppsNeedEndorsementSidebar = ({ apps }: AppsNeedEndorsementSidebarProps) => {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(false)
  const handleToggle = useCallback(() => setIsExpanded(prev => !prev), [])

  const { uniqueApps, visibleApps, hiddenApps, hasHidden } = useMemo(() => {
    const unique = apps.filter((app, i, arr) => arr.findIndex(a => a.id === app.id) === i)
    const visible = unique.slice(0, VISIBLE_COUNT)
    const hidden = unique.slice(VISIBLE_COUNT)
    return { uniqueApps: unique, visibleApps: visible, hiddenApps: hidden, hasHidden: hidden.length > 0 }
  }, [apps])

  return (
    <VStack align="stretch" gap={6}>
      <HStack justify="space-between" align="center">
        <Heading textStyle="xl" size="xl">
          {t("Apps looking for endorsement")}
        </Heading>
        {uniqueApps.length > 0 && (
          <Tag.Root size="sm" variant="subtle">
            <Tag.Label>
              {uniqueApps.length} {uniqueApps.length === 1 ? t("app") : t("apps")}
            </Tag.Label>
          </Tag.Root>
        )}
      </HStack>
      <Card.Root variant="outline" w="full">
        <Card.Body>
          <VStack align="stretch" gap={4}>
            {visibleApps.length > 0 ? (
              <>
                {visibleApps.map(app => (
                  <AppSidebarItem key={app.id} appId={app.id} />
                ))}
                {hasHidden && (
                  <Collapsible.Root open={isExpanded}>
                    <Collapsible.Content css={{ transition: `height ${TRANSITION_DURATION} ease` }}>
                      <VStack align="stretch" gap={4}>
                        {hiddenApps.map(app => (
                          <AppSidebarItem key={app.id} appId={app.id} />
                        ))}
                      </VStack>
                    </Collapsible.Content>
                  </Collapsible.Root>
                )}
              </>
            ) : (
              <Text textStyle="sm" color="text.subtle">
                {t("No apps looking for endorsement right now.")}
              </Text>
            )}
          </VStack>
        </Card.Body>
        {hasHidden && (
          <Card.Footer>
            <Button
              variant="ghost"
              w="full"
              onClick={handleToggle}
              py={1}
              color="text.subtle"
              _hover={{ color: "text.default" }}
              transition="color 0.2s"
              aria-expanded={isExpanded}>
              <Icon
                as={FaChevronDown}
                boxSize={3}
                transition="transform 0.3s ease"
                transform={isExpanded ? "rotate(180deg)" : undefined}
              />
              <Text textStyle="sm">{isExpanded ? t("Show less") : t("View more")}</Text>
            </Button>
          </Card.Footer>
        )}
      </Card.Root>
    </VStack>
  )
}
