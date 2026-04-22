import { QueryClient } from "@tanstack/react-query"
import { ThorClient } from "@vechain/sdk-network"

import { fetchChallengeEvents } from "./fetchChallengeEvents"

interface FetchParams {
  thor: ThorClient
  queryClient: QueryClient
  contractAddress: string
  fromBlock: number
}

interface ChallengeCreatedSummary {
  challengeId: number
  creator: string
  createdAt: number
  blockNumber: number
}

/**
 * Scans all `ChallengeCreated` events and returns a normalised summary per challenge.
 * Used by the public-list sections (Open to join, What others are doing).
 */
export const fetchAllChallengeCreatedSummaries = async (params: FetchParams): Promise<ChallengeCreatedSummary[]> => {
  const events = await fetchChallengeEvents({
    ...params,
    eventName: "ChallengeCreated",
  })

  return events.map(e => {
    const args = e.decodedData.args as { challengeId: bigint; creator: string }
    return {
      challengeId: Number(args.challengeId),
      creator: args.creator,
      createdAt: e.meta.blockTimestamp,
      blockNumber: e.meta.blockNumber,
    }
  })
}

/**
 * Aggregates the challenge ids the viewer is related to across event topics.
 * A single pass fills multiple sets so every section can derive what it needs
 * without re-scanning events.
 */
export const fetchViewerChallengeIds = async (params: FetchParams & { viewer: string }) => {
  const { viewer } = params
  const [created, joined, invited, declined, left] = await Promise.all([
    fetchChallengeEvents({
      ...params,
      eventName: "ChallengeCreated",
      filterParams: { creator: viewer } as never,
    }),
    fetchChallengeEvents({
      ...params,
      eventName: "ChallengeJoined",
      filterParams: { participant: viewer } as never,
    }),
    fetchChallengeEvents({
      ...params,
      eventName: "ChallengeInviteAdded",
      filterParams: { invitee: viewer } as never,
    }),
    fetchChallengeEvents({
      ...params,
      eventName: "ChallengeDeclined",
      filterParams: { participant: viewer } as never,
    }),
    fetchChallengeEvents({
      ...params,
      eventName: "ChallengeLeft",
      filterParams: { participant: viewer } as never,
    }),
  ])

  const pickIds = (events: { decodedData: { args: unknown } }[]) =>
    events.map(e => Number((e.decodedData.args as { challengeId: bigint }).challengeId))

  const createdMap = new Map<number, ChallengeCreatedSummary>()
  for (const e of created) {
    const args = e.decodedData.args as { challengeId: bigint; creator: string }
    createdMap.set(Number(args.challengeId), {
      challengeId: Number(args.challengeId),
      creator: args.creator,
      createdAt: e.meta.blockTimestamp,
      blockNumber: e.meta.blockNumber,
    })
  }

  return {
    createdSummaries: createdMap,
    createdIds: new Set(createdMap.keys()),
    joinedIds: new Set(pickIds(joined)),
    invitedIds: new Set(pickIds(invited)),
    declinedIds: new Set(pickIds(declined)),
    leftIds: new Set(pickIds(left)),
  }
}

export type ViewerChallengeIds = Awaited<ReturnType<typeof fetchViewerChallengeIds>>
