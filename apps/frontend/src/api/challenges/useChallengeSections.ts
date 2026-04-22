import { useInfiniteQuery } from "@tanstack/react-query"
import { useMemo } from "react"

import { CHALLENGES_PAGE_SIZE, ChallengePage } from "./datasource/ChallengesDataSource"
import { useChallengesDataSource } from "./datasource/useChallengesDataSource"
import { ChallengeView } from "./types"

type SectionId = "neededActions" | "userChallenges" | "openToJoin" | "whatOthersAreDoing" | "history"

export const getChallengeSectionQueryKey = (section: SectionId, viewer?: string) =>
  ["challenges", "section", section, viewer ?? "guest"] as const

const useInfiniteSection = (
  section: SectionId,
  viewer: string | undefined,
  fetcher: ((pageParam: number) => Promise<ChallengePage>) | null,
) => {
  const query = useInfiniteQuery({
    queryKey: getChallengeSectionQueryKey(section, viewer),
    queryFn: ({ pageParam }) => fetcher!(pageParam as number),
    enabled: !!fetcher,
    initialPageParam: 0,
    getNextPageParam: (last, _all, lastParam) => (last.pagination.hasNext ? (lastParam as number) + 1 : undefined),
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

export const useNeededActionsSection = (viewer?: string) => {
  const ds = useChallengesDataSource()
  const fetcher =
    ds && viewer ? (page: number) => ds.getNeededActions(viewer, { page, size: CHALLENGES_PAGE_SIZE }) : null
  return useInfiniteSection("neededActions", viewer, fetcher)
}

export const useUserChallengesSection = (viewer?: string) => {
  const ds = useChallengesDataSource()
  const fetcher =
    ds && viewer ? (page: number) => ds.getUserChallenges(viewer, { page, size: CHALLENGES_PAGE_SIZE }) : null
  return useInfiniteSection("userChallenges", viewer, fetcher)
}

export const useOpenToJoinSection = (viewer?: string) => {
  const ds = useChallengesDataSource()
  const fetcher = ds ? (page: number) => ds.getOpenToJoin(viewer, { page, size: CHALLENGES_PAGE_SIZE }) : null
  return useInfiniteSection("openToJoin", viewer, fetcher)
}

export const useWhatOthersAreDoingSection = (viewer?: string) => {
  const ds = useChallengesDataSource()
  const fetcher = ds ? (page: number) => ds.getWhatOthersAreDoing(viewer, { page, size: CHALLENGES_PAGE_SIZE }) : null
  return useInfiniteSection("whatOthersAreDoing", viewer, fetcher)
}

export const useHistorySection = (viewer?: string) => {
  const ds = useChallengesDataSource()
  const fetcher = ds && viewer ? (page: number) => ds.getHistory(viewer, { page, size: CHALLENGES_PAGE_SIZE }) : null
  return useInfiniteSection("history", viewer, fetcher)
}

export type ChallengeSectionResult = ReturnType<typeof useInfiniteSection>
