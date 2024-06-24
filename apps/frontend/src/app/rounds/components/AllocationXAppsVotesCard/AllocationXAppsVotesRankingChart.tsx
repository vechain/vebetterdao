import { useAllocationVotes, useRoundXApps, useXAppsVotes } from "@/api"
import { Spinner, VStack } from "@chakra-ui/react"
import { useMemo } from "react"
import { AppVotesHorizontalChart } from "./AppVotesHorizontalChart"

type Props = {
  roundId: string
}

export const AllocationXAppsVotesRankingChart = ({ roundId }: Props) => {
  const { data: xApps, isLoading: xAppsLoading } = useRoundXApps(roundId)

  const xAppsVotes = useXAppsVotes(xApps?.map(app => app.id) ?? [], roundId)

  const { data: votes } = useAllocationVotes(roundId)

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
        />
      ))}
    </VStack>
  )
}
