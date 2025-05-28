import { useMemo } from "react"
import { useCurrentAllocationsRoundId } from "./useCurrentAllocationsRoundId"
import { RoundState, useAllocationsRoundState } from "./useAllocationsRoundState"
import { RoundCreated, useAllocationsRoundsEvents } from "./useAllocationsRoundsEvents"
import dayjs from "dayjs"
import { getConfig } from "@repo/config"
import { useCurrentBlock } from "@vechain/vechain-kit"

export type AllocationRoundWithState = RoundCreated & {
  state?: keyof typeof RoundState
  voteStartTimestamp?: dayjs.Dayjs
  voteEndTimestamp?: dayjs.Dayjs
  isCurrent: boolean
}

const blockTime = getConfig().network.blockTime
/**
 *  Hook to get and merge info about the given allocation round (state, proposer, voreStart, voteEnd)
 * @returns the allocation round info see {@link AllocationRoundWithState}
 */
export const useAllocationsRound = (roundId?: string) => {
  const { data: currentBlock } = useCurrentBlock()
  const currentAllocationId = useCurrentAllocationsRoundId()
  const currentAllocationState = useAllocationsRoundState(roundId)

  const allocationRoundsEvents = useAllocationsRoundsEvents()

  const currentAllocationRound: AllocationRoundWithState | undefined = useMemo(() => {
    if (!currentAllocationId.data || !allocationRoundsEvents.data) return
    const roundInfo = allocationRoundsEvents.data.created.find(allocationRound => allocationRound.roundId === roundId)
    if (!roundInfo) return
    return {
      ...roundInfo,
      state: currentAllocationState.data,
      isCurrent: roundId === currentAllocationId.data,
    }
  }, [currentAllocationId, allocationRoundsEvents, currentAllocationState, roundId])

  const isLoading =
    currentAllocationId.isLoading || allocationRoundsEvents.isLoading || currentAllocationState.isLoading
  const isError = currentAllocationId.isError || allocationRoundsEvents.isError || currentAllocationState.isError
  const error = currentAllocationId.error || allocationRoundsEvents.error || currentAllocationState.error

  const estimatedEndTime = useMemo(() => {
    if (!currentAllocationRound) return null
    const endBlock = Number(currentAllocationRound.voteEnd)
    if (!endBlock || !currentBlock) return null
    const endBlockFromNow = endBlock - currentBlock.number

    const durationLeftTimestamp = endBlockFromNow * blockTime
    return dayjs().add(durationLeftTimestamp, "milliseconds")
  }, [currentBlock, currentAllocationRound])

  const estimatedStartTime = useMemo(() => {
    if (!currentAllocationRound) return null
    const startBlock = Number(currentAllocationRound.voteStart)
    if (!startBlock || !currentBlock) return null
    const endBlockFromNow = startBlock - currentBlock.number

    const durationLeftTimestamp = endBlockFromNow * blockTime
    const endTime = dayjs().add(durationLeftTimestamp, "milliseconds")
    return endTime.set("second", 0).set("millisecond", 0)
  }, [currentBlock, currentAllocationRound])

  const isFirstRound = currentAllocationRound?.roundId === "1"
  const isLastRound = currentAllocationRound?.roundId === allocationRoundsEvents?.data?.created.length.toString()
  return {
    ...allocationRoundsEvents,
    data: {
      ...currentAllocationRound,
      voteStartTimestamp: estimatedStartTime,
      voteEndTimestamp: estimatedEndTime,
      isFirstRound,
      isLastRound,
    },
    isLoading,
    isError,
    error,
  }
}
