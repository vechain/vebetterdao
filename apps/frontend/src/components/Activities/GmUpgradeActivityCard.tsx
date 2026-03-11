import { Text, Card, VStack, HStack, Icon, LinkBox } from "@chakra-ui/react"
import { useWallet } from "@vechain/vechain-kit"
import dayjs from "dayjs"
import NextLink from "next/link"
import React, { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { LuSparkles } from "react-icons/lu"

import { useGetUserGMs } from "@/api/contracts/galaxyMember/hooks/useGetUserGMs"
import { gmNfts } from "@/constants/gmNfts"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

const getLevelLabel = (level: number): string => {
  const entry = gmNfts.find(n => n.level === String(level))
  return entry ? `${entry.name} (lv. ${level})` : `Level ${level}`
}

const getB3TRForLevel = (level: number): number => {
  return gmNfts.find(n => n.level === String(level))?.b3trToUpgrade ?? 0
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

  const { upgradeText, totalText } = useMemo(() => {
    const parts = byLevel.map(({ level, count }) =>
      count === 1
        ? t("{{count}} user upgraded to {{level}}", { count, level: getLevelLabel(level) })
        : t("{{count}} users upgraded to {{level}}", { count, level: getLevelLabel(level) }),
    )
    const totalB3TR = byLevel.reduce((sum, { level, count }) => sum + getB3TRForLevel(level) * count, 0)
    return {
      upgradeText: parts.join(", ") + " ",
      totalText: t("donating a total of {{amount}} B3TR", { amount: totalB3TR.toLocaleString() }),
    }
  }, [byLevel, t])

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
          <Text textStyle="sm" color="icon.subtle" pl="8">
            {upgradeText}
            <Text as="span" fontWeight="bold">
              {totalText}
            </Text>
          </Text>
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
