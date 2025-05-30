import { useUserVotesInRound as useUserVotesInRoundKit } from "@vechain/vechain-kit"

export type AllocationVoteCastEvent = {
  voter: string
  roundId: string
  appsIds: string[]
  voteWeights: string[]
}

/**
 *  Hook to get the user votes in a given round from the xAllocationVoting contract
 * @returns the user votes in a given round from the xAllocationVoting contract
 */
export const useUserVotesInRound = useUserVotesInRoundKit
