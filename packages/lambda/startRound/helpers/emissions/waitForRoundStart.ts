import mainnetConfig from "@repo/config/mainnet"
import { EmissionsContractJson } from "@repo/contracts"
import { FunctionFragment, coder } from "@vechain/sdk-core"
import { ThorClient } from "@vechain/sdk-network"

// Serialize the ABI of the Emissions contract for use in contract interaction
const emissionsABI = JSON.stringify(EmissionsContractJson.abi)

/**
 * Asynchronously waits for the start of the next emissions round by checking the next cycle block
 * and waiting until the blockchain reaches that block.
 *
 * @param {ThorClient} thor - An initialized Thor client for blockchain interactions.
 */
export async function waitForRoundStart(thor: ThorClient) {
  // Execute a contract call to get the block number of the next cycle
  const nextRoundBlock = await thor.contracts.executeContractCall(
    mainnetConfig.emissionsContractAddress,
    coder.createInterface(emissionsABI).getFunction("getNextCycleBlock") as FunctionFragment,
    [],
  )

  // Wait for the blockchain to reach the specified block number
  await thor.blocks.waitForBlockCompressed(Number(nextRoundBlock[0]), { intervalMs: 10000 })
}
