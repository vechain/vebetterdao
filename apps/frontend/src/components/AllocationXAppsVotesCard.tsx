import { Box, Card, CardBody, CardHeader, HStack, Heading } from "@chakra-ui/react"
import { HorizontalChartBar } from "./HorizontalBarChart"
import { useXApps, useXAppsVotes } from "@/api"
import { useMemo } from "react"

type Props = {
  roundId: string
}
export const AllocationXAppsVotesCard = ({ roundId }: Props) => {
  const { data: xApps } = useXApps()

  const xAppsVotes = useXAppsVotes(xApps?.map(app => app.id) ?? [], roundId)

  const data = useMemo(
    () =>
      xAppsVotes.map(app => ({
        votes: app.data?.votes,
        app: xApps?.find(xa => xa.id === app.data?.app)?.name,
      })),
    [xAppsVotes, xApps],
  )

  console.log({ data, xAppsVotes })

  return (
    <Card flex={1}>
      <CardHeader>
        <HStack justify={"space-between"} w="full">
          <Heading size="md">Real-Time votes</Heading>
        </HStack>
      </CardHeader>
      <CardBody>
        <HorizontalChartBar data={data} xKey="app" yKey="votes" />

        <Box flex={1} />
      </CardBody>
    </Card>
  )
}
