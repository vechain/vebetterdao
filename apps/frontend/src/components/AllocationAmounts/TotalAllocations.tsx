import { Card, CardBody, CardHeader, Heading, Stack } from "@chakra-ui/react"
import { useAllocationsRound, useCurrentAllocationsRoundId, useXApps, useXAppsTotalEarnings } from "@/api"
import { useMemo } from "react"
import { AppAmount } from "./components/AppAmount"
import { useTranslation } from "react-i18next"

export const TotalAllocations = () => {
  const { t } = useTranslation()
  const { data: xApps } = useXApps()

  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  const { data: currentRound } = useAllocationsRound(currentRoundId?.toString() ?? "")

  // Generate roundIds from 1 to currentRoundId or previous round if current round is not active
  const roundIds = useMemo(() => {
    return Array.from({ length: Number(currentRoundId) - (currentRound.state === 0 ? 1 : 0) }, (_, i) =>
      (i + 1).toString(),
    )
  }, [currentRoundId, currentRound])
  const totalEarningsQuery = useXAppsTotalEarnings(xApps?.map(app => app.id) ?? [], roundIds)

  const isTotalEarningsLoading = totalEarningsQuery.some(query => query.isLoading)

  const sortedTotalEarnings = useMemo(() => {
    return totalEarningsQuery
      .filter(query => query.isSuccess)
      .map(query => query.data)
      .sort((a, b) => Number(b?.amount) - Number(a?.amount))
  }, [totalEarningsQuery])

  return (
    <Card flex={1} h="full" w="full" variant="baseWithBorder">
      <CardHeader>
        <Heading size="md">{t("Most voted apps")}</Heading>
      </CardHeader>
      <CardBody>
        <Stack spacing={5} w={"full"}>
          {isTotalEarningsLoading
            ? xApps?.map(app => <AppAmount key={app.id} xAppId={app.id} isLoading={isTotalEarningsLoading} />)
            : sortedTotalEarnings?.map(data => (
                <AppAmount
                  key={data?.appId}
                  xAppId={data?.appId}
                  amount={data?.amount}
                  isLoading={isTotalEarningsLoading}
                />
              ))}
        </Stack>
      </CardBody>
    </Card>
  )
}
