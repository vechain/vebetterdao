import { AppConfig } from "@repo/config"
import { Emissions__factory } from "@vechain-kit/vebetterdao-contracts"
import { ABIContract } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"

/**
 * Asynchronously waits for the start of the next emissions round by checking the next cycle block
 * and waiting until the blockchain reaches that block.
 *
 * @param {ThorClient} thor - An initialized Thor client for blockchain interactions.
 */
export async function waitForRoundStart(thor: ThorClient, config: AppConfig) {
  // Execute a contract call to get the block number of the next cycle
  const nextRoundBlock = await thor.contracts.executeCall(
    config.emissionsContractAddress,
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("getNextCycleBlock"),
    [],
  )

  const targetBlock = Number(nextRoundBlock.result?.array?.[0])

  // Create a promise that resolves when the block is reached
  const blockWaitPromise = thor.blocks.waitForBlockCompressed(targetBlock, { intervalMs: 10000 }) // Check every 10 seconds

  // Create a timeout promise
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(
      () => {
        reject(new Error(`Timeout waiting for block ${targetBlock} after 2 minutes`))
      },
      2 * 60 * 1000, // 2 minutes in milliseconds
    )
  })

  // Race the two promises - whichever completes first wins
  // If the blockWaitPromise hangs for 2 minutes, the timeoutPromise will win the race and throw an error.
  await Promise.race([blockWaitPromise, timeoutPromise])
}
