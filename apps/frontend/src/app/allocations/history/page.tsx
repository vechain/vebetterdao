export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { ButtonGroup, IconButton, Pagination, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts/factories/Emissions__factory"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/x-allocation-voting-governance/XAllocationVoting__factory"
import { ThorClient, executeCallClause, executeMultipleClausesCall } from "@vechain/vechain-kit"
import Link from "next/link"
import { Suspense } from "react"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"

import { fetchClient } from "@/api/indexer/api"
import { AppEarnings } from "@/api/indexer/xallocations/useAppEarnings"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"
import { blockNumberToDate } from "@/utils/date"
import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

import { RoundHistoryCard } from "../components/tabs/round-info/RoundHistoryCard"
import { getCurrentRoundId } from "../lib/data"

import { HistoryListSkeleton } from "./components/HistoryListSkeleton"

const xAllocationVotingabi = XAllocationVoting__factory.abi
const xAllocationVotingContractAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

const emissionAbi = Emissions__factory.abi
const emissionsContractAddress = getConfig().emissionsContractAddress as `0x${string}`

const BreadcrumItems = [
  {
    label: "Allocations",
    href: "/allocations",
  },
  {
    label: "History",
    href: "/allocations/history",
  },
]

const PAGE_SIZE = 10

export type RoundEarnings = AppEarnings[number] & {
  roundStart: Date
  roundEnd: Date
  vote2EarnAmount: bigint
}

interface RoundsPageResponse {
  data: RoundEarnings[]
  currentRoundId: number
}

export const getRoundsDates = async (thor: ThorClient) => {
  const [currentRound] = await executeCallClause({
    thor,
    abi: xAllocationVotingabi,
    contractAddress: xAllocationVotingContractAddress,
    method: "currentRoundId" as const,
    args: [],
  })
  const currentRoundId = Number(currentRound)
  const roundsArray = Array(currentRoundId)
    .fill(null)
    .map((_, idx) => currentRoundId - idx)

  const bestBlockCompressed = await thor.blocks.getBestBlockCompressed()
  const rounds = await executeMultipleClausesCall({
    thor,
    calls: roundsArray.map(
      round =>
        ({
          abi: xAllocationVotingabi,
          address: xAllocationVotingContractAddress,
          functionName: "getRound" as const,
          args: [BigInt(round)],
        }) as const,
    ),
  })

  return new Map(
    rounds.map((round, idx) => {
      const startBlock = round.voteStart
      const endBlock = round.voteStart + round.voteDuration

      return [
        roundsArray[idx],
        {
          startDate: blockNumberToDate(BigInt(startBlock), bestBlockCompressed),
          endDate: blockNumberToDate(BigInt(endBlock), bestBlockCompressed),
        },
      ]
    }),
  )
}

export const getRounds = async ({
  roundId,
  page = 1,
  pageSize = PAGE_SIZE,
}: {
  roundId?: number
  page?: number
  pageSize?: number
}): Promise<RoundsPageResponse> => {
  const thor = await getNodeJsThorClient()
  try {
    const currentRoundId = roundId || (await getCurrentRoundId())
    const startRoundId = currentRoundId - (page - 1) * pageSize
    const roundIds: number[] = []

    for (let i = 0; i < pageSize && startRoundId - i > 0; i++) {
      roundIds.push(startRoundId - i)
    }

    const earningsResults = await Promise.all(
      roundIds.map(roundId =>
        fetchClient
          .GET("/api/v1/b3tr/xallocations/earnings", {
            params: { query: { roundId } },
          })
          .then(data => data?.data?.[0]),
      ),
    )

    const roundsVote2EarnAmounts = await executeMultipleClausesCall({
      thor,
      calls: roundIds.map(
        round =>
          ({
            abi: emissionAbi,
            address: emissionsContractAddress,
            functionName: "getVote2EarnAmount" as const,
            args: [BigInt(round)],
          }) as const,
      ),
    })

    const roundsDatesMap = await getRoundsDates(thor)

    const roundsData: RoundEarnings[] = earningsResults
      .map((earnings, idx) => {
        if (!earnings) return null
        const roundId = roundIds[idx]!
        const { startDate: roundStart, endDate: roundEnd } = roundsDatesMap.get(roundId) || {}
        return {
          roundId,
          roundStart,
          roundEnd,
          vote2EarnAmount: roundsVote2EarnAmounts[idx],
          totalAmount: earnings.totalAmount || 0,
          unallocatedAmount: earnings.unallocatedAmount || 0,
          teamAllocationAmount: earnings.teamAllocationAmount || 0,
          rewardsAllocationAmount: earnings.rewardsAllocationAmount || 0,
        }
      })
      .filter((round): round is RoundEarnings => round !== null)

    return {
      data: roundsData,
      currentRoundId,
    }
  } catch (error) {
    console.error("Error fetching rounds:", error)
    return {
      data: [],
      currentRoundId: 0,
    }
  }
}

async function HistoryListContent({ pageNum }: { pageNum: number }) {
  const roundsResponse = await getRounds({ page: pageNum })
  const { data: rounds, currentRoundId } = roundsResponse

  return (
    <VStack alignItems="stretch" w="full" gap="4">
      <PageBreadcrumb items={BreadcrumItems} />
      <VStack alignItems="stretch" gap="3" w="full">
        {rounds.map(round => (
          <RoundHistoryCard key={`round-${round.roundId}`} round={round} />
        ))}
      </VStack>
      <Pagination.Root
        mx={{ base: "auto", md: "unset" }}
        count={currentRoundId}
        pageSize={PAGE_SIZE}
        page={pageNum}
        display="flex"
        alignItems="center"
        gap="4">
        <ButtonGroup variant="ghost" size="xs">
          <Pagination.PrevTrigger asChild>
            <Link href={`/allocations/history?page=${pageNum - 1}`}>
              <IconButton asChild>
                <LuChevronLeft />
              </IconButton>
            </Link>
          </Pagination.PrevTrigger>
          <Pagination.PageText format="compact" />
          <Pagination.NextTrigger asChild>
            <Link href={`/allocations/history?page=${pageNum + 1}`}>
              <IconButton asChild>
                <LuChevronRight />
              </IconButton>
            </Link>
          </Pagination.NextTrigger>
        </ButtonGroup>
      </Pagination.Root>
    </VStack>
  )
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParamsData = await searchParams
  const pageNum = Math.max(1, parseInt(String(searchParamsData.page || "1"), 10))

  return (
    <Suspense key={pageNum} fallback={<HistoryListSkeleton />}>
      <HistoryListContent pageNum={pageNum} />
    </Suspense>
  )
}
