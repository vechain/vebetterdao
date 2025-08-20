import { getConfig } from "@repo/config"
import { B3TRGovernorJson } from "@vechain/vebetterdao-contracts"
const b3trGovernorAbi = B3TRGovernorJson.abi

const GOVERNOR_CONTRACT = getConfig().b3trGovernorAddress

export enum VoteType {
  VOTE_AGAINST = "AGAINST",
  VOTE_FOR = "FOR",
  ABSTAIN = "ABSTAIN",
}

/**
 * Build the clause to mint B3TR tokens for the given address and amount
 * @param thor thor instance
 * @param voteFor whether to vote for or against the proposal (true for, false against)
 * @param reason the reason for the vote (optional)
 * @returns the clause to vote on a proposal
 */
export const buildCastVoteTx = (
  thor: Connex.Thor,
  proposalId: string,
  vote: VoteType,
  reason?: string,
): Connex.Vendor.TxMessage[0] => {
  let functionAbi
  let clause
  if (!reason || reason === "") {
    functionAbi = b3trGovernorAbi.find(e => e.name === "castVote")
    if (!functionAbi) throw new Error("Function abi not found for castVote")
    clause = thor.account(GOVERNOR_CONTRACT).method(functionAbi).asClause(proposalId, vote)
  } else {
    functionAbi = b3trGovernorAbi.find(e => e.name === "castVoteWithReason")
    if (!functionAbi) throw new Error("Function abi not found for castVoteWithReason")
    clause = thor.account(GOVERNOR_CONTRACT).method(functionAbi).asClause(proposalId, vote, reason)
  }

  return {
    ...clause,
    comment: `Cast your vote on ${proposalId}`,
    abi: functionAbi,
  }
}
