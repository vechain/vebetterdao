import { Text, Card, VStack, HStack, Icon, LinkBox } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import NextLink from "next/link"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuSparkles } from "react-icons/lu"
import { formatUnits } from "viem"

import { useGetB3TRtoUpgradeToLevel } from "@/api/contracts/galaxyMember/hooks/useGetB3TRtoUpgradeToLevel"
import { useGetUserGMs } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"
import { gmNfts } from "@/constants/gmNfts"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

const GM_UPGRADE_LEVEL_ROW_KEY = "{{count}} users upgraded to {{level}} donating {{amount}} B3TR"

const getLevelLabel = (level: number): string => {
  const entry = gmNfts.find(n => n.level === String(level))
  return entry ? `${entry.name} (lv. ${level})` : `Level ${level}`
}

const GmUpgradeLevelRow: React.FC<{ level: number; count: number }> = ({ level, count }) => {
  const { t } = useTranslation()
  const { data: b3trRaw, isLoading } = useGetB3TRtoUpgradeToLevel(level)
  const totalRaw = b3trRaw != null ? BigInt(count) * b3trRaw : null
  const totalDisplay = isLoading ? "..." : totalRaw != null ? Number(formatUnits(totalRaw, 18)).toLocaleString() : ""

  const rowText = t(GM_UPGRADE_LEVEL_ROW_KEY, {
    count,
    level: getLevelLabel(level),
    amount: totalDisplay,
  })

  return (
    <HStack gap="2" align="center" w="full" py="1">
      {/* <Icon as={LuSparkles} color="status.positive.strong" boxSize="4" flexShrink={0} /> */}
      <Text textStyle="sm" color="icon.subtle" flex="1" minW="0" display="flex" alignItems="center" gap="2">
        {rowText}
      </Text>
    </HStack>
  )
}

type Props = {
  activity: ActivityItem & { type: ActivityType.GM_UPGRADED }
}

export const GmUpgradeActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { account } = useWallet()
  const { data: userGMs } = useGetUserGMs(account?.address)
  const { upgrades } = activity.metadata

  const byLevel = useMemo(() => {
    const map = new Map<number, number>()
    for (const u of upgrades) {
      map.set(u.newLevel, (map.get(u.newLevel) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => a.level - b.level)
  }, [upgrades])

  const totalCount = upgrades.length
  const title =
    totalCount === 1 ? t("1 user upgraded their GM") : t("{{count}} users upgraded their GM", { count: totalCount })

  const latestTimestamp = useMemo(() => (upgrades.length ? Math.max(...upgrades.map(u => u.timestamp)) : 0), [upgrades])

  const activeGM = userGMs?.find(g => g.isSelected) ?? userGMs?.[0]
  const href = account?.address && activeGM ? "/galaxy-member" : undefined

  const content = (
    <Card.Root variant="subtle" rounded="lg" w="full" p="4" cursor={href ? "pointer" : undefined}>
      <Card.Body p="0">
        <VStack gap="2" align="flex-start" w="full">
          <HStack gap="3" align="center" w="full">
            <Icon as={LuSparkles} color="status.positive.strong" boxSize="5" flexShrink={0} />
            <Text textStyle="sm" fontWeight="bold" flex="1" minW="0">
              {title}
            </Text>
            {latestTimestamp > 0 && (
              <Text textStyle="xs" color="text.subtle" flexShrink={0}>
                {dayjs.unix(latestTimestamp).fromNow()}
              </Text>
            )}
          </HStack>
          <VStack gap="0" align="flex-start" w="full" pl="8">
            {byLevel.map(({ level, count }) => (
              <GmUpgradeLevelRow key={level} level={level} count={count} />
            ))}
          </VStack>
        </VStack>
      </Card.Body>
    </Card.Root>
  )

  if (href) {
    return (
      <LinkBox asChild w="full">
        <NextLink href={href}>{content}</NextLink>
      </LinkBox>
    )
  }

  return content
}
