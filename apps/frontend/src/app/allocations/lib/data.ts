export const revalidate = 0
export const fetchCache = "force-no-store"

import { getConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts/factories/Emissions__factory"
import { VoterRewards__factory } from "@vechain/vebetterdao-contracts/factories/VoterRewards__factory"
import { XAllocationPool__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationPool__factory"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { executeMultipleClausesCall } from "@vechain/vechain-kit/utils"
import { formatEther } from "viem"

import { getXAppMetadata } from "@/api/contracts/xApps/getXAppMetadata"
import { fetchClient } from "@/api/indexer/api"
import { AppEarnings } from "@/api/indexer/xallocations/useAppEarnings"
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
  earnings?: AppEarnings[number]
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

const xAllocationPoolAbi = XAllocationPool__factory.abi
const xAllocationPoolAddress = getConfig().xAllocationPoolContractAddress as `0x${string}`

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
  const thor = await getNodeJsThorClient()
  const currentRoundId = await getCurrentRoundId()
  const roundId = round ?? Number(currentRoundId)
  const roundDetails = await getRoundDetails(BigInt(roundId))
  const surroundingStartId = Math.min(roundId + 1, currentRoundId)
  const rounds = await getRounds({ roundId: surroundingStartId, pageSize: 7 })
  const res = await getRoundResults(roundId)

  if (!res.data) throw Error("There is an error getting the data. Please try again.")

  const resultsMap = new Map(res.data.map(result => [result.appId, result]))

  const apps = roundDetails!.apps
  const appIds = apps.map(app => app.id)
  const appsMetadata = await Promise.all(apps.map(app => getXAppMetadata(`ipfs://${app.metadataURI}`)))

  const earnings = await (currentRoundId === roundId
    ? executeMultipleClausesCall({
        thor,
        calls: appIds.map(
          appId =>
            ({
              abi: xAllocationPoolAbi,
              address: xAllocationPoolAddress,
              functionName: "roundEarnings",
              args: [BigInt(roundId), appId as `0x${string}`],
            }) as const,
        ),
      }).then(appArr =>
        appArr.map((app, idx) => {
          const [totalAmount = 0, unallocatedAmount = 0, teamAllocationAmount = 0, rewardsAllocationAmount = 0] =
            app.map(amount => Number(formatEther(amount)))

          return {
            roundId,
            appId: appIds[idx],
            totalAmount,
            unallocatedAmount,
            teamAllocationAmount,
            rewardsAllocationAmount,
          }
        }),
      )
    : Promise.all(
        appIds.map(appId =>
          fetchClient
            .GET("/api/v1/b3tr/xallocations/earnings", {
              params: { query: { roundId, appId } },
            })
            .then(response => response.data?.[0]),
        ),
      ))
  const earningsMap = new Map(earnings.map((response, index) => [apps[index]?.id, response]))

  const appsWithVotes = apps
    .map((app, index) => {
      const result = resultsMap.get(app.id)
      return {
        ...app,
        voters: result?.voters ?? 0,
        votesReceived: result?.votesReceived ? BigInt(result.votesReceived.toString()) : 0n,
        metadata: appsMetadata[index],
        earnings: earningsMap.get(app.id),
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
