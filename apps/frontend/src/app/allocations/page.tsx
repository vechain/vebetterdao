import { Button, Card, Dialog, Grid, GridItem, Heading, Icon, Square, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { executeCallClause } from "@vechain/vechain-kit"
import { Clock, Flash } from "iconoir-react"
import { redirect } from "next/navigation"

import { fetchClient } from "@/api/indexer/api"
import { B3TRIcon } from "@/components/Icons/B3TRIcon"
import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

import { AllocationTabs } from "./components/tabs/AllocationTabs"

const abi = XAllocationVoting__factory.abi
const address = getConfig().xAllocationVotingContractAddress as `0x${string}`

const getApps = async () => {
  const thor = await getNodeJsThorClient()
  const [currentRoundId] = await executeCallClause({
    thor,
    abi,
    contractAddress: address,
    method: "currentRoundId",
    args: [],
  })

  const [apps] = await executeCallClause({
    thor,
    abi,
    contractAddress: address,
    method: "getAppsOfRound",
    args: [currentRoundId],
  })

  const res = await fetchClient.GET("/api/v1/b3tr/xallocations/{roundId}/results", {
    params: { path: { roundId: Number(currentRoundId) } },
  })

  if (!res.data) return []

  const resultsMap = new Map(res.data.map(result => [result.appId, result]))

  return apps.map(app => {
    const result = resultsMap.get(app.id)
    return {
      ...app,
      voters: result?.voters ?? 0,
      votesReceived: result?.votesReceived ?? 0,
    }
  })
}

const releaseNewDesign = false

export default async function Page() {
  const apps = await getApps()

  if (!releaseNewDesign) {
    return redirect("/rounds")
  }

  return (
    <>
      <VStack alignItems="stretch" gap="2" w="full" mb="6">
        <Heading>{"Allocation"}</Heading>
        <Grid templateRows="repeat(2,1fr)" templateColumns="repeat(2,1fr)" gap="2">
          <GridItem asChild colSpan={2} w="full">
            <Card.Root
              p="4"
              variant="subtle"
              bgColor="status.positive.subtle"
              flexDirection="row"
              alignItems="center"
              justifyContent="space-between">
              <VStack flex={1} lineClamp={2}>
                <Text textStyle="xs">{"Voting Power"}</Text>
                <Text textStyle="lg" fontWeight="semibold">
                  {"XX.XXK"}
                </Text>
              </VStack>
              <Dialog.Root>
                <Dialog.Trigger asChild>
                  <Button variant="primary">
                    <Icon as={Flash} boxSize="4" />
                    {"Power up"}
                  </Button>
                </Dialog.Trigger>
              </Dialog.Root>
            </Card.Root>
          </GridItem>
          <GridItem asChild>
            <Card.Root
              p="4"
              variant="subtle"
              bgColor="status.info.subtle"
              display="grid"
              gridTemplateColumns="2rem 1fr"
              columnGap="2"
              alignItems="center">
              <Square rounded="md" bgColor="status.info.subtle" aspectRatio={1} height="32px">
                <Icon boxSize="5" color="status.info.strong">
                  <B3TRIcon />
                </Icon>
              </Square>
              <VStack flex={1} lineClamp={2} gap="1">
                <Text textStyle="xs" lineClamp={1}>
                  {"Potential rewards"}
                </Text>
                <Text textStyle="sm" fontWeight="semibold" lineClamp={1}>
                  {"XX.XXK B3TR"}
                </Text>
              </VStack>
            </Card.Root>
          </GridItem>
          <GridItem asChild>
            <Card.Root
              p="4"
              variant="subtle"
              bgColor="status.warning.subtle"
              display="grid"
              gridTemplateColumns="32px 1fr"
              columnGap="2"
              alignItems="center">
              <Square rounded="md" bgColor="status.warning.subtle" aspectRatio={1} height="32px">
                <Icon as={Clock} boxSize="5" color="status.warning.strong" />
              </Square>
              <VStack flex={1} lineClamp={2} gap="1">
                <Text textStyle="xs">{"Left to vote"}</Text>
                <Text textStyle="sm" fontWeight="semibold">
                  {"5d  12h 12m"}
                </Text>
              </VStack>
            </Card.Root>
            <VStack flex={1} lineClamp={2}>
              <Text textStyle="xs">{"Voting Power"}</Text>
              <Text textStyle="sm" fontWeight="semibold">
                {"XX.XXK"}
              </Text>
            </VStack>
          </GridItem>
        </Grid>
      </VStack>

      <AllocationTabs apps={apps} />
    </>
  )
}
