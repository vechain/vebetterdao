import { useEffect, useMemo } from "react"

import { useUsersB3trActions } from "../indexer/actions/useUsersB3trActions"

import { ChallengeDetail, ChallengeStatus } from "./types"
import { useChallengeWindow } from "./useChallengeWindow"

const PAGE_SIZE = 20

/**
 * Fetches a participant's B3TR actions scoped to the challenge's time window
 * and eligible apps. Uses infinite query pagination from the indexer.
 *
 * When the challenge restricts to a single app we push `appId` to the indexer so
 * pagination is server-filtered (otherwise the first page can come back empty
 * if the user's most recent actions in the window are all on other apps and
 * client-side filtering discards them). For multi-app challenges the indexer
 * has no multi-appId filter, so we keep client-side filtering by `selectedApps`
 * and auto-paginate forward until we surface at least one matching action or
 * the indexer runs out of pages — the user only sees a "no actions" state once
 * the entire window has been scanned.
 *
 * Skips fetching entirely when the challenge hasn't started yet (Pending).
 */
export const useChallengeUserActions = (challenge: ChallengeDetail, address: string | undefined) => {
  const hasStarted = challenge.status !== ChallengeStatus.Pending
  const { after, before } = useChallengeWindow(challenge)

  const enabled = !!address && hasStarted && after !== undefined && before !== undefined

  // useChallengeWindow returns ms epoch; indexer expects Unix seconds.
  const afterSec = after !== undefined ? Math.floor(after / 1000) : undefined
  const beforeSec = before !== undefined ? Math.ceil(before / 1000) : undefined

  const serverAppId = !challenge.allApps && challenge.selectedApps.length === 1 ? challenge.selectedApps[0] : undefined
  const isMultiApp = !challenge.allApps && challenge.selectedApps.length > 1

  const { data, isLoading, isFetching, hasNextPage, fetchNextPage, isFetchingNextPage } = useUsersB3trActions(
    address ?? "",
    {
      appId: serverAppId,
      after: afterSec,
      before: beforeSec,
      direction: "DESC",
      size: PAGE_SIZE,
    },
    enabled,
  )

  const actions = useMemo(() => {
    if (!hasStarted) return []
    const all = data?.pages.flatMap(page => page.data) ?? []
    if (challenge.allApps || serverAppId) return all
    const eligibleSet = new Set(challenge.selectedApps.map(a => a.toLowerCase()))
    return all.filter(action => eligibleSet.has(action.appId.toLowerCase()))
  }, [data?.pages, challenge.allApps, challenge.selectedApps, hasStarted, serverAppId])

  // Multi-app: client-side filter can drop a whole page. Keep paging forward
  // until we surface at least one match or the indexer is exhausted.
  const shouldAutoPage = enabled && isMultiApp && actions.length === 0 && hasNextPage && !isFetchingNextPage
  useEffect(() => {
    if (shouldAutoPage) fetchNextPage()
  }, [shouldAutoPage, fetchNextPage])

  // While auto-paging, surface a loading state so the empty UI doesn't flash.
  const isAutoPaging = enabled && isMultiApp && actions.length === 0 && (hasNextPage || isFetchingNextPage)

  return {
    actions,
    isLoading: (enabled && isLoading) || isAutoPaging,
    isFetching,
    hasNextPage: hasNextPage ?? false,
    fetchNextPage,
    isFetchingNextPage,
  }
}
