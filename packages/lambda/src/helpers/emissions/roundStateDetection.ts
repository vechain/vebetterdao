import { AppConfig } from "@repo/config"
import { Emissions__factory } from "@vechain/vebetterdao-contracts"
import { ABIContract } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"

export interface RoundState {
  currentCycle: number
  nextCycleBlock: number
  currentBlock: number
  /**
   * Whether the round has started (distribute() was already called)
   *
   * True = nextCycleBlock > currentBlock (distribute() was called, we're in the middle of a round)
   * False = nextCycleBlock <= currentBlock (we're at/past distribution time, need to call distribute())
   */
  hasRoundStarted: boolean
  /**
   * Whether we should skip the distribute() call
   *
   * True = Skip distribute() (round already started)
   * False = Call distribute() (round not started yet)
   */
  shouldSkipDistribute: boolean
}

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

  // If the current block is less than the next cycle block, the round has started
  // If the current block is greater than the next cycle block, the round has not started
  const hasRoundStarted = currentBlock < nextCycleBlock
  const shouldSkipDistribute = hasRoundStarted

  return {
    currentCycle,
    nextCycleBlock,
    currentBlock,
    hasRoundStarted,
    shouldSkipDistribute,
  }
}

/**
 * Checks if the round has already started
 */
export async function hasRoundStarted(thor: ThorClient, config: AppConfig): Promise<boolean> {
  const state = await detectRoundState(thor, config)
  return state.hasRoundStarted
}
