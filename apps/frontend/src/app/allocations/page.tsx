export const dynamic = "force-dynamic"

import { Grid, GridItem, Heading, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts/factories/Emissions__factory"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { executeMultipleClausesCall } from "@vechain/vechain-kit"
import { redirect } from "next/navigation"

import { getXAppMetadata } from "@/api/contracts/xApps/getXAppMetadata"
import { fetchClient } from "@/api/indexer/api"
import { FeatureFlag, featureFlags } from "@/constants/featureFlag"
import { blockNumberToDate } from "@/utils/date"
import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

import { CountdownBox } from "./components/CountdownBox"
import { PotentialRewardBox } from "./components/PotentialRewardBox"
import { AllocationTabs } from "./components/tabs/vote/AllocationTabs"
import { VotingPowerBox } from "./components/VotingPowerBox"
import { getRounds, RoundEarnings } from "./history/page"

export interface AppWithVotes {
  id: string
  teamWalletAddress: string
  name: string
  metadataURI: string
  createdAtTimestamp: bigint
  appAvailableForAllocationVoting: boolean
  voters: number
  votesReceived: bigint
  metadata?: Awaited<ReturnType<typeof getXAppMetadata>>
}

export interface AllocationRoundDetails {
  id: number
  currentRoundId: number
  totalVoters: number
  totalVP: bigint
  deadlineDate?: Date
  apps: AppWithVotes[]
  cycleTotal: bigint
  vote2EarnAmount: bigint
  gmAmount: bigint
  cycleTotalGMWeight: bigint
  xAllocationsAmount: bigint
  treasuryAmount: bigint
  previous3RoundsEarnings: RoundEarnings[]
}

const xAllocationVotingAbi = XAllocationVoting__factory.abi
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

const voterRewardsAbi = VoterRewards__factory.abi
const voterRewardsAddress = getConfig().voterRewardsContractAddress as `0x${string}`

const emissionsAbi = Emissions__factory.abi
const emissionsAddress = getConfig().emissionsContractAddress as `0x${string}`

export type AllocationAmount = {
  treasury: string
  voteX2Earn: string
  voteXAllocations: string
  gm: string
}

export const getRoundResults = async (roundId: number) =>
  fetchClient.GET("/api/v1/b3tr/xallocations/{roundId}/results", {
    params: { path: { roundId } },
  })

export const getRoundDetails = async (cycle: bigint) => {
  const thor = await getNodeJsThorClient()

  const [apps, cycleTotal, cycleTotalGMWeight, emissions] = await executeMultipleClausesCall({
    thor,
    calls: [
      {
        abi: xAllocationVotingAbi,
        address: xAllocationVotingAddress,
        functionName: "getAppsOfRound" as const,
        args: [cycle],
      },
      {
        abi: voterRewardsAbi,
        address: voterRewardsAddress,
        functionName: "cycleToTotal" as const,
        args: [cycle],
      },
      {
        abi: voterRewardsAbi,
        address: voterRewardsAddress,
        functionName: "cycleToTotalGMWeight" as const,
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

  const [xAllocationsAmount, vote2EarnAmount, treasuryAmount, gmAmount] = emissions

  return {
    apps,
    cycleTotal,
    xAllocationsAmount,
    vote2EarnAmount,
    treasuryAmount,
    gmAmount,
    cycleTotalGMWeight: cycleTotalGMWeight as bigint,
  }
}

const getHistoricalRoundData = async (round?: number): Promise<AllocationRoundDetails> => {
  const thor = await getNodeJsThorClient()
  const bestBlock = await thor.blocks.getBestBlockCompressed()

  const [currentRoundId] = await executeMultipleClausesCall({
    thor,
    calls: [
      {
        abi: xAllocationVotingAbi,
        address: xAllocationVotingAddress,
        functionName: "currentRoundId",
        args: [],
      },
    ],
  })

  let deadlineDate: Date | undefined
  const roundId = round ?? Number(currentRoundId)

  if (!round) {
    const [roundDeadline] = await executeMultipleClausesCall({
      thor,
      calls: [
        {
          abi: xAllocationVotingAbi,
          address: xAllocationVotingAddress,
          functionName: "roundDeadline" as const,
          args: [BigInt(roundId)],
        },
      ],
    })

    deadlineDate = await blockNumberToDate(
      thor,
      BigInt(roundDeadline),
      bestBlock?.timestamp,
      bestBlock ? BigInt(bestBlock.number) : undefined,
    )
  }

  const roundDetails = await getRoundDetails(BigInt(roundId))
  const rounds = await getRounds()

  const res = await getRoundResults(roundId)

  if (!res.data) throw Error("There is an error getting the data. Please try again.")

  const resultsMap = new Map(res.data.map(result => [result.appId, result]))

  const apps = roundDetails!.apps
  const appsMetadata = await Promise.all(apps.map(app => getXAppMetadata(`ipfs://${app.metadataURI}`)))
  const appsWithVotes = apps
    .map((app, index) => {
      const result = resultsMap.get(app.id)
      return {
        ...app,
        voters: result?.voters ?? 0,
        votesReceived: result?.votesReceived ? BigInt(result.votesReceived.toString()) : 0n,
        metadata: appsMetadata[index],
      }
    })
    .sort((appA, appB) => (appA.votesReceived > appB.votesReceived ? -1 : 1))

  return {
    id: roundId,
    currentRoundId: Number(currentRoundId),
    totalVoters: appsWithVotes.reduce((sum, app) => sum + (app.voters ?? 0), 0),
    totalVP: roundDetails.cycleTotal,
    deadlineDate,
    ...roundDetails,
    apps: appsWithVotes,
    previous3RoundsEarnings: rounds.data.slice(1, 4),
  }
}

export default async function Page({ searchParams }: { searchParams: Promise<{ roundId?: string }> }) {
  if (!featureFlags[FeatureFlag.ALLOCATION_REDESIGN].enabled) return redirect("/rounds")

  const params = await searchParams
  const roundIdParam = params.roundId

  let roundDetails: AllocationRoundDetails

  if (roundIdParam) {
    const roundId = parseInt(roundIdParam, 10)
    if (isNaN(roundId)) {
      return redirect("/allocations")
    } else roundDetails = await getHistoricalRoundData(roundId)
  } else roundDetails = await getHistoricalRoundData()

  return (
    <>
      <VStack alignItems="stretch" gap="2" w="full" mb="6">
        <Heading size={{ base: "xl", md: "3xl" }}>{"Allocation"}</Heading>
        <Grid
          templateRows={{ base: "repeat(2,1fr)", md: "1fr" }}
          templateColumns={{ base: "repeat(2,1fr)", md: "repeat(3,1fr)" }}
          gap="2">
          <GridItem colSpan={{ base: 2, md: 1 }} w="full">
            <VotingPowerBox />
          </GridItem>
          <GridItem asChild>
            <PotentialRewardBox roundDetails={roundDetails} />
          </GridItem>
          <GridItem asChild>
            <CountdownBox deadline={roundDetails?.deadlineDate} />
          </GridItem>
        </Grid>
      </VStack>

      <AllocationTabs roundDetails={roundDetails} previous3RoundsEarnings={roundDetails.previous3RoundsEarnings} />
    </>
  )
}
