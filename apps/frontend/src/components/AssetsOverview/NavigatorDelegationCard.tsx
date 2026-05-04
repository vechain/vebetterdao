"use client"

import { Badge, Box, HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { humanAddress, humanDomain } from "@repo/utils/FormattingUtils"
import { useVechainDomain } from "@vechain/vechain-kit"
import { NavArrowRight } from "iconoir-react"
import { useRouter } from "next/navigation"
import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuUsers } from "react-icons/lu"
import { zeroAddress } from "viem"

import { useGetNavigator } from "@/api/contracts/navigatorRegistry/hooks/useGetNavigator"
import { useGetRawNavigatorAtTimepoint } from "@/api/contracts/navigatorRegistry/hooks/useGetRawNavigatorAtTimepoint"
import { useCurrentRoundSnapshot } from "@/api/contracts/xAllocations/hooks/useCurrentRoundSnapshot"
import { useNavigatorByAddress } from "@/api/indexer/navigators/useNavigators"
import { AddressIcon } from "@/components/AddressIcon"

export type DelegationStatus = "stable" | "exiting" | "changing" | "pending" | "none"

export const normalizeNavigatorAddress = (addr?: string) => {
  if (!addr) return ""
  const a = addr.toLowerCase()
  if (a === zeroAddress.toLowerCase()) return ""
  return addr
}

export const isPositiveSnapshotBlock = (block?: string) => {
  if (!block) return false
  try {
    return BigInt(block) > 0n
  } catch {
    return false
  }
}

export type NavigatorDelegationCardProps = {
  accountAddress?: string
  onClose: () => void
}

export const NavigatorDelegationCard = ({ accountAddress, onClose }: NavigatorDelegationCardProps) => {
  const { t } = useTranslation()
  const router = useRouter()
  const { data: snapshotBlock, isLoading: isRoundSnapshotLoading } = useCurrentRoundSnapshot()
  const { data: currentNavigatorAddress = "" } = useGetNavigator(accountAddress)
  const { data: snapshotNavigatorRaw, isLoading: isSnapshotNavLoading } = useGetRawNavigatorAtTimepoint(
    accountAddress,
    snapshotBlock,
  )

  const delegationStatus: DelegationStatus = useMemo(() => {
    if (!accountAddress) return "none"
    if (isRoundSnapshotLoading) return "none"
    if (isPositiveSnapshotBlock(snapshotBlock) && isSnapshotNavLoading) return "none"
    const cur = normalizeNavigatorAddress(currentNavigatorAddress)
    const snap = isPositiveSnapshotBlock(snapshotBlock) ? normalizeNavigatorAddress(snapshotNavigatorRaw) : ""

    if (!isPositiveSnapshotBlock(snapshotBlock)) {
      return cur ? "stable" : "none"
    }

    if (!snap && !cur) return "none"
    if (snap && !cur) return "exiting"
    if (!snap && cur) return "pending"
    if (snap && cur && snap.toLowerCase() === cur.toLowerCase()) return "stable"
    return "changing"
  }, [
    accountAddress,
    currentNavigatorAddress,
    snapshotNavigatorRaw,
    snapshotBlock,
    isRoundSnapshotLoading,
    isSnapshotNavLoading,
  ])

  const isDelegationDataPending =
    !!accountAddress && (isRoundSnapshotLoading || (isPositiveSnapshotBlock(snapshotBlock) && isSnapshotNavLoading))

  const activeNavigatorAddress = useMemo(() => {
    if (delegationStatus === "pending" || delegationStatus === "changing") {
      return normalizeNavigatorAddress(currentNavigatorAddress)
    }
    if (delegationStatus === "exiting" || delegationStatus === "stable") {
      return normalizeNavigatorAddress(snapshotNavigatorRaw) || normalizeNavigatorAddress(currentNavigatorAddress)
    }
    return ""
  }, [delegationStatus, snapshotNavigatorRaw, currentNavigatorAddress])

  const { data: activeDomain } = useVechainDomain(activeNavigatorAddress)
  const { data: activeNavigatorIndexer } = useNavigatorByAddress(activeNavigatorAddress)

  const activeDisplayName = useMemo(() => {
    return activeDomain?.domain ? humanDomain(activeDomain.domain, 15, 10) : humanAddress(activeNavigatorAddress, 8, 6)
  }, [activeNavigatorAddress, activeDomain?.domain])

  const navigateTo = useCallback(
    (addr: string) => {
      onClose()
      router.push(`/navigators/${addr}`)
    },
    [onClose, router],
  )

  const statusBadge =
    delegationStatus === "stable" ? null : delegationStatus === "exiting" ? (
      <Badge size="sm" rounded="md" bg="status.warning.subtle" color="status.warning.strong" fontWeight="semibold">
        {t("Exiting next round")}
      </Badge>
    ) : delegationStatus === "changing" ? (
      <Badge size="sm" rounded="md" bg="status.info.subtle" color="status.info.strong" fontWeight="semibold">
        {t("Changing next round")}
      </Badge>
    ) : (
      <Badge size="sm" rounded="md" bg="status.info.primary" color="text.default" fontWeight="semibold">
        {t("Effective next round")}
      </Badge>
    )

  if (isDelegationDataPending) {
    return (
      <Skeleton asChild loading>
        <Box h="88px" w="full" rounded="lg" />
      </Skeleton>
    )
  }
  if (delegationStatus === "none" || !activeNavigatorAddress) return null

  return (
    <HStack
      gap="3"
      p="3"
      rounded="lg"
      bg="status.info.subtle"
      borderWidth="1px"
      borderColor="status.info.muted"
      cursor="pointer"
      _hover={{ opacity: 0.85 }}
      onClick={() => navigateTo(activeNavigatorAddress)}
      align="center">
      <AddressIcon address={activeNavigatorAddress} boxSize={10} borderRadius="full" />
      <VStack align="start" gap="0.5" flex={1}>
        <Text textStyle="xs" color="text.subtle">
          {t("Delegated to navigator")}
        </Text>
        <Text textStyle="sm" fontWeight="semibold">
          {activeDisplayName}
        </Text>

        {activeNavigatorIndexer?.citizenCount != null && (
          <HStack gap={1}>
            <LuUsers size={12} color="var(--chakra-colors-fg-muted)" />
            <Text textStyle="xs" color="text.subtle">
              {t("Trusted by {{count}} citizens", { count: activeNavigatorIndexer.citizenCount })}
            </Text>
          </HStack>
        )}
        {statusBadge && (
          <Box hideFrom="md" mt="1">
            {statusBadge}
          </Box>
        )}
      </VStack>
      <HStack>
        {statusBadge && <Box hideBelow="md">{statusBadge}</Box>}
        <Icon boxSize="4" color="text.subtle" mt="1">
          <NavArrowRight />
        </Icon>
      </HStack>
    </HStack>
  )
}
