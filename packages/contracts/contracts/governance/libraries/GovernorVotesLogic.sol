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
import { GovernorStateLogic } from "./GovernorStateLogic.sol";
import { GovernorConfigurator } from "./GovernorConfigurator.sol";
import { GovernorProposalLogic } from "./GovernorProposalLogic.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";

library GovernorVotesLogic {
  using GovernorStateLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorProposalLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorConfigurator for GovernorStorageTypes.GovernorStorage;

  /**
   * @dev The vote was already cast.
   */
  error GovernorAlreadyCastVote(address voter);

  /**
   * @dev The vote type used is not valid for the corresponding counting module.
   */
  error GovernorInvalidVoteType();

  /**
   * @dev The `votingThreshold` is not met.
   */
  error GovernorVotingThresholdNotMet(uint256 threshold, uint256 votes);

  /**
   * @dev Emitted when a vote is cast without params.
   *
   * Note: `support` values should be seen as buckets. Their interpretation depends on the voting module used.
   */
  event VoteCast(
    address indexed voter,
    uint256 indexed proposalId,
    uint8 support,
    uint256 weight,
    uint256 power,
    string reason
  );

  function _countVote(
    GovernorStorageTypes.GovernorStorage storage self,
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
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (bool) {
    GovernorTypes.ProposalVote storage proposalVote = self.proposalVotes[proposalId];
    return proposalVote.forVotes > proposalVote.againstVotes;
  }

  /**
   * @dev See {IB3TRGovernor-getVotes}.
   */
  function getVotes(
    GovernorStorageTypes.GovernorStorage storage self,
    address account,
    uint256 timepoint
  ) internal view returns (uint256) {
    return self.vot3.getPastVotes(account, timepoint);
  }

  /**
   * @dev returns the quadratic voting power that `account` has.  See {IB3TRGovernor-getQuadraticVotingPower}.
   */
  function getQuadraticVotingPower(
    GovernorStorageTypes.GovernorStorage storage self,
    address account,
    uint256 timepoint
  ) internal view returns (uint256) {
    // scale the votes by 1e9 so that number returned is 1e18
    return Math.sqrt(self.vot3.getPastVotes(account, timepoint)) * 1e9;
  }

  /**
   * @dev See {IB3TRGovernor-hasVoted}.
   */
  function hasVoted(GovernorStorageTypes.GovernorStorage storage self, uint256 proposalId, address account) public view returns (bool) {
    return self.proposalVotes[proposalId].hasVoted[account];
  }

  /**
   * @dev See {IB3TRGovernor-castVote}.
   */
  function castVote(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId,
    address voter,
    uint8 support,
    string calldata reason
  ) external returns (uint256) {
    self.validateStateBitmap(proposalId, GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Active));

    uint256 weight = self.vot3.getPastVotes(voter, self.proposalSnapshot(proposalId));
    uint256 power = Math.sqrt(weight) * 1e9;

    if (weight < self.getVotingThreshold()) {
      revert GovernorVotingThresholdNotMet(weight, self.getVotingThreshold());
    }

    _countVote(self, proposalId, voter, support, weight, power);

    self.voterRewards.registerVote(self.proposalSnapshot(proposalId), voter, weight, Math.sqrt(weight));

    emit VoteCast(voter, proposalId, support, weight, power, reason);

    return weight;
  }
}
