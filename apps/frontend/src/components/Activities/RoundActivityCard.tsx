import { Card, HStack, Icon, LinkBox, LinkOverlay, Text, VStack } from "@chakra-ui/react"
import { getCompactFormatter } from "@repo/utils/FormattingUtils"
import dayjs from "dayjs"
import NextLink from "next/link"
import React, { useMemo } from "react"
import { Trans, useTranslation } from "react-i18next"
import { FaRegCalendar } from "react-icons/fa6"

import { useMultipleXAppRoundEarnings } from "@/api/contracts/xAllocationPool/hooks/useMultipleXAppRoundEarnings"
import { ActivityItem, ActivityType } from "@/hooks/activities/types"

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
                      {t("Allocation round #{{roundId}} completed", { roundId: activity.roundId })}
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
                <Text textStyle="sm" color="text.subtle">
                  {topApps.map((app, i) => (
                    <React.Fragment key={app.appId}>
                      <Bold>{app.appName}</Bold>
                      {i < topApps.length - 2 && ", "}
                      {i === topApps.length - 2 && ` ${t("and")} `}
                    </React.Fragment>
                  ))}
                  {topApps.length === 1
                    ? ` ${t("was the most voted app")}`
                    : ` ${t("were the {{count}} most voted apps", { count: topApps.length })}`}
                  {formattedTopAppsEarnings && (
                    <>
                      {`, ${t("receiving a total of")} `}
                      <Bold>{`${formattedTopAppsEarnings} B3TR`}</Bold>
                    </>
                  )}
                  {"."}
                </Text>
              )}
            </VStack>
          </VStack>
        </Card.Body>
      </Card.Root>
    </LinkBox>
  )
}
