import { Card, Heading, Stack, Button, Text } from "@chakra-ui/react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useXApps } from "../../api/contracts/xApps/hooks/useXApps"
import { useMultipleAppsEarnings } from "../../api/indexer/xallocations/useMultipleAppsEarnings"

import { AppAmount } from "./components/AppAmount"

const APPS_DISPLAY_LIMIT = 10
export const TotalAllocations = () => {
  const { t } = useTranslation()
  const { data: xApps } = useXApps({ filterBlacklisted: true })
  const activeApps = xApps?.active
  const [displayLimit, setDisplayLimit] = useState(APPS_DISPLAY_LIMIT)

  const { data: earningsData, isLoading: isTotalEarningsPerAppLoading } = useMultipleAppsEarnings(
    activeApps?.map(app => app.id) ?? [],
  )

  // Aggregate and sort earnings by total amount
  const sortedTotalEarnings = useMemo(() => {
    if (!earningsData) return undefined

    return earningsData
      .map(item => {
        // Sum up totalAmount across all rounds for this app
        const totalAmount = Array.isArray(item.earnings)
          ? item.earnings.reduce((sum, earning) => sum + (earning.totalAmount || 0), 0)
          : 0

        return {
          appId: item.appId,
          amount: totalAmount,
        }
      })
      .sort((a, b) => Number(b.amount) - Number(a.amount))
  }, [earningsData])
  const handleLoadMore = () => {
    setDisplayLimit(prev => prev + APPS_DISPLAY_LIMIT)
  }
  const displayedEarnings = useMemo(() => {
    return sortedTotalEarnings?.slice(0, displayLimit)
  }, [sortedTotalEarnings, displayLimit])
  const hasMoreApps = useMemo(() => {
    return sortedTotalEarnings && sortedTotalEarnings.length > displayLimit
  }, [sortedTotalEarnings, displayLimit])
  return (
    <Card.Root variant="primary" flex={1} h="full" w="full">
      <Card.Header>
        <Heading size="xl">{t("Most voted apps")}</Heading>
        <Text textStyle="sm" color="text.subtle">
          {t("Use Apps to earn B3TR tokens through your Better Actions")}
        </Text>
      </Card.Header>
      <Card.Body>
        <Stack gap={3} w={"full"}>
          {isTotalEarningsPerAppLoading
            ? activeApps
                ?.slice(0, displayLimit)
                .map(app => <AppAmount key={app.id} xAppId={app.id} isLoading={isTotalEarningsPerAppLoading} />)
            : displayedEarnings?.map(data => (
                <AppAmount
                  key={data?.appId}
                  xAppId={data?.appId}
                  amount={data?.amount}
                  isLoading={isTotalEarningsPerAppLoading}
                />
              ))}

          {hasMoreApps && (
            <Button mx="auto" maxW="fit" size="md" variant="link" onClick={handleLoadMore}>
              {t("Load more")}
            </Button>
          )}
        </Stack>
      </Card.Body>
    </Card.Root>
  )
}
