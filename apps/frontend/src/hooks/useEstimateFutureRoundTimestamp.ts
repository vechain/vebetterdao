import { getConfig } from "@repo/config"
import { useCurrentBlock } from "@vechain/vechain-kit"
import dayjs from "dayjs"

import { useAllocationsRound } from "../api/contracts/xAllocations/hooks/useAllocationsRound"

const blockTime = getConfig().network.blockTime
/**
 * Hook to estimate the timestamp of a future round based on the current round's block distance and current block.
 * @param currentRoundId - The current round id to use as reference
 * @param targetRoundId - The target round id to estimate the timestamp for
 * @returns The estimated timestamp in milliseconds, or null if data is not available
 */
export const useEstimateFutureRoundTimestamp = ({
  currentRoundId,
  targetRoundId,
}: {
  currentRoundId?: string
  targetRoundId?: string
}): number | null => {
  const { data: currentRoundInfo } = useAllocationsRound(currentRoundId)
  const { data: currentBlock } = useCurrentBlock()
  // Return early if required data is not available
  if (!currentRoundInfo || !currentBlock || !currentRoundId || !targetRoundId) {
    return null
  }
  //Get the difference between the current round id and the target round id
  const roundDifference = Number(targetRoundId) - Number(currentRoundId) //Eg. 200 - 190 = 10
  //Get the blocks per round (duration of one round in blocks)
  const currentRoundDeadline = currentRoundInfo.voteEnd
  const currentRoundStartBlock = currentRoundInfo.voteStart
  const blocksPerRound = Number(currentRoundDeadline) - Number(currentRoundStartBlock)
  //Get remaining blocks in current round (from now to end of current round)
  const remainingBlocksInCurrentRound = Number(currentRoundDeadline) - Number(currentBlock.number)
  //Calculate total blocks from now to target round start
  // = remaining blocks in current round + (complete rounds between current and target) * blocks per round
  const completeRoundsBetween = Math.max(0, roundDifference - 1) // -1 because we already account for current round
  const totalBlocksToTargetRound = remainingBlocksInCurrentRound + completeRoundsBetween * blocksPerRound
  //Convert blocks to milliseconds using block time
  const durationInMilliseconds = totalBlocksToTargetRound * blockTime
  return dayjs().add(durationInMilliseconds, "milliseconds").toDate().getTime()
}
