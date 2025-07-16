import mainnetConfig from "@repo/config/mainnet"
import { Emissions__factory } from "@repo/contracts"
import { ABIContract } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"

/**
 * Asynchronously waits for the start of the next emissions round by checking the next cycle block
 * and waiting until the blockchain reaches that block.
 *
 * @param {ThorClient} thor - An initialized Thor client for blockchain interactions.
 */
export async function waitForRoundStart(thor: ThorClient) {
  // Execute a contract call to get the block number of the next cycle
  const nextRoundBlock = await thor.contracts.executeCall(
    mainnetConfig.emissionsContractAddress,
    ABIContract.ofAbi(Emissions__factory.abi).getFunction("getNextCycleBlock"),
    [],
  )

  // Wait for the blockchain to reach the specified block number
  await thor.blocks.waitForBlockCompressed(Number(nextRoundBlock.result?.array?.[0]), { intervalMs: 10000 })
}
