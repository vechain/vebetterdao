import { useMemo } from "react"
import { useCurrentAllocationsRoundId } from "./useCurrentAllocationsRoundId"
import { useAllocationsRoundState } from "./useAllocationsRoundState"
import { AllocationProposalCreated, useAllocationsRoundsEvents } from "./useAllocationsRoundsEvents"
import dayjs from "dayjs"
import { getConfig } from "@repo/config"
import { useCurrentBlock } from "@/api/blockchain"

export type AllocationRoundWithState = AllocationProposalCreated & {
  state?: string
  voteStartTimestamp?: dayjs.Dayjs
  voteEndTimestamp?: dayjs.Dayjs
}

const blockTime = getConfig().network.blockTime
/**
 *  Hook to get the current allocation round info and state using currentRoundId, state and onchain events
 * @returns the current allocation round info and state
 */
export const useAllocationsRound = (roundId: string) => {
  const { data: currentBlock } = useCurrentBlock()
  const currentAllocationId = useCurrentAllocationsRoundId()
  const currentAllocationState = useAllocationsRoundState(roundId)

  const allocationRoundsEvents = useAllocationsRoundsEvents()

  const currentAllocationRound: AllocationRoundWithState | undefined = useMemo(() => {
    if (!currentAllocationId.data || !allocationRoundsEvents.data) return
    const roundInfo = allocationRoundsEvents.data.created.find(
      allocationRound => allocationRound.proposalId === roundId,
    )
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
    return dayjs().add(durationLeftTimestamp, "milliseconds")
  }, [currentBlock, currentAllocationRound])

  return {
    ...allocationRoundsEvents,
    data: { ...currentAllocationRound, voteStartTimestamp: estimatedStartTime, voteEndTimestamp: estimatedEndTime },
    isLoading,
    isError,
    error,
  }
}
