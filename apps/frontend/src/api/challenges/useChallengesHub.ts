import { useMemo } from "react"

import { useChallengeSection } from "./indexerChallenges"
import { ChallengesHubData, PaginatedChallengeSection } from "./types"

const EMPTY_SECTION: PaginatedChallengeSection = {
  items: [],
  hasNextPage: false,
  isLoading: false,
  isFetchingNextPage: false,
  fetchNextPage: async () => undefined,
}

export const useChallengesHub = (viewerAddress?: string) => {
  const neededActionsQuery = useChallengeSection("needed-actions", viewerAddress)
  const activeQuery = useChallengeSection("active", viewerAddress)
  const openQuery = useChallengeSection("open", viewerAddress)
  const exploreQuery = useChallengeSection("explore", viewerAddress)
  const historyQuery = useChallengeSection("history", viewerAddress)

  const data = useMemo<ChallengesHubData>(
    () => ({
      neededActions: {
        items: neededActionsQuery.data?.pages.flatMap(page => page.data) ?? [],
        hasNextPage: !!neededActionsQuery.hasNextPage,
        isLoading: neededActionsQuery.isLoading,
        isFetchingNextPage: neededActionsQuery.isFetchingNextPage,
        fetchNextPage: neededActionsQuery.fetchNextPage,
      },
      active: {
        items: activeQuery.data?.pages.flatMap(page => page.data) ?? [],
        hasNextPage: !!activeQuery.hasNextPage,
        isLoading: activeQuery.isLoading,
        isFetchingNextPage: activeQuery.isFetchingNextPage,
        fetchNextPage: activeQuery.fetchNextPage,
      },
      open: {
        items: openQuery.data?.pages.flatMap(page => page.data) ?? [],
        hasNextPage: !!openQuery.hasNextPage,
        isLoading: openQuery.isLoading,
        isFetchingNextPage: openQuery.isFetchingNextPage,
        fetchNextPage: openQuery.fetchNextPage,
      },
      explore: {
        items: exploreQuery.data?.pages.flatMap(page => page.data) ?? [],
        hasNextPage: !!exploreQuery.hasNextPage,
        isLoading: exploreQuery.isLoading,
        isFetchingNextPage: exploreQuery.isFetchingNextPage,
        fetchNextPage: exploreQuery.fetchNextPage,
      },
      history: {
        items: historyQuery.data?.pages.flatMap(page => page.data) ?? [],
        hasNextPage: !!historyQuery.hasNextPage,
        isLoading: historyQuery.isLoading,
        isFetchingNextPage: historyQuery.isFetchingNextPage,
        fetchNextPage: historyQuery.fetchNextPage,
      },
    }),
    [
      activeQuery.data,
      activeQuery.fetchNextPage,
      activeQuery.hasNextPage,
      activeQuery.isFetchingNextPage,
      activeQuery.isLoading,
      exploreQuery.data,
      exploreQuery.fetchNextPage,
      exploreQuery.hasNextPage,
      exploreQuery.isFetchingNextPage,
      exploreQuery.isLoading,
      historyQuery.data,
      historyQuery.fetchNextPage,
      historyQuery.hasNextPage,
      historyQuery.isFetchingNextPage,
      historyQuery.isLoading,
      neededActionsQuery.data,
      neededActionsQuery.fetchNextPage,
      neededActionsQuery.hasNextPage,
      neededActionsQuery.isFetchingNextPage,
      neededActionsQuery.isLoading,
      openQuery.data,
      openQuery.fetchNextPage,
      openQuery.hasNextPage,
      openQuery.isFetchingNextPage,
      openQuery.isLoading,
    ],
  )

  return {
    data: viewerAddress
      ? data
      : {
          neededActions: EMPTY_SECTION,
          active: EMPTY_SECTION,
          open: EMPTY_SECTION,
          explore: EMPTY_SECTION,
          history: EMPTY_SECTION,
        },
    isLoading: viewerAddress ? Object.values(data).some(section => section.isLoading) : false,
    isError:
      neededActionsQuery.isError ||
      activeQuery.isError ||
      openQuery.isError ||
      exploreQuery.isError ||
      historyQuery.isError,
    error:
      neededActionsQuery.error ??
      activeQuery.error ??
      openQuery.error ??
      exploreQuery.error ??
      historyQuery.error ??
      null,
  }
}
