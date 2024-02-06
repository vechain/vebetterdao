import { getConfig } from "@repo/config"
import Contract from "@repo/contracts/artifacts/contracts/governance/GovernorContract.sol/GovernorContract.json"
const governorAbi = Contract.abi

const GOVERNOR_CONTRACT = getConfig().governorContractAddress

export enum VoteType {
  VOTE_AGAINST,
  VOTE_FOR,
  ABSTAIN,
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
    functionAbi = governorAbi.find(e => e.name === "castVote")
    if (!functionAbi) throw new Error("Function abi not found for castVote")
    clause = thor.account(GOVERNOR_CONTRACT).method(functionAbi).asClause(proposalId, vote)
  } else {
    functionAbi = governorAbi.find(e => e.name === "castVoteWithReason")
    if (!functionAbi) throw new Error("Function abi not found for castVoteWithReason")
    clause = thor.account(GOVERNOR_CONTRACT).method(functionAbi).asClause(proposalId, vote, reason)
  }

  return {
    ...clause,
    comment: `Cast your vote on ${proposalId}`,
    abi: functionAbi,
  }
}
