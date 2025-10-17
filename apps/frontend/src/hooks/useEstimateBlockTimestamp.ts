import { getConfig } from "@repo/config"
import { useCurrentBlock } from "@vechain/vechain-kit"
import dayjs from "dayjs"

const blockTime = getConfig().network.blockTime
/**
 * Hook to estimate the timestamp of a block based on the current block and the block number.
 * @param blockNumber - The block number to estimate the timestamp for.
 * @returns The estimated timestamp in milliseconds.
 */
export const useEstimateBlockTimestamp = ({ blockNumber }: { blockNumber?: number }) => {
  const { data: currentBlock } = useCurrentBlock()
  if (!blockNumber || !blockTime || !currentBlock) return 0
  const endBlockFromNow = Number(blockNumber) - currentBlock.number
  const durationLeftTimestamp = endBlockFromNow * blockTime
  return dayjs().add(durationLeftTimestamp, "milliseconds").toDate().getTime()
}
