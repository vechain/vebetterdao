// SPDX-License-Identifier: MIT

//                                      #######
//                                 ################
//                               ####################
//                             ###########   #########
//                            #########      #########
//          #######          #########       #########
//          #########       #########      ##########
//           ##########     ########     ####################
//            ##########   #########  #########################
//              ################### ############################
//               #################  ##########          ########
//                 ##############      ###              ########
//                  ############                       #########
//                    ##########                     ##########
//                     ########                    ###########
//                       ###                    ############
//                                          ##############
//                                    #################
//                                   ##############
//                                   #########

pragma solidity ^0.8.20;

import { GovernorStorageTypes } from "./GovernorStorageTypes.sol";
import { GovernorTypes } from "./GovernorTypes.sol";

library GovernorVotesLogic {
  /**
   * @dev The vote was already cast.
   */
  error GovernorAlreadyCastVote(address voter);

  /**
   * @dev The vote type used is not valid for the corresponding counting module.
   */
  error GovernorInvalidVoteType();

  function countVote(
    GovernorStorageTypes.GovernorVotesStorage storage self,
    uint256 proposalId,
    address account,
    uint8 support,
    uint256 weight,
    uint256 power
  ) internal {
    GovernorTypes.ProposalVote storage proposalVote = self.proposalVotes[proposalId];

    if (proposalVote.hasVoted[account]) {
      revert GovernorAlreadyCastVote(account);
    }
    proposalVote.hasVoted[account] = true;

    if (support == uint8(GovernorTypes.VoteType.Against)) {
      proposalVote.againstVotes += power;
    } else if (support == uint8(GovernorTypes.VoteType.For)) {
      proposalVote.forVotes += power;
    } else if (support == uint8(GovernorTypes.VoteType.Abstain)) {
      proposalVote.abstainVotes += power;
    } else {
      revert GovernorInvalidVoteType();
    }

    self.proposalTotalVotes[proposalId] += weight;

    // save that user cast vote only the first time
    if (!self.hasVotedOnce[account]) {
      self.hasVotedOnce[account] = true;
    }
  }

  /**
   * @dev See {Governor-_voteSucceeded}. In this module, the forVotes must be strictly over the againstVotes.
   */
  function voteSucceeded(
    GovernorStorageTypes.GovernorVotesStorage storage self,
    uint256 proposalId
  ) internal view returns (bool) {
    GovernorTypes.ProposalVote storage proposalVote = self.proposalVotes[proposalId];
    return proposalVote.forVotes > proposalVote.againstVotes;
  }
}
