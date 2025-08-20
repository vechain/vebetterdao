import { ThorClient } from "@vechain/sdk-network"
import { XAllocationVoting__factory as XAllocationVoting } from "@vechain/vebetterdao-contracts"
import { ABIContract } from "@vechain/sdk-core"

/**
 * Retrieves the current round ID from the XAllocationVoting contract.
 *
 * @param thor - The ThorClient instance used to interact with the blockchain.
 * @param contractAddress - The contract address.
 * @returns A promise that resolves to the current round ID.
 * @throws An error if there is an issue with the contract call.
 */
export const getCurrentRoundId = async (thor: ThorClient, contractAddress: string) => {
  const res = await thor.contracts.executeCall(
    contractAddress,
    ABIContract.ofAbi(XAllocationVoting.abi).getFunction("currentRoundId"),
    [],
  )

  if (!res.success) {
    return Promise.reject(
      new Error(
        `Error in contract call to XAllocationVoting::currentRoundId at ${contractAddress}. Reverted with reason ${res.result.errorMessage}`,
      ),
    )
  }

  return res.result?.array?.[0]
}
