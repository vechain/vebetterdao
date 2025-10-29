// Export functions
export { getRoundSnapshot } from "./getRoundSnapshot"
export { isUserAutoVotingEnabledForRound } from "./isUserAutoVotingEnabledForRound"
export { getAutoVotingEnabledUsers, getAllAutoVotingEnabledUsers } from "./getAutoVotingEnabledUsers"
export { verifyAutoVotingUsersIsActive } from "./verifyAutoVotingEnabledUsers"
export { castVotesOnBehalfOf } from "./castVotesOnBehalfOf"
export { processBatchedVotes, isolateFailedVotes } from "./batchVoteProcessor"

// Export types
export type { AutoVotingEnabledUsersResult } from "./getAutoVotingEnabledUsers"
export type { VoteBatchResult, FailedVote } from "./batchVoteProcessor"
