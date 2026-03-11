import { Card, HStack, Icon, LinkBox, LinkOverlay, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import NextLink from "next/link"
import React, { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { FaRegCalendar } from "react-icons/fa6"
import { LuLeaf, LuStar, LuTrophy } from "react-icons/lu"

import { useMultipleXAppRoundEarnings } from "@/api/contracts/xAllocationPool/hooks/useMultipleXAppRoundEarnings"
import { useXApps } from "@/api/contracts/xApps/hooks/useXApps"
import { useGlobalActionOverview } from "@/api/indexer/actions/useGlobalActionOverview"
import { useTopAppsByActions } from "@/api/indexer/actions/useTopAppsByActions"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

const IMPACT_METRICS = [
  { key: "carbon", labelKey: "tonnes of CO2 saved", divisor: 1000 },
  { key: "water", labelKey: "litres of water saved", divisor: 1 },
  { key: "trees_planted", labelKey: "trees planted", divisor: 1 },
  { key: "plastic", labelKey: "kg of plastic saved", divisor: 1 },
  { key: "waste_mass", labelKey: "kg of waste collected", divisor: 1 },
  { key: "clean_energy_production_wh", labelKey: "Wh of clean energy produced", divisor: 1 },
  { key: "energy", labelKey: "kWh of energy saved", divisor: 1 },
] as const

const MAX_IMPACTS = 3

const Bold: React.FC<React.PropsWithChildren> = ({ children }) => (
  <Text as="span" fontWeight="bold" color="text">
    {children}
  </Text>
)

type Props = {
  activity: ActivityItem & { type: ActivityType.ROUND_ENDED }
}

export const RoundActivityCard: React.FC<Props> = ({ activity }) => {
  const { t } = useTranslation()
  const { votersCount, vot3Total, topApps } = activity.metadata
  const formatter = getCompactFormatter(1)
  const formattedVot3 = formatter.format(Number(vot3Total || "0"))

  const topAppIds = useMemo(() => topApps.map(a => a.appId), [topApps])
  const { data: topAppsEarnings } = useMultipleXAppRoundEarnings(activity.roundId, topAppIds)

  const formattedTopAppsEarnings = useMemo(() => {
    if (!topAppsEarnings?.length) return undefined
    const total = topAppsEarnings.reduce((sum, e) => sum + Number(e.amount), 0)
    return formatter.format(total)
  }, [topAppsEarnings, formatter])

  const roundIdNum = Number(activity.roundId)
  const { data: globalOverview } = useGlobalActionOverview(roundIdNum)
  const { data: topActionApps } = useTopAppsByActions(roundIdNum)
  const { data: allApps } = useXApps()

  const topImpacts = useMemo(() => {
    const impact = globalOverview?.totalImpact
    if (!impact) return []
    return IMPACT_METRICS.map(({ key, labelKey, divisor }) => {
      const raw = impact[key as keyof typeof impact] ?? 0
      return { labelKey, value: raw / divisor }
    })
      .filter(i => i.value >= 100)
      .sort((a, b) => b.value - a.value)
      .slice(0, MAX_IMPACTS)
  }, [globalOverview])

  const topAppsByActions = useMemo(() => {
    if (!topActionApps?.length || !allApps) return []
    return topActionApps.map(app => ({
      name: allApps.allApps.find(a => a.id === app.appId)?.name ?? app.appId,
      actions: app.actionsRewarded,
    }))
  }, [topActionApps, allApps])

  return (
    <LinkBox asChild>
      <Card.Root variant="subtle" rounded="lg" w="full" p="4" cursor="pointer">
        <Card.Body p="0">
          <VStack gap="3" align="flex-start" w="full">
            <HStack gap="3" align="flex-start" w="full">
              <Icon as={FaRegCalendar} color="status.info.strong" boxSize="5" mt="0.5" flexShrink={0} />
              <VStack gap="1" align="flex-start" flex="1" minW="0">
                <LinkOverlay asChild>
                  <NextLink href={`/allocations/round?roundId=${activity.roundId}`}>
                    <Text textStyle="sm" fontWeight="bold">
                      {t("Round #{{roundId}} completed", { roundId: activity.roundId })}
                    </Text>
                  </NextLink>
                </LinkOverlay>
              </VStack>

              <Text textStyle="xs" color="text.subtle">
                {dayjs.unix(activity.date).format("MMM D, YYYY")}
              </Text>
            </HStack>

            <VStack gap="2" pl="8" align="flex-start">
              <Text textStyle="sm" color="text.subtle">
                <Trans
                  i18nKey="roundSummary"
                  values={{ voters: votersCount.toLocaleString(), vot3: formattedVot3 }}
                  components={{ bold: <Bold /> }}
                />
              </Text>

              {topApps.length > 0 && (
                <HStack gap="2" align="flex-start">
                  <Icon as={LuStar} color="status.info.strong" boxSize="4" mt="0.5" flexShrink={0} />
                  <Text textStyle="sm" color="text.subtle">
                    {topApps.map((app, i) => (
                      <React.Fragment key={app.appId}>
                        {app.appName}
                        {i < topApps.length - 2 && ", "}
                        {i === topApps.length - 2 && ` ${t("and")} `}
                      </React.Fragment>
                    ))}
                    {topApps.length === 1
                      ? ` ${t("was the most voted app")}`
                      : ` ${t("were the {{count}} most voted apps", { count: topApps.length })}`}
                    {formattedTopAppsEarnings && `, ${t("receiving a total of")} ${formattedTopAppsEarnings} B3TR`}
                    {"."}
                  </Text>
                </HStack>
              )}

              {globalOverview && (
                <HStack gap="2" align="flex-start">
                  <Icon as={LuLeaf} color="status.positive.strong" boxSize="4" mt="0.5" flexShrink={0} />
                  <Text textStyle="sm" color="text.subtle">
                    {t("{{wallets}} unique wallets performed {{actions}} sustainability actions", {
                      wallets: formatter.format(globalOverview.totalUniqueUserInteractions),
                      actions: formatter.format(globalOverview.actionsRewarded),
                    })}
                    {topImpacts.length > 0 && (
                      <>
                        {t("including {{impacts}}", {
                          impacts: topImpacts
                            .map((impact, i) => {
                              const formatted = `${formatter.format(impact.value)} ${t(impact.labelKey)}`
                              if (i < topImpacts.length - 2) return `${formatted}, `
                              if (i === topImpacts.length - 2) return `${formatted} ${t("and")} `
                              return formatted
                            })
                            .join(""),
                        })}
                      </>
                    )}
                    {"."}
                  </Text>
                </HStack>
              )}

              {topAppsByActions.length > 0 && (
                <HStack gap="2" align="flex-start">
                  <Icon as={LuTrophy} color="status.warning.strong" boxSize="4" mt="0.5" flexShrink={0} />
                  <Text textStyle="sm" color="text.subtle">
                    {t("Biggest by actions")}
                    {": "}
                    {topAppsByActions.map((app, i) => (
                      <React.Fragment key={app.name}>
                        {app.name} {t("{{actions}} actions", { actions: formatter.format(app.actions) })}
                        {i < topAppsByActions.length - 1 && ", "}
                      </React.Fragment>
                    ))}
                    {"."}
                  </Text>
                </HStack>
              )}
            </VStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
