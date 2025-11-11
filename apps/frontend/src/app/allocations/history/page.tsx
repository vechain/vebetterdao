import { ButtonGroup, IconButton, Pagination, VStack } from "@chakra-ui/react"
import { getConfig } from "@repo/config"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/factories/XAllocationVoting__factory"
import { executeCallClause } from "@vechain/vechain-kit"
import Link from "next/link"
import { LuChevronLeft, LuChevronRight } from "react-icons/lu"

import { fetchClient } from "@/api/indexer/api"
import { PageBreadcrumb } from "@/app/components/PageBreadcrumb/PageBreadcrumb"
import { getNodeJsThorClient } from "@/utils/getNodeJsThorClient"

import { RoundHistoryCard } from "../components/tabs/round-info/RoundHistoryCard"

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

const xAllocationVotingAbi = XAllocationVoting__factory.abi
const xAllocationVotingAddress = getConfig().xAllocationVotingContractAddress as `0x${string}`

export const getCurrentRoundId = async () => {
  const thor = await getNodeJsThorClient()
  const [currentRoundId] = await executeCallClause({
    thor,
    abi: xAllocationVotingAbi,
    contractAddress: xAllocationVotingAddress,
    method: "currentRoundId",
    args: [],
  })
  return Number(currentRoundId)
}

const PAGE_SIZE = 10

export interface RoundEarnings {
  roundId: number
  totalAmount: string
  unallocatedAmount: string
  teamAllocationAmount: string
  rewardsAllocationAmount: string
}

interface RoundsPageResponse {
  data: RoundEarnings[]
  currentRoundId: number
}

export const getRounds = async (page = 1): Promise<RoundsPageResponse> => {
  try {
    const currentRoundId = await getCurrentRoundId()
    const startRoundId = currentRoundId - (page - 1) * PAGE_SIZE
    const roundIds: number[] = []

    for (let i = 0; i < PAGE_SIZE && startRoundId - i > 0; i++) {
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

    const roundsData: RoundEarnings[] = earningsResults
      .map((earnings, idx) => {
        if (!earnings) return null
        return {
          roundId: roundIds[idx],
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

  const roundsResponse = await getRounds(pageNum)
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
                <button>
                  <LuChevronLeft />
                </button>
              </IconButton>
            </Link>
          </Pagination.PrevTrigger>
          <Pagination.PageText format="compact" />
          <Pagination.NextTrigger asChild>
            <Link href={`/allocations/history?page=${pageNum + 1}`}>
              <IconButton asChild>
                <button>
                  <LuChevronRight />
                </button>
              </IconButton>
            </Link>
          </Pagination.NextTrigger>
        </ButtonGroup>
      </Pagination.Root>
    </VStack>
  )
}
