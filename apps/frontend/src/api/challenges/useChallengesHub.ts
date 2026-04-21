import { useMemo } from "react"

import {
  mapIndexerChallengeDetail,
  mapIndexerChallengeView,
  mergeChallengeStatesById,
  usePublicChallengeDetails,
  usePublicChallengeSection,
  useUserChallengeStateSection,
} from "./indexerChallenges"
import { ChallengePhase, ChallengesHubData, PaginatedChallengeSection, UserChallengeListType } from "./types"

const EMPTY_SECTION: PaginatedChallengeSection = {
  items: [],
  hasNextPage: false,
  isLoading: false,
  isFetchingNextPage: false,
  fetchNextPage: async () => undefined,
}

const buildChallengeSection = ({
  items,
  hasNextPage,
  isLoading,
  isFetchingNextPage,
  fetchNextPage,
}: PaginatedChallengeSection): PaginatedChallengeSection => ({
  items,
  hasNextPage,
  isLoading,
  isFetchingNextPage,
  fetchNextPage,
})

export const useChallengesHub = (viewerAddress?: string) => {
  const upcomingQuery = usePublicChallengeSection(ChallengePhase.Upcoming)
  const liveQuery = usePublicChallengeSection(ChallengePhase.Live)

  const actionableQuery = useUserChallengeStateSection(UserChallengeListType.actionable, viewerAddress)
  const participatingQuery = useUserChallengeStateSection(UserChallengeListType.participating, viewerAddress)
  const historyQuery = useUserChallengeStateSection(UserChallengeListType.history, viewerAddress)

  const allWalletStates = useMemo(
    () =>
      [actionableQuery.data, participatingQuery.data, historyQuery.data].flatMap(
        query => query?.pages.flatMap(page => page.data) ?? [],
      ),
    [actionableQuery.data, historyQuery.data, participatingQuery.data],
  )

  const walletStateById = useMemo(() => mergeChallengeStatesById(allWalletStates), [allWalletStates])
  const walletChallengeIds = useMemo(() => Array.from(walletStateById.keys()), [walletStateById])
  const walletChallengeQueries = usePublicChallengeDetails(walletChallengeIds)

  const walletChallengeDetailsById = useMemo(() => {
    const detailById = new Map<number, NonNullable<(typeof walletChallengeQueries)[number]["data"]>>()

    walletChallengeQueries.forEach((query, index) => {
      if (!query.data) return
      const challengeId = walletChallengeIds[index]
      if (challengeId === undefined) return
      detailById.set(challengeId, query.data)
    })

    return detailById
  }, [walletChallengeIds, walletChallengeQueries])

  const walletDetailError = walletChallengeQueries.find(query => query.error)?.error ?? null
  const isWalletDetailLoading = walletChallengeQueries.some(query => query.isLoading)
  const isWalletDetailFetchingNextPage = walletChallengeQueries.some(query => query.isFetching)
  const isWalletDetailError = walletChallengeQueries.some(query => query.isError)

  const buildWalletSection = (
    query: typeof actionableQuery | typeof participatingQuery | typeof historyQuery,
  ): PaginatedChallengeSection => {
    const states = query.data?.pages.flatMap(page => page.data) ?? []
    const items = states
      .map(state => {
        const detail = walletChallengeDetailsById.get(state.challengeId)
        if (!detail) return null
        return mapIndexerChallengeDetail(detail, viewerAddress, state)
      })
      .filter(item => item !== null)

    return buildChallengeSection({
      items,
      hasNextPage: !!query.hasNextPage,
      isLoading: query.isLoading || isWalletDetailLoading,
      isFetchingNextPage: query.isFetchingNextPage || isWalletDetailFetchingNextPage,
      fetchNextPage: query.fetchNextPage,
    })
  }

  const relevantChallengeIds = walletStateById

  const buildPublicSection = (query: typeof upcomingQuery | typeof liveQuery): PaginatedChallengeSection => {
    const items =
      query.data?.pages
        .flatMap(page => page.data)
        .filter(challenge => !viewerAddress || !relevantChallengeIds.has(challenge.challengeId))
        .map(challenge => mapIndexerChallengeView(challenge, viewerAddress)) ?? []

    return buildChallengeSection({
      items,
      hasNextPage: !!query.hasNextPage,
      isLoading:
        query.isLoading ||
        (!!viewerAddress && (actionableQuery.isLoading || participatingQuery.isLoading || historyQuery.isLoading)),
      isFetchingNextPage: query.isFetchingNextPage,
      fetchNextPage: query.fetchNextPage,
    })
  }

  const data = useMemo<ChallengesHubData>(
    () => ({
      neededActions: buildWalletSection(actionableQuery),
      active: buildWalletSection(participatingQuery),
      open: buildPublicSection(upcomingQuery),
      explore: buildPublicSection(liveQuery),
      history: buildWalletSection(historyQuery),
    }),
    [
      actionableQuery,
      historyQuery,
      liveQuery,
      participatingQuery,
      upcomingQuery,
      viewerAddress,
      walletChallengeDetailsById,
    ],
  )

  return {
    data: viewerAddress
      ? data
      : {
          neededActions: EMPTY_SECTION,
          active: EMPTY_SECTION,
          open: data.open,
          explore: data.explore,
          history: EMPTY_SECTION,
        },
    isLoading: viewerAddress
      ? Object.values(data).some(section => section.isLoading)
      : data.open.isLoading || data.explore.isLoading,
    isError:
      upcomingQuery.isError ||
      liveQuery.isError ||
      isWalletDetailError ||
      (viewerAddress ? actionableQuery.isError || participatingQuery.isError || historyQuery.isError : false),
    error:
      upcomingQuery.error ??
      liveQuery.error ??
      walletDetailError ??
      (viewerAddress ? (actionableQuery.error ?? participatingQuery.error ?? historyQuery.error) : null) ??
      null,
  }
}
