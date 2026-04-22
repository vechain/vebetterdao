import { QueryClient } from "@tanstack/react-query"
import { ThorClient } from "@vechain/sdk-network"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall } from "@vechain/vechain-kit"

import { ChallengeStatus, ChallengeVisibility } from "../../types"
import { ChallengePage, ChallengesDataSource } from "../ChallengesDataSource"

import { buildChallengeDetail } from "./buildChallengeDetail"
import { buildChallengeViews } from "./buildChallengeView"
import { fetchViewerClaimState, ViewerClaimState } from "./claimState"
import { fetchAllChallengeCreatedSummaries, fetchViewerChallengeIds, ViewerChallengeIds } from "./fetchChallengeIds"

const abi = B3TRChallenges__factory.abi

export interface EventsDataSourceParams {
  thor: ThorClient
  queryClient: QueryClient
  contractAddress: string
  fromBlock: number
  currentRound: number
}

const wrapSinglePage = (data: ChallengePage["data"]): ChallengePage => ({
  data,
  pagination: { hasNext: false, cursor: null },
})

const isActiveOrPending = (status: ChallengeStatus) =>
  status === ChallengeStatus.Pending || status === ChallengeStatus.Active

const fetchMaxParticipants = async (thor: ThorClient, contractAddress: string): Promise<number> => {
  const address = contractAddress as `0x${string}`
  const [value] = (await executeMultipleClausesCall({
    thor,
    calls: [{ abi, address, functionName: "maxParticipants" as const, args: [] as const }],
  })) as [bigint]
  return Number(value ?? 0n)
}

/**
 * Event-based implementation of ChallengesDataSource.
 * No actual pagination — returns all matching items in a single page with hasNext=false.
 * Swap with an indexer-backed impl when endpoints become available.
 */
export const createEventsChallengesDataSource = (params: EventsDataSourceParams): ChallengesDataSource => {
  const { thor, queryClient, contractAddress, fromBlock, currentRound } = params

  const resolveViewerContext = async (
    viewer: string,
  ): Promise<{ ids: ViewerChallengeIds; claimed: ViewerClaimState }> => {
    const [ids, claimed] = await Promise.all([
      fetchViewerChallengeIds({ thor, queryClient, contractAddress, fromBlock, viewer }),
      fetchViewerClaimState({ thor, queryClient, contractAddress, fromBlock, viewer }),
    ])
    return { ids, claimed }
  }

  const buildViewerViews = async (
    challengeIds: number[],
    viewer: string,
    context: Awaited<ReturnType<typeof resolveViewerContext>>,
    createdAtById: Map<number, number>,
    maxParticipants: number,
  ) =>
    buildChallengeViews({
      thor,
      contractAddress,
      challengeIds,
      viewer,
      currentRound,
      createdAtById,
      claimed: context.claimed,
      maxParticipants,
    })

  return {
    async getNeededActions(viewer) {
      const [context, maxParticipants] = await Promise.all([
        resolveViewerContext(viewer),
        fetchMaxParticipants(thor, contractAddress),
      ])

      const relatedIds = new Set<number>([
        ...context.ids.createdIds,
        ...context.ids.joinedIds,
        ...context.ids.invitedIds,
        ...context.ids.declinedIds,
      ])
      const createdAtById = new Map<number, number>()
      context.ids.createdSummaries.forEach((s, id) => createdAtById.set(id, s.createdAt))

      const views = await buildViewerViews([...relatedIds], viewer, context, createdAtById, maxParticipants)
      return wrapSinglePage(views.filter(v => v.isActionable))
    },

    async getUserChallenges(viewer) {
      const [context, maxParticipants] = await Promise.all([
        resolveViewerContext(viewer),
        fetchMaxParticipants(thor, contractAddress),
      ])

      // Include every id the viewer ever created or joined. The predicate below
      // (`v.isJoined || v.isCreator`) naturally excludes challenges the viewer
      // left and has not re-joined (on-chain `getParticipantStatus` → None).
      const ids = new Set<number>([...context.ids.createdIds, ...context.ids.joinedIds])

      const createdAtById = new Map<number, number>()
      context.ids.createdSummaries.forEach((s, id) => createdAtById.set(id, s.createdAt))

      const views = await buildViewerViews([...ids], viewer, context, createdAtById, maxParticipants)
      return wrapSinglePage(views.filter(v => isActiveOrPending(v.status) && (v.isCreator || v.isJoined)))
    },

    async getOpenToJoin(viewer) {
      const [summaries, maxParticipants] = await Promise.all([
        fetchAllChallengeCreatedSummaries({ thor, queryClient, contractAddress, fromBlock }),
        fetchMaxParticipants(thor, contractAddress),
      ])

      const context = viewer ? await resolveViewerContext(viewer) : null
      const createdAtById = new Map<number, number>(summaries.map(s => [s.challengeId, s.createdAt]))

      const ids = summaries.map(s => s.challengeId)
      const views = await buildChallengeViews({
        thor,
        contractAddress,
        challengeIds: ids,
        viewer,
        currentRound,
        createdAtById,
        claimed: context?.claimed ?? null,
        maxParticipants,
      })

      return wrapSinglePage(
        views.filter(
          v => v.status === ChallengeStatus.Pending && v.visibility === ChallengeVisibility.Public && v.canJoin,
        ),
      )
    },

    async getWhatOthersAreDoing(viewer) {
      const [summaries, maxParticipants] = await Promise.all([
        fetchAllChallengeCreatedSummaries({ thor, queryClient, contractAddress, fromBlock }),
        fetchMaxParticipants(thor, contractAddress),
      ])

      const context = viewer ? await resolveViewerContext(viewer) : null
      const createdAtById = new Map<number, number>(summaries.map(s => [s.challengeId, s.createdAt]))

      const ids = summaries.map(s => s.challengeId)
      const views = await buildChallengeViews({
        thor,
        contractAddress,
        challengeIds: ids,
        viewer,
        currentRound,
        createdAtById,
        claimed: context?.claimed ?? null,
        maxParticipants,
      })

      return wrapSinglePage(
        views.filter(
          v =>
            v.status === ChallengeStatus.Active &&
            v.visibility === ChallengeVisibility.Public &&
            !v.isCreator &&
            !v.isJoined,
        ),
      )
    },

    async getHistory(viewer) {
      const [context, maxParticipants] = await Promise.all([
        resolveViewerContext(viewer),
        fetchMaxParticipants(thor, contractAddress),
      ])

      const ids = new Set<number>([
        ...context.ids.createdIds,
        ...context.ids.joinedIds,
        ...context.ids.invitedIds,
        ...context.ids.declinedIds,
        ...context.ids.leftIds,
      ])
      const createdAtById = new Map<number, number>()
      context.ids.createdSummaries.forEach((s, id) => createdAtById.set(id, s.createdAt))

      const views = await buildViewerViews([...ids], viewer, context, createdAtById, maxParticipants)
      // Leave+decline chaining in useChallengeActions makes invited leavers land as
      // Declined (picked up by isHistorical). The leftIds fallback covers terminal
      // cases (Active/Completed/Cancelled) where canAccept is false and isHistorical
      // alone would miss them.
      return wrapSinglePage(
        views.filter(v => v.isHistorical || (context.ids.leftIds.has(v.challengeId) && !v.isJoined)),
      )
    },

    async getChallengeDetail(id, viewer) {
      const maxParticipants = await fetchMaxParticipants(thor, contractAddress)
      return buildChallengeDetail({
        thor,
        queryClient,
        contractAddress,
        fromBlock,
        challengeId: id,
        viewer,
        currentRound,
        maxParticipants,
      })
    },
  }
}
