import { ThorClient } from "@vechain/sdk-network"
import { isUserAutoVotingEnabledForRound } from "./isUserAutoVotingEnabledForRound"

/**
 * Verifies that all users in the list have auto-voting enabled (and 'active' at the round start block) for the specified round
 * @param thor - The ThorClient instance
 * @param contractAddress - The XAllocationVoting contract address
 * @param users - Array of user addresses to verify
 * @param roundId - The round ID to check
 * @returns Object containing verification results
 */
export const verifyAutoVotingUsersIsActive = async (
  thor: ThorClient,
  contractAddress: string,
  users: string[],
  roundId: number,
): Promise<{
  allValid: boolean
  validUsers: string[]
  invalidUsers: string[]
}> => {
  console.log(`Verifying auto-voting status for ${users.length} users in round ${roundId}`)

  const results = await Promise.all(
    users.map(async user => {
      try {
        const isEnabled = await isUserAutoVotingEnabledForRound(thor, contractAddress, user, roundId)
        return { user, isEnabled }
      } catch (error) {
        console.error(`Error checking auto-voting status for ${user}:`, error)
        return { user, isEnabled: false }
      }
    }),
  )

  const validUsers = results.filter(r => r.isEnabled).map(r => r.user)
  const invalidUsers = results.filter(r => !r.isEnabled).map(r => r.user)

  console.log(`Verification complete: ${validUsers.length} valid, ${invalidUsers.length} invalid`)

  if (invalidUsers.length > 0) {
    console.warn(`Invalid users found:`, invalidUsers)
  }

  return {
    allValid: invalidUsers.length === 0,
    validUsers,
    invalidUsers,
  }
}
