import { AppConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts"
import { ABIContract } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"

export interface RoundState {
  currentCycle: number
  nextCycleBlock: number
  currentBlock: number
  isBeforeDistributionBlock: boolean
  /**
   * Whether we should skip the distribute() call
   *
   * True = Skip distribute() (round already started)
   * False = Call distribute() (round not started yet)
   */
  shouldSkipDistribute: boolean
  /**
   * The number of blocks until the next cycle
   *
   * Positive = We're before the distribution block (either round has started OR early trigger)
   * Zero = We're at the distribution block (need to call distribute())
   * Negative = We're past the distribution block (round has already started)
   */
  blocksUntilNextCycle: number
  /**
   * Whether distribute() was already called for the current cycle.
   *
   * True = The next cycle block is far in the future (> ROUND_STARTED_THRESHOLD_BLOCKS),
   *        which only happens right after a round has started.
   * False = The round start is still pending (we're at/past the distribution block, or the
   *         scheduler fired early because cycle blocks drift later in wall-clock time).
   */
  hasRoundStarted: boolean
}

/**
 * Blocks-until-next-cycle above this value mean the round was already started.
 * Cycle start blocks drift later in wall-clock time (VeChain misses blocks), but the drift is
 * measured in minutes/hours, while a fresh cycle is at least 2 days (~17k blocks) away.
 * 8640 blocks = 24 hours.
 */
export const ROUND_STARTED_THRESHOLD_BLOCKS = 8640

// Detects the current state of the emissions round
export async function detectRoundState(thor: ThorClient, config: AppConfig): Promise<RoundState> {
  const currentCycleRes = await thor.contracts.executeCall(
    config.emissionsContractAddress,
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("getCurrentCycle"),
    [],
  )
  const currentCycle = Number(currentCycleRes.result?.array?.[0] ?? 0)

  const nextCycleBlockRes = await thor.contracts.executeCall(
    config.emissionsContractAddress,
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("getNextCycleBlock"),
    [],
  )
  const nextCycleBlock = Number(nextCycleBlockRes.result?.array?.[0] ?? 0)

  // Get the current block number
  const currentBlockRes = await thor.blocks.getBestBlockCompressed()
  const currentBlock = currentBlockRes?.number ?? 0

  // True = We're before the distribution block (either round has started OR early trigger)
  // False = We're at/past the distribution block (need to call distribute())
  const isBeforeDistributionBlock = currentBlock < nextCycleBlock

  // Calculate blocks until next cycle (can be negative if we're past distribution time)
  const blocksUntilNextCycle = nextCycleBlock - currentBlock

  // If triggered early due to slippage (within 90 blocks), wait for the round instead of skipping
  // 90 blocks = 15 minutes (matches lambda timeout), 1 block = 10 seconds
  const WAITING_THRESHOLD_BLOCKS = 90
  const isWithinWaitingWindow =
    isBeforeDistributionBlock && blocksUntilNextCycle > 0 && blocksUntilNextCycle <= WAITING_THRESHOLD_BLOCKS

  const shouldSkipDistribute = isBeforeDistributionBlock && !isWithinWaitingWindow

  const hasRoundStarted = blocksUntilNextCycle > ROUND_STARTED_THRESHOLD_BLOCKS

  return {
    currentCycle,
    nextCycleBlock,
    currentBlock,
    isBeforeDistributionBlock,
    shouldSkipDistribute,
    blocksUntilNextCycle,
    hasRoundStarted,
  }
}
