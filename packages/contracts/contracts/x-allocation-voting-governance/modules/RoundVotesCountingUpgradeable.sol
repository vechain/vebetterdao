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

pragma solidity ^0.8.18;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { IXAllocationPool } from "../../interfaces/IXAllocationPool.sol";
import { IVoterRewards } from "../../interfaces/IVoterRewards.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title RoundVotesCountingUpgradeable
 *
 * @dev Extension of {XAllocationVotingGovernor} for counting votes for allocation rounds.
 *
 * In every round users can vote a fraction of their balance for the elegible apps in that round.
 */
abstract contract RoundVotesCountingUpgradeable is Initializable, XAllocationVotingGovernor {
  struct RoundVote {
    mapping(bytes32 appId => uint256) votesReceived;
    mapping(bytes32 appId => uint256) votesReceivedQF;
    uint256 totalVotes;
    uint256 totalVotesQF;
    mapping(address user => bool) hasVoted;
    uint256 totalVoters;
  }

  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.RoundVotesCounting
  struct RoundVotesCountingStorage {
    mapping(address user => bool) _hasVotedOnce; // mapping to store that a user has voted at least one time
    mapping(uint256 roundId => RoundVote) _roundVotes; // mapping to store the votes for each round
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernor.RoundVotesCounting")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant RoundVotesCountingStorageLocation =
    0xa760c041d4a9fa3a2c67d0d325f3592ba2c7e4330f7ba2283ebf9fe63913d500;

  function _getRoundVotesCountingStorage() private pure returns (RoundVotesCountingStorage storage $) {
    assembly {
      $.slot := RoundVotesCountingStorageLocation
    }
  }

  /**
   * @dev Initializes the contract
   */
  function __RoundVotesCounting_init() internal onlyInitializing {
    __RoundVotesCounting_init_unchained();
  }

  function __RoundVotesCounting_init_unchained() internal onlyInitializing {}

  /**
   * @dev See {IXAllocationVotingGovernor-COUNTING_MODE}.
   */
  // solhint-disable-next-line func-name-mixedcase
  function COUNTING_MODE() public pure virtual override returns (string memory) {
    return "support=x-allocations&quorum=auto";
  }

  /**
   * @dev Counts votes for a given round of voting, applying quadratic funding principles.
   * This function allows a voter to allocate weights (votes) to various applications (apps) for a specific voting round.
   * It checks if the voter has already voted in the round to prevent double voting.
   * Each vote's weight is applied to the specified applications, and the total and quadratic votes for each application
   * are updated accordingly.
   *
   * Quadratic Funding (QF) is implemented here to calculate the impact of each vote. In QF, the value of each vote is squared,
   * emphasizing the number of participants over the size of individual contributions. This method aims to democratize the voting
   * process by amplifying the influence of a larger number of smaller votes.
   */
  function _countVote(
    uint256 roundId,
    address voter,
    bytes32[] memory apps,
    uint256[] memory weights
  ) internal virtual override {
    if (hasVoted(roundId, voter)) {
      revert GovernorAlreadyCastVote(voter);
    }

    RoundVotesCountingStorage storage $ = _getRoundVotesCountingStorage();

    uint256 roundStart = roundSnapshot(roundId);

    uint256 totalWeight = 0;
    uint256 totalQFVotesAdjustment = 0;
    for (uint256 i = 0; i < apps.length; i++) {
      totalWeight += weights[i];

      if (!isEligibleForVote(apps[i], roundId)) {
        revert GovernorAppNotAvailableForVoting(apps[i]);
      }

      // Get the current sum of the square roots of individual votes for the given project
      uint256 qfAppVotesPreVote = $._roundVotes[roundId].votesReceivedQF[apps[i]];

      // Calculate the new sum of the square roots of individual votes for the given project
      uint256 newQFVotes = Math.sqrt(weights[i]);
      uint256 qfAppVotesPostVote = qfAppVotesPreVote + newQFVotes;

      // Calculate the adjustment to the quadratic funding value for the given app
      totalQFVotesAdjustment += (qfAppVotesPostVote * qfAppVotesPostVote) - (qfAppVotesPreVote * qfAppVotesPreVote);

      // Update the quadratic funding votes received for the given app - sum of the square roots of individual votes
      $._roundVotes[roundId].votesReceivedQF[apps[i]] = qfAppVotesPostVote;
      $._roundVotes[roundId].votesReceived[apps[i]] += weights[i];
    }

    require(
      totalWeight <= getVotes(voter, roundStart),
      "Governor: account has insufficient voting power for this round"
    );

    // Apply the total adjustment to storage
    $._roundVotes[roundId].totalVotesQF += totalQFVotesAdjustment;

    $._roundVotes[roundId].totalVotes += totalWeight;
    $._roundVotes[roundId].hasVoted[voter] = true;
    $._roundVotes[roundId].totalVoters++;

    // save that user cast vote only the first time
    if (!$._hasVotedOnce[voter]) {
      $._hasVotedOnce[voter] = true;
    }

    emit AllocationVoteCast(voter, roundId, apps, weights);

    voterRewards().registerVote(roundStart, voter, totalWeight);
  }

  /**
   * @dev Get the votes received by a specific application in a given round
   */
  function getAppVotes(uint256 roundId, bytes32 app) public view override returns (uint256) {
    RoundVotesCountingStorage storage $ = _getRoundVotesCountingStorage();
    return $._roundVotes[roundId].votesReceived[app];
  }

  /**
   * @dev Get the quadratic funding votes received by a specific application in a given round
   */
  function getAppVotesQF(uint256 roundId, bytes32 app) public view override returns (uint256) {
    RoundVotesCountingStorage storage $ = _getRoundVotesCountingStorage();
    return $._roundVotes[roundId].votesReceivedQF[app];
  }

  /**
   * @dev Get the total quadratic funding votes cast in a given round
   */
  function totalVotesQF(uint256 roundId) public view override returns (uint256) {
    RoundVotesCountingStorage storage $ = _getRoundVotesCountingStorage();
    return $._roundVotes[roundId].totalVotesQF;
  }

  /**
   * @dev Get the total votes cast in a given round
   */
  function totalVotes(uint256 roundId) public view override returns (uint256) {
    RoundVotesCountingStorage storage $ = _getRoundVotesCountingStorage();
    return $._roundVotes[roundId].totalVotes;
  }

  /**
   * @dev Get the total number of voters in a given round
   */
  function totalVoters(uint256 roundId) public view override returns (uint256) {
    RoundVotesCountingStorage storage $ = _getRoundVotesCountingStorage();
    return $._roundVotes[roundId].totalVoters;
  }

  /**
   * @dev Check if a user has voted in a given round
   */
  function hasVoted(uint256 roundId, address user) public view returns (bool) {
    RoundVotesCountingStorage storage $ = _getRoundVotesCountingStorage();
    return $._roundVotes[roundId].hasVoted[user];
  }

  /**
   * @dev Internal function to check if the quorum is reached for a given round
   */
  function _quorumReached(uint256 roundId) internal view virtual override returns (bool) {
    return quorum(roundSnapshot(roundId)) <= totalVotes(roundId);
  }

  /**
   * @dev Internal function to check if the vote succeeded for a given round
   */
  function _voteSucceeded(uint256 roundId) internal view virtual override returns (bool) {
    // vote is successful if quorum is reached
    return _quorumReached(roundId);
  }

  /**
   * @dev Check if a user has voted at least once from the deployment of the contract
   */
  function hasVotedOnce(address user) public view returns (bool) {
    RoundVotesCountingStorage storage $ = _getRoundVotesCountingStorage();
    return $._hasVotedOnce[user];
  }
}
