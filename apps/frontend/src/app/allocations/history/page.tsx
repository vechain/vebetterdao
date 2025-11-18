import { ButtonGroup, IconButton, Pagination, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { ThorClient, executeCallClause, executeMultipleClausesCall } from "@vechain/vechain-kit"
import Link from "next/link"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"

import { fetchClient } from "@/api/indexer/api"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"
import { blockNumberToDate } from "@/utils/date"
import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

import { RoundHistoryCard } from "../components/tabs/round-info/RoundHistoryCard"
import { getCurrentRoundId } from "../lib/data"

const abi = XAllocationVoting__factory.abi
const contractAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

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

export interface RoundEarnings {
  roundId: number
  roundStart: Date
  roundEnd: Date
  totalAmount: string
  unallocatedAmount: string
  teamAllocationAmount: string
  rewardsAllocationAmount: string
}

interface RoundsPageResponse {
  data: RoundEarnings[]
  currentRoundId: number
}

export const getRoundsDates = async (thor: ThorClient) => {
  const [currentRound] = await executeCallClause({
    thor,
    abi,
    contractAddress,
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
          abi,
          address: contractAddress,
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
            cache: "no-cache",
            params: { query: { roundId } },
          })
          .then(data => data?.data?.[0]),
      ),
    )

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
          totalAmount: earnings.totalAmount?.toString() || "0",
          unallocatedAmount: earnings.unallocatedAmount?.toString() || "0",
          teamAllocationAmount: earnings.teamAllocationAmount?.toString() || "0",
          rewardsAllocationAmount: earnings.rewardsAllocationAmount?.toString() || "0",
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

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParamsData = await searchParams
  const pageNum = Math.max(1, parseInt(String(searchParamsData.page || "1"), 10))

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
