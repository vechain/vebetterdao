import { getConfig } from "@repo/config"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { B3TRChallenges__factory } from "@vechain/vebetterdao-contracts/typechain-types"
import { executeMultipleClausesCall, useThor } from "@vechain/vechain-kit"
import { useMemo } from "react"

const abi = B3TRChallenges__factory.abi as any
const address = getConfig().challengesContractAddress as `0x${string}`
const ZERO_ADDR = "0x0000000000000000000000000000000000000000"

// Kept small to stay well below the Thor node request-body size limit even when
// each call's ABI payload is wide; the UI surfaces it as "Load more" pages.
export const PARTICIPANT_ACTIONS_PAGE_SIZE = 50

export type ChallengeParticipantActionsEntry = {
  participant: string
  actions: number
  position: number
}

export type ChallengeParticipantActionRequest = {
  challengeId: number
  participant: string
}

type Page = {
  items: { participant: string; actions: number }[]
  nextOffset: number | undefined
}

export const getChallengeParticipantActionsQueryKey = (challengeId: number, totalParticipants: number) => [
  "challenges",
  "participant-actions",
  challengeId,
  totalParticipants,
]

export const getChallengeParticipantActionRequestKey = ({
  challengeId,
  participant,
}: ChallengeParticipantActionRequest) => `${challengeId}:${participant.toLowerCase()}`

export const getChallengeParticipantActionsBatchQueryKey = (entries: ChallengeParticipantActionRequest[]) => [
  "challenges",
  "participant-actions",
  "batch",
  ...entries.map(getChallengeParticipantActionRequestKey),
]

const toBigIntValue = (value: unknown) => {
  if (typeof value === "bigint") return value
  if (typeof value === "number" || typeof value === "string") return BigInt(value)
  return 0n
}

export const useChallengeParticipantActions = (challengeId: number, participants: string[]) => {
  const thor = useThor()
  const total = participants.length
  const contractOk = !!address && address.toLowerCase() !== ZERO_ADDR

  const query = useInfiniteQuery({
    queryKey: getChallengeParticipantActionsQueryKey(challengeId, total),
    queryFn: async ({ pageParam }): Promise<Page> => {
      const offset = pageParam as number
      const slice = participants.slice(offset, offset + PARTICIPANT_ACTIONS_PAGE_SIZE)
      if (slice.length === 0) return { items: [], nextOffset: undefined }

      const results = await executeMultipleClausesCall({
        thor,
        calls: slice.map(participant => ({
          abi,
          address,
          functionName: "getParticipantActions",
          args: [BigInt(challengeId), participant],
        })),
      })

      const items = slice.map((participant, index) => ({
        participant,
        actions: Number(results[index] ?? 0),
      }))

      const next = offset + PARTICIPANT_ACTIONS_PAGE_SIZE
      return { items, nextOffset: next < total ? next : undefined }
    },
    initialPageParam: 0,
    getNextPageParam: last => last.nextOffset,
    enabled: !!thor && !!challengeId && total > 0 && contractOk,
  })

  const loadedItems = useMemo(() => query.data?.pages.flatMap(p => p.items) ?? [], [query.data])

  // Competition ranking: tied scores share the same rank (e.g. 1, 1, 3) so all
  // top-scorers are surfaced as winners by downstream UI. Sort is computed on
  // currently-loaded pages only — in active challenges the leaderboard grows
  // as the user loads more pages.
  const leaderboard = useMemo<ChallengeParticipantActionsEntry[]>(() => {
    const sorted = [...loadedItems].sort((a, b) => b.actions - a.actions)
    return sorted.map(entry => ({
      ...entry,
      position: sorted.findIndex(e => e.actions === entry.actions) + 1,
    }))
  }, [loadedItems])

  const totalActions = useMemo(() => leaderboard.reduce((sum, entry) => sum + entry.actions, 0), [leaderboard])

  return {
    leaderboard,
    totalActions,
    loadedCount: loadedItems.length,
    totalCount: total,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}

export const useChallengeParticipantActionsBatch = (entries: ChallengeParticipantActionRequest[]) => {
  const thor = useThor()
  const contractOk = !!address && address.toLowerCase() !== ZERO_ADDR
  const normalizedEntries = useMemo(
    () =>
      Array.from(
        new Map(
          entries
            .filter(entry => entry.challengeId > 0 && !!entry.participant)
            .map(entry => [
              getChallengeParticipantActionRequestKey(entry),
              {
                challengeId: entry.challengeId,
                participant: entry.participant.toLowerCase(),
              },
            ]),
        ).values(),
      ).sort((left, right) =>
        left.challengeId === right.challengeId
          ? left.participant.localeCompare(right.participant)
          : left.challengeId - right.challengeId,
      ),
    [entries],
  )

  return useQuery({
    queryKey: getChallengeParticipantActionsBatchQueryKey(normalizedEntries),
    queryFn: async () => {
      if (normalizedEntries.length === 0) return {} as Record<string, string>

      const results = await executeMultipleClausesCall({
        thor,
        calls: normalizedEntries.map(entry => ({
          abi,
          address,
          functionName: "getParticipantActions",
          args: [BigInt(entry.challengeId), entry.participant],
        })),
      })

      return Object.fromEntries(
        normalizedEntries.map((entry, index) => {
          const value = toBigIntValue(results[index])
          return [getChallengeParticipantActionRequestKey(entry), value.toString()]
        }),
      )
    },
    enabled: !!thor && contractOk && normalizedEntries.length > 0,
    staleTime: 0,
  })
}
