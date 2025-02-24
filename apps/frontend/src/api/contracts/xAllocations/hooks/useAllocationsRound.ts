import { getCurrentAllocationsRoundId, getCurrentAllocationsRoundIdQueryKey } from "./useCurrentAllocationsRoundId"
import { RoundState, getAllocationsRoundState, getAllocationsRoundStateQueryKey } from "./useAllocationsRoundState"
import {
  RoundCreated,
  getAllocationsRoundsEvents,
  getAllocationsRoundsEventsQueryKey,
} from "./useAllocationsRoundsEvents"
import dayjs from "dayjs"
import { getConfig } from "@repo/config"
import { QueryClient, useQuery, useQueryClient } from "@tanstack/react-query"
import { useConnex } from "@vechain/dapp-kit-react"
import { currentBlockQueryKey, getCurrentBlock } from "@/api/blockchain"

export type AllocationRoundWithState = RoundCreated & {
  state?: keyof typeof RoundState
  voteStartTimestamp: number
  voteEndTimestamp: number
  isCurrent: boolean
}

const blockTime = getConfig().network.blockTime

export const getAllocationsRound = async (thor: Connex.Thor, queryClient: QueryClient, roundId?: string) => {
  if (!roundId) throw new Error("roundId is required")
  const currentBlock = await queryClient.ensureQueryData({
    queryKey: currentBlockQueryKey(),
    queryFn: getCurrentBlock,
  })
  const currentRoundId = await queryClient.ensureQueryData({
    queryKey: getCurrentAllocationsRoundIdQueryKey(),
    queryFn: async () => await getCurrentAllocationsRoundId(thor),
  })
  const currentRoundState = await queryClient.ensureQueryData({
    queryKey: getAllocationsRoundStateQueryKey(roundId),
    queryFn: async () => await getAllocationsRoundState(thor, currentRoundId),
  })

  const roundsEvents = await queryClient.ensureQueryData({
    queryKey: getAllocationsRoundsEventsQueryKey(),
    queryFn: async () => await getAllocationsRoundsEvents(thor),
  })

  const currentRound = roundsEvents.created.find(allocationRound => allocationRound.roundId === roundId)
  if (!currentRound) return

  const estimatedEndTime = (() => {
    const endBlock = currentRound.voteEnd
    const endBlockFromNow = endBlock - currentBlock.number

    const durationLeftTimestamp = endBlockFromNow * blockTime
    return dayjs().add(durationLeftTimestamp, "milliseconds").unix()
  })()

  const estimatedStartTime = (() => {
    const startBlock = currentRound.voteStart
    const startBlockFromNow = startBlock - currentBlock.number

    const durationLeftTimestamp = startBlockFromNow * blockTime
    return dayjs().add(durationLeftTimestamp, "milliseconds").unix()
  })()

  return {
    ...currentRound,
    state: currentRoundState,
    voteStartTimestamp: estimatedStartTime,
    voteEndTimestamp: estimatedEndTime,
    isCurrent: roundId === currentRoundId,
    isFirstRound: currentRound.roundId === "1",
    isLastRound: currentRound.roundId === roundsEvents.created.length.toString(),
  }
}

export const getAllocationsRoundQueryKey = (roundId?: string) => ["ALLOCATIONS_ROUND", roundId]
/**
 *  Hook to get and merge info about the given allocation round (state, proposer, voreStart, voteEnd)
 * @returns the allocation round info see {@link AllocationRoundWithState}
 */
export const useAllocationsRound = (roundId?: string) => {
  const { thor } = useConnex()
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: getAllocationsRoundQueryKey(roundId),
    queryFn: async () => await getAllocationsRound(thor, queryClient, roundId),
  })
}
