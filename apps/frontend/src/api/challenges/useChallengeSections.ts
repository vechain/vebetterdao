import { getConfig } from "@repo/config"
import { QueryClient, useInfiniteQuery, useQueryClient } from "@tanstack/react-query"
import { ThorClient } from "@vechain/sdk-network"
import { useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

import { useCurrentAllocationsRoundId } from "@/api/contracts/xAllocations/hooks/useCurrentAllocationsRoundId"
import {
  fetchPublicChallenges,
  fetchWalletChallenges,
  IndexerChallengeFilter,
  IndexerChallengeStatus,
  IndexerChallengeSummary,
  IndexerPaginatedResponse,
} from "@/api/indexer/challenges"
import { useChallengesDeployBlock } from "@/hooks/useChallengesDeployBlock"

import { buildChallengeViews } from "./buildChallengeView"
import { fetchViewerClaimState, ViewerClaimState } from "./claimState"
import { fetchMaxParticipants } from "./fetchMaxParticipants"
import { ChallengeStatus, ChallengeView } from "./types"

export const CHALLENGES_PAGE_SIZE = 12 as const

type SectionId = "neededActions" | "userChallenges" | "openToJoin" | "whatOthersAreDoing" | "history"

interface SectionPage {
  data: ChallengeView[]
  hasNext: boolean
}

export const getChallengeSectionQueryKey = (section: SectionId, viewer?: string) =>
  ["challenges", "section", section, viewer ?? "guest"] as const

interface BuildSectionPageParams {
  thor: ThorClient
  queryClient: QueryClient
  contractAddress: string
  fromBlock: number
  currentRound: number
  viewer?: string
  response: IndexerPaginatedResponse<IndexerChallengeSummary>
}

/**
 * Enriches an indexer paginated response with per-viewer `canX` flags by running
 * a single batched contract multicall (+ an optional viewer-scoped claim event
 * scan for `canClaim` / `canRefund`) over the returned challenge ids.
 */
const buildSectionPage = async ({
  thor,
  queryClient,
  contractAddress,
  fromBlock,
  currentRound,
  viewer,
  response,
}: BuildSectionPageParams): Promise<SectionPage> => {
  const challengeIds = response.data.map(d => d.challengeId)
  const createdAtById = new Map(response.data.map(d => [d.challengeId, d.createdAt]))

  const [claimed, maxParticipants] = await Promise.all([
    viewer
      ? fetchViewerClaimState({ thor, queryClient, contractAddress, fromBlock, viewer })
      : Promise.resolve<ViewerClaimState | null>(null),
    fetchMaxParticipants(thor, contractAddress, queryClient),
  ])

  const views = await buildChallengeViews({
    thor,
    contractAddress,
    challengeIds,
    viewer,
    currentRound,
    createdAtById,
    claimed,
    maxParticipants,
  })

  return { data: views, hasNext: response.pagination.hasNext }
}

interface UseInfiniteSectionDeps {
  thor: ThorClient
  queryClient: QueryClient
  contractAddress: string
  fromBlock: number
  currentRound: number
}

const useSectionQuery = (
  section: SectionId,
  viewer: string | undefined,
  deps: UseInfiniteSectionDeps | null,
  fetchIndexerPage: ((page: number) => Promise<IndexerPaginatedResponse<IndexerChallengeSummary>>) | null,
) => {
  const query = useInfiniteQuery({
    queryKey: getChallengeSectionQueryKey(section, viewer),
    queryFn: async ({ pageParam }) => {
      const response = await fetchIndexerPage!(pageParam as number)
      return buildSectionPage({ ...deps!, viewer, response })
    },
    enabled: !!deps && !!fetchIndexerPage,
    initialPageParam: 0,
    getNextPageParam: (last, _all, lastParam) => (last.hasNext ? (lastParam as number) + 1 : undefined),
  })

  const items = useMemo<ChallengeView[]>(() => query.data?.pages.flatMap(p => p.data) ?? [], [query.data])

  return {
    items,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !!query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isError: query.isError,
    error: query.error,
  }
}

const useSectionDeps = (): UseInfiniteSectionDeps | null => {
  const thor = useThor()
  const queryClient = useQueryClient()
  const fromBlock = useChallengesDeployBlock()
  const { data: currentRoundRaw } = useCurrentAllocationsRoundId()
  const contractAddress = getConfig().challengesContractAddress
  const currentRound = currentRoundRaw !== undefined ? Number(currentRoundRaw) : undefined

  return useMemo(() => {
    if (!thor || currentRound === undefined) return null
    return { thor, queryClient, contractAddress, fromBlock, currentRound }
  }, [thor, queryClient, contractAddress, fromBlock, currentRound])
}

const walletSectionFetcher = (viewer: string, filter: IndexerChallengeFilter) => (page: number) =>
  fetchWalletChallenges({ viewer, filter, page, size: CHALLENGES_PAGE_SIZE })

const publicSectionFetcher = (status: IndexerChallengeStatus) => (page: number) =>
  fetchPublicChallenges({ status, page, size: CHALLENGES_PAGE_SIZE })

const isActiveChallengeWindowOpen = (challenge: ChallengeView, currentRound: number) =>
  challenge.status !== ChallengeStatus.Active || challenge.endRound >= currentRound

export const useNeededActionsSection = (viewer?: string) => {
  const deps = useSectionDeps()
  const fetcher = viewer ? walletSectionFetcher(viewer, "NeededAction") : null
  return useSectionQuery("neededActions", viewer, deps, fetcher)
}

export const useUserChallengesSection = (viewer?: string) => {
  const deps = useSectionDeps()
  const fetcher = viewer ? walletSectionFetcher(viewer, "MyChallenges") : null
  return useSectionQuery("userChallenges", viewer, deps, fetcher)
}

export const useOpenToJoinSection = (viewer?: string) => {
  const deps = useSectionDeps()
  const fetcher = viewer ? walletSectionFetcher(viewer, "OpenToJoin") : publicSectionFetcher("Pending")
  return useSectionQuery("openToJoin", viewer, deps, fetcher)
}

export const useWhatOthersAreDoingSection = (viewer?: string) => {
  const deps = useSectionDeps()
  const fetcher = viewer ? walletSectionFetcher(viewer, "OthersActive") : publicSectionFetcher("Active")
  const section = useSectionQuery("whatOthersAreDoing", viewer, deps, fetcher)
  const items = useMemo(
    () =>
      deps
        ? section.items.filter(challenge => isActiveChallengeWindowOpen(challenge, deps.currentRound))
        : section.items,
    [deps, section.items],
  )

  return { ...section, items }
}

export const useHistorySection = (viewer?: string) => {
  const deps = useSectionDeps()
  const fetcher = viewer ? walletSectionFetcher(viewer, "History") : null
  return useSectionQuery("history", viewer, deps, fetcher)
}

export type ChallengeSectionResult = ReturnType<typeof useSectionQuery>
