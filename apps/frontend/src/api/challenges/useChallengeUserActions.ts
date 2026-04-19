import { useMemo } from "react"

import { useUsersB3trActions } from "../indexer/actions/useUsersB3trActions"

import { ChallengeDetail, ChallengeStatus } from "./types"
import { useChallengeWindow } from "./useChallengeWindow"

const PAGE_SIZE = 20

/**
 * Fetches a participant's B3TR actions scoped to the challenge's time window
 * and eligible apps. Uses infinite query pagination from the indexer.
 * When `allApps` is false, filters client-side by `selectedApps`.
 * Skips fetching entirely when the challenge hasn't started yet (Pending).
 */
export const useChallengeUserActions = (challenge: ChallengeDetail, address: string | undefined) => {
  const hasStarted = challenge.status !== ChallengeStatus.Pending
  const { after, before } = useChallengeWindow(challenge)

  const enabled = !!address && hasStarted && after !== undefined && before !== undefined

  const { data, isLoading, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage } = useUsersB3trActions(
    address ?? "",
    {
      after,
      before,
      direction: "DESC",
      size: PAGE_SIZE,
      ...(enabled ? {} : { enabled: false }),
    },
  )

  const actions = useMemo(() => {
    if (!hasStarted) return []
    const all = data?.pages.flatMap(page => page.data) ?? []
    if (challenge.allApps) return all
    const eligibleSet = new Set(challenge.selectedApps.map(a => a.toLowerCase()))
    return all.filter(action => eligibleSet.has(action.appId.toLowerCase()))
  }, [data?.pages, challenge.allApps, challenge.selectedApps, hasStarted])

  return {
    actions,
    isLoading: enabled && isLoading,
    isFetching,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    isFetchingNextPage,
  }
}
