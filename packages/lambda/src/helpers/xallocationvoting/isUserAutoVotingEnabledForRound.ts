import { ThorClient } from "@vechain/sdk-network"
import { ABIContract } from "@vechain/sdk-core"
import { XAllocationVoting__factory } from "@vechain/vebetterdao-contracts/typechain-types"

/**
 * Checks if a user has auto-voting enabled for a specific round
 * @param thor - The ThorClient instance
 * @param contractAddress - The XAllocationVoting contract address
 * @param userAddress - The user's wallet address
 * @param roundId - The round ID to check
 * @returns Whether the user has auto-voting enabled for the round
 */
export const isUserAutoVotingEnabledForRound = async (
  thor: ThorClient,
  contractAddress: string,
  userAddress: string,
  roundId: number,
): Promise<boolean> => {
  const xAllocationVotingContract = ABIContract.ofAbi(XAllocationVoting__factory.abi)
  const result = await thor.contracts.executeCall(
    contractAddress,
    xAllocationVotingContract.getFunction("isUserAutoVotingEnabledForRound"),
    [userAddress, roundId],
  )

  if (!result.success) {
    throw new Error(`Failed to check auto-voting status for user ${userAddress}`)
  }

  return result.result?.array?.[0] as boolean
}
