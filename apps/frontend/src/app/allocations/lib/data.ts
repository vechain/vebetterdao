import { getConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts/factories/Emissions__factory"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { executeMultipleClausesCall } from "@vechain/vechain-kit/utils"

import { getXAppMetadata } from "@/api/contracts/xApps/getXAppMetadata"
import { fetchClient } from "@/api/indexer/api"
import { blockNumberToDate } from "@/utils/date"
import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

import { getRounds, RoundEarnings } from "../history/page"

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
  roundStart?: Date
  roundEnd?: Date
  currentRoundDeadline?: Date
  apps: AppWithVotes[]
  cycleTotal: bigint
  vote2EarnAmount: bigint
  gmAmount: bigint
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

  const [currentRoundDeadlineBlock, round, totalVotes, totalVoters, apps, cycleTotal, emissions] =
    await executeMultipleClausesCall({
      thor,
      calls: [
        {
          abi: xAllocationVotingAbi,
          address: xAllocationVotingAddress,
          functionName: "currentRoundDeadline" as const,
          args: [],
        },
        {
          abi: xAllocationVotingAbi,
          address: xAllocationVotingAddress,
          functionName: "getRound" as const,
          args: [cycle],
        },
        {
          abi: xAllocationVotingAbi,
          address: xAllocationVotingAddress,
          functionName: "totalVotes" as const,
          args: [cycle],
        },
        {
          abi: xAllocationVotingAbi,
          address: xAllocationVotingAddress,
          functionName: "totalVoters" as const,
          args: [cycle],
        },
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
          abi: emissionsAbi,
          address: emissionsAddress,
          functionName: "emissions",
          args: [cycle],
        },
      ],
    })

  const [xAllocationsAmount, vote2EarnAmount, treasuryAmount, gmAmount] = emissions
  const bestBlockCompressed = await thor.blocks.getBestBlockCompressed()
  const [roundStart, roundEnd, currentRoundDeadline] = [
    BigInt(round.voteStart),
    BigInt(round.voteStart + round.voteDuration),
    currentRoundDeadlineBlock,
  ].map(block => blockNumberToDate(block, bestBlockCompressed))

  return {
    roundStart,
    currentRoundDeadline,
    roundEnd,
    totalVP: totalVotes,
    totalVoters,
    apps,
    cycleTotal,
    xAllocationsAmount,
    vote2EarnAmount,
    treasuryAmount,
    gmAmount,
  }
}

export const getCurrentRoundId = async () => {
  const thor = await getNodeJsThorClient()
  return Number(await thor.contracts.load(xAllocationVotingAddress, xAllocationVotingAbi).read.currentRoundId())
}

export const getHistoricalRoundData = async (round?: number): Promise<AllocationRoundDetails> => {
  const currentRoundId = await getCurrentRoundId()

  const roundId = round ?? Number(currentRoundId)

  const roundDetails = await getRoundDetails(BigInt(roundId))
  const rounds = await getRounds({ roundId: round, pageSize: 6 })
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
    ...roundDetails,
    totalVoters: Number(roundDetails.totalVoters),
    apps: appsWithVotes,
    previous3RoundsEarnings: rounds.data,
  }
}
