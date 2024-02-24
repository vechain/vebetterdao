import { Box, Card, CardBody, CardHeader, Heading, Stack } from "@chakra-ui/react"
import { useCurrentAllocationsRoundId, useXAppTotalEarnings, useXApps } from "@/api"
import { useMemo } from "react"
import { AppAmount } from "./components/AppAmount"

export const TotalAllocations = () => {
  const { data: xApps } = useXApps()
  const { data: currentRoundId } = useCurrentAllocationsRoundId()
  console.log("currentRoundId", currentRoundId)

  const roundIds = useMemo(() => {
    return Array.from({ length: Number(currentRoundId) }, (_, i) => (i + 1).toString())
  }, [currentRoundId])

  return (
    <Card flex={1} h="full" w="full" variant="outline">
      <CardHeader>
        <Heading size="md">Total Allocations</Heading>
      </CardHeader>
      <CardBody>
        <Box flex={1} />
        <Stack spacing={5} w={"full"}>
          {xApps?.map(app => <AppTotalAmounts key={app.id} xAppId={app.id} roundIds={roundIds} />)}
        </Stack>
      </CardBody>
    </Card>
  )
}

const AppTotalAmounts = ({ xAppId, roundIds }: { xAppId: string; roundIds: string[] }) => {
  const amounts = useXAppTotalEarnings(roundIds, xAppId)

  const totalAmount = amounts.reduce((acc, amount) => acc + Number(amount.data?.amount), 0)

  return <AppAmount xAppId={xAppId} amount={totalAmount.toString()} />
}
