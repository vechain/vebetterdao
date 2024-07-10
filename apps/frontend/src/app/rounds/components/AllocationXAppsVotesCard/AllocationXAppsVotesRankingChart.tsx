import {
  useAllocationAmount,
  useAllocationBaseAmount,
  useAllocationVotesQf,
  useMaxAllocationAmount,
  useRoundXApps,
  useXAppsVotesQf,
} from "@/api"
import { Spinner, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { AppVotesHorizontalChart } from "./AppVotesHorizontalChart"

type Props = {
  roundId: string
}

export const AllocationXAppsVotesRankingChart = ({ roundId }: Props) => {
  const { data: xApps, isLoading: xAppsLoading } = useRoundXApps(roundId)

  const { data: maxAllocation } = useMaxAllocationAmount(roundId)
  const { data: allocationAmount } = useAllocationAmount(roundId)
  const { data: baseAmount, isLoading: baseAmountLoading } = useAllocationBaseAmount(roundId)

  const xAppsVotes = useXAppsVotesQf(xApps?.map(app => app.id) ?? [], roundId)

  const { data: votes } = useAllocationVotesQf(roundId)

  const maxAllocationPercentage = useMemo(() => {
    const maxAmountWithVotes = Number(maxAllocation) - Number(baseAmount)
    const totalVotesAllocation = Number(allocationAmount?.voteXAllocations) - Number(baseAmount) * (xApps?.length ?? 0)
    const maxAllocationPercentage = (maxAmountWithVotes / totalVotesAllocation) * 100

    return maxAllocationPercentage
  }, [maxAllocation, baseAmount, allocationAmount, xApps])

  const sortedData = useMemo(
    () =>
      xAppsVotes
        .map(app => ({
          votes: app.data?.votes ?? "0",
          app: xApps?.find(xa => xa.id === app.data?.app)?.id ?? "",
        }))
        .sort((a, b) => Number(b.votes) - Number(a.votes)),

    [xAppsVotes, xApps],
  )

  const isLoading = xAppsLoading || xAppsVotes.some(query => query.isLoading)

  if (isLoading) return <Spinner size={"lg"} alignSelf="center" />

  return (
    <VStack spacing={8} align={"flex-start"} w="full">
      {sortedData.map((app, index) => (
        <AppVotesHorizontalChart
          key={index}
          data={app}
          index={index}
          totalVotes={votes}
          roundId={roundId}
          showReceived={true}
          maxAllocation={maxAllocation}
          maxAllocationPercentage={maxAllocationPercentage}
          renderMaxAllocation={true}
        />
      ))}
    </VStack>
  )
}
