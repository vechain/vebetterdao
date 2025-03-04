import { ThorClient } from "@vechain/sdk-network"
import { AppConfig } from "@repo/config"
import { XAllocationVoting__factory as XAllocationVoting } from "@repo/contracts"

/**
 * Retrieves the current round ID from the XAllocationVoting contract.
 *
 * @param thor - The ThorClient instance used to interact with the blockchain.
 * @param config - The application configuration containing the contract address.
 * @returns A promise that resolves to the current round ID.
 * @throws An error if there is an issue with the contract call.
 */
export const getCurrentRoundId = async (thor: ThorClient, config: AppConfig) => {
  const res = await thor.contracts.executeContractCall(
    config.xAllocationVotingContractAddress,
    XAllocationVoting.createInterface().getFunction("currentRoundId"),
    [],
  )

  if (res.reverted) {
    return Promise.reject(
      new Error(
        `Error in contract call to XAllocationVoting::currentRoundId at ${config.xAllocationVotingContractAddress}. Reverted with reason ${res.vmError}`,
      ),
    )
  }

  return res[0]
}
