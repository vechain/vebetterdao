import { Card, Heading, Stack, Button, Text } from "@chakra-ui/react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useMultipleXAppsTotalEarnings } from "../../api/contracts/xAllocationPool/hooks/useMultipleXAppsTotalEarnings"
import { useAllocationsRound } from "../../api/contracts/xAllocations/hooks/useAllocationsRound"
import { useCurrentAllocationsRoundId } from "../../api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import { useXApps } from "../../api/contracts/xApps/hooks/useXApps"

import { AppAmount } from "./components/AppAmount"

const APPS_DISPLAY_LIMIT = 5
export const TotalAllocations = () => {
  const { t } = useTranslation()
  const { data: xApps } = useXApps({ filterBlacklisted: true })
  const activeApps = xApps?.active
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId?.toString() ?? "")
  const [displayLimit, setDisplayLimit] = useState(APPS_DISPLAY_LIMIT)
  // Generate roundIds from 1 to currentRoundId or previous round if current round is not active
  const roundIds = useMemo(() => {
    return Array.from({ length: Number(currentRoundId) - (currentRound.state === 0 ? 1 : 0) }, (_, i) => i + 1)
  }, [currentRoundId, currentRound])
  const { data: totalEarningsPerApp, isLoading: isTotalEarningsPerAppLoading } = useMultipleXAppsTotalEarnings(
    roundIds,
    activeApps?.map(app => app.id) ?? [],
  )
  const sortedTotalEarnings = useMemo(() => {
    return totalEarningsPerApp?.sort((a, b) => Number(b?.amount) - Number(a?.amount))
  }, [totalEarningsPerApp])
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
