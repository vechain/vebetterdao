import {
  useAllocationAmount,
  useAllocationBaseAmount,
  useMaxAllocationAmount,
  useRoundXApps,
  useXAppsShares,
} from "@/api"
import { Spinner, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { AppVotesHorizontalChart } from "./AppVotesHorizontalChart"

export const AllocationXAppsVotesRankingChart = ({ roundId }: { roundId: string }) => {
  const { data: xApps, isLoading: xAppsLoading } = useRoundXApps(roundId)

  const { data: maxAllocation } = useMaxAllocationAmount(roundId)
  const { data: allocationAmount } = useAllocationAmount(roundId)
  const { data: baseAmount } = useAllocationBaseAmount(roundId)

  const xAppsSharesQuery = useXAppsShares(xApps?.map(app => app.id) ?? [], roundId)

  const maxAllocationPercentage = useMemo(() => {
    const maxAmountWithVotes = Number(maxAllocation) - Number(baseAmount)
    const totalVotesAllocation = Number(allocationAmount?.voteXAllocations) - Number(baseAmount) * (xApps?.length ?? 0)
    const maxAllocationPercentage = (maxAmountWithVotes / totalVotesAllocation) * 100

    return maxAllocationPercentage
  }, [maxAllocation, baseAmount, allocationAmount, xApps])

  const sortedData = useMemo(() => {
    if (!xAppsSharesQuery.data || !xApps) return []

    return xAppsSharesQuery.data
      .map(appShares => ({
        percentage: appShares.share + appShares.unallocatedShare,
        app: xApps?.find(xa => xa.id === appShares.app)?.id ?? "",
      }))
      .sort((a, b) => Number(b.percentage) - Number(a.percentage))
  }, [xAppsSharesQuery, xApps])

  const isLoading = xAppsLoading || xAppsSharesQuery.isLoading

  if (isLoading) return <Spinner size={"lg"} alignSelf="center" />

  return (
    <VStack spacing={8} align={"flex-start"} w="full">
      {sortedData.map(app => (
        <AppVotesHorizontalChart
          key={`app-votes-chart-${roundId}-${app.app}`}
          data={app}
          roundId={roundId}
          showReceived={true}
          maxAllocation={maxAllocation}
          maxAllocationPercentage={maxAllocationPercentage}
          renderMaxAllocation={true}
          showTotalVoters={true}
        />
      ))}
    </VStack>
  )
}
