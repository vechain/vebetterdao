import { Button, Card, Dialog, Grid, GridItem, Heading, Icon, Text, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts/factories/Emissions__factory"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { executeMultipleClausesCall } from "@vechain/vechain-kit"
import { Flash } from "iconoir-react"
import { redirect } from "next/navigation"

import { fetchClient } from "@/api/indexer/api"
import { FeatureFlag, featureFlags } from "@/constants/featureFlag"
import { blockNumberToDate } from "@/utils/date"
import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

import { CountdownBox } from "./components/CountdownBox"
import { PotentialRewardBox } from "./components/PotentialRewardBox"
import { AllocationTabs } from "./components/tabs/AllocationTabs"

export interface AppWithVotes {
  id: string
  teamWalletAddress: string
  name: string
  metadataURI: string
  createdAtTimestamp: bigint
  appAvailableForAllocationVoting: boolean
  voters: number
  votesReceived: bigint
}

export interface AllocationCurrentRoundDetails {
  id: number
  totalVoters: number
  totalVP: bigint
  deadlineDate?: Date
  apps: AppWithVotes[]
  cycleTotal: bigint
  vote2EarnAmount: bigint
  gmAmount: bigint
  cycleTotalGMWeight: bigint
}

const xAllocationVotingAbi = XAllocationVoting__factory.abi
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

const voterRewardsAbi = VoterRewards__factory.abi
const voterRewardsAddress = getConfig().voterRewardsContractAddress as `0x${string}`

const emissionsAbi = Emissions__factory.abi
const emissionsAddress = getConfig().emissionsContractAddress as `0x${string}`

const getCurrentRoundDetails = async (cycle: bigint) => {
  const thor = await getNodeJsThorClient()
  // Data neeed to calculate potential user reward
  const [apps, cycleTotal, cycleTotalGMWeight, emissions] = await executeMultipleClausesCall({
    thor,
    calls: [
      {
        abi: xAllocationVotingAbi,
        address: xAllocationVotingAddress,
        functionName: "getAppsOfRound",
        args: [cycle],
      },
      {
        abi: voterRewardsAbi,
        address: voterRewardsAddress,
        functionName: "cycleToTotal",
        args: [cycle],
      },
      {
        abi: voterRewardsAbi,
        address: voterRewardsAddress,
        functionName: "cycleToTotalGMWeight",
        args: [cycle],
      },
      {
        abi: emissionsAbi,
        address: emissionsAddress,
        functionName: "emissions",
        args: [cycle],
      },
    ],
  })

  const [_xAllocationsAmount, vote2EarnAmount, _treasuryAmount, gmAmount] = emissions

  return {
    apps,
    cycleTotal,
    vote2EarnAmount,
    gmAmount,
    cycleTotalGMWeight: cycleTotalGMWeight as bigint,
  }
}

const getData = async (): Promise<AllocationCurrentRoundDetails> => {
  const thor = await getNodeJsThorClient()
  const bestBlock = await thor.blocks.getBestBlockCompressed()

  const [currentRoundId, currentRoundDeadline] = await executeMultipleClausesCall({
    thor,
    calls: [
      {
        abi: xAllocationVotingAbi,
        address: xAllocationVotingAddress,
        functionName: "currentRoundId",
        args: [],
      },
      {
        abi: xAllocationVotingAbi,
        address: xAllocationVotingAddress,
        functionName: "currentRoundDeadline",
        args: [],
      },
    ],
  })

  const currentRoundDetails = await getCurrentRoundDetails(currentRoundId)

  const res = await fetchClient.GET("/api/v1/b3tr/xallocations/{roundId}/results", {
    params: { path: { roundId: Number(currentRoundId) } },
  })

  if (!res.data) throw Error("There is an error getting the data. Please try again.")

  const resultsMap = new Map(res.data.map(result => [result.appId, result]))

  const apps = currentRoundDetails!.apps
  const appsWithVotes = apps.map(app => {
    const result = resultsMap.get(app.id)
    return {
      ...app,
      voters: result?.voters ?? 0,
      // this actually returns string, BE typing needed change
      votesReceived: BigInt(result!.votesReceived.toString()) ?? 0,
    }
  })

  const deadlineDate = await blockNumberToDate(
    thor,
    BigInt(currentRoundDeadline),
    bestBlock?.timestamp,
    bestBlock ? BigInt(bestBlock.number) : undefined,
  )

  return {
    id: Number(currentRoundId),
    totalVoters: appsWithVotes.reduce((sum, app) => sum + (app.voters ?? 0), 0),
    totalVP: currentRoundDetails.cycleTotal,
    deadlineDate,
    ...currentRoundDetails,
    apps: appsWithVotes,
  }
}

export default async function Page() {
  if (!featureFlags[FeatureFlag.ALLOCATION_REDESIGN].enabled) return redirect("/rounds")

  const currentRoundDetails = await getData()

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
            <PotentialRewardBox currentRoundDetails={currentRoundDetails} />
          </GridItem>
          <GridItem asChild>
            <CountdownBox deadline={currentRoundDetails?.deadlineDate} />
          </GridItem>
        </Grid>
      </VStack>

      <AllocationTabs currentRoundDetails={currentRoundDetails} />
    </>
  )
}
