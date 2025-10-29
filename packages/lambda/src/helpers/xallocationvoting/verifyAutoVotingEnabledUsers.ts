import { ThorClient } from "@vechain/sdk-network"
import { isUserAutoVotingEnabledForRound } from "./isUserAutoVotingEnabledForRound"
import { logger } from "../logger"

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
  logger.info("Verifying auto-voting eligibility", {
    userCount: users.length,
    roundId,
  })

  const results = await Promise.all(
    users.map(async user => {
      try {
        const isEnabled = await isUserAutoVotingEnabledForRound(thor, contractAddress, user, roundId)
        return { user, isEnabled }
      } catch (error) {
        logger.error("Error verifying user", error, { user, roundId })
        return { user, isEnabled: false }
      }
    }),
  )

  const validUsers = results.filter(r => r.isEnabled).map(r => r.user)
  const invalidUsers = results.filter(r => !r.isEnabled).map(r => r.user)

  if (invalidUsers.length > 0) {
    logger.warn("Invalid users found", {
      invalidCount: invalidUsers.length,
      invalidUsers,
      roundId,
    })
  }

  logger.info("Verification complete", {
    validCount: validUsers.length,
    invalidCount: invalidUsers.length,
    allValid: invalidUsers.length === 0,
  })

  return {
    allValid: invalidUsers.length === 0,
    validUsers,
    invalidUsers,
  }
}
