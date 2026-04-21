import { useMemo } from "react"

import { mapIndexerChallengeView, usePublicChallengeSection, useWalletChallenges } from "./indexerChallenges"
import { ChallengePhase, ChallengesHubData, PaginatedChallengeSection } from "./types"

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
  const walletChallengesQuery = useWalletChallenges(viewerAddress)

  const buildWalletSection = (
    predicate: (item: (typeof walletChallengesQuery.items)[number]) => boolean,
  ): PaginatedChallengeSection => {
    const items = walletChallengesQuery.items.filter(predicate)

    return buildChallengeSection({
      items,
      hasNextPage: walletChallengesQuery.hasNextPage,
      isLoading: walletChallengesQuery.isLoading,
      isFetchingNextPage: walletChallengesQuery.isFetchingNextPage,
      fetchNextPage: walletChallengesQuery.fetchNextPage,
    })
  }

  const buildPublicSection = (query: typeof upcomingQuery | typeof liveQuery): PaginatedChallengeSection => {
    const items =
      query.data?.pages
        .flatMap(page => page.data)
        .filter(
          challenge =>
            !viewerAddress || !walletChallengesQuery.refs.some(ref => ref.challengeId === challenge.challengeId),
        )
        .map(challenge => mapIndexerChallengeView(challenge, viewerAddress)) ?? []

    return buildChallengeSection({
      items,
      hasNextPage: !!query.hasNextPage,
      isLoading: query.isLoading || (!!viewerAddress && walletChallengesQuery.isLoading),
      isFetchingNextPage: query.isFetchingNextPage,
      fetchNextPage: query.fetchNextPage,
    })
  }

  const data = useMemo<ChallengesHubData>(
    () => ({
      neededActions: buildWalletSection(item => item.isActionable),
      active: buildWalletSection(item => item.isParticipating),
      open: buildPublicSection(upcomingQuery),
      explore: buildPublicSection(liveQuery),
      history: buildWalletSection(item => item.isHistorical),
    }),
    [liveQuery, upcomingQuery, viewerAddress, walletChallengesQuery],
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
    isError: upcomingQuery.isError || liveQuery.isError || (viewerAddress ? walletChallengesQuery.isError : false),
    error: upcomingQuery.error ?? liveQuery.error ?? (viewerAddress ? walletChallengesQuery.error : null) ?? null,
  }
}
