// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { IXAllocationPool } from "../../interfaces/IXAllocationPool.sol";
import { IVoterRewards } from "../../interfaces/IVoterRewards.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title GovernorXAllocationVotesCountingUpgradeable
 *
 * @dev Extension of {XAllocationVotingGovernor} for counting votes for allocation rounds.
 *
 * In every round users can vote a fraction of their balance for the elegible apps in that round.
 */

abstract contract GovernorXAllocationVotesCountingUpgradeable is Initializable, XAllocationVotingGovernor {
  struct RoundVote {
    mapping(bytes32 app => uint256) votesReceived;
    mapping(bytes32 app => uint256) votesReceivedQF;
    uint256 totalVotes;
    uint256 totalVotesQF;
    mapping(address user => bool) hasVoted;
    uint256 totalVoters;
  }

  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.GovernorXAllocationVotesCounting
  struct GovernorXAllocationVotesCountingStorage {
    // mapping to store that a user has voted at least one time
    mapping(address => bool) _hasVotedOnce;
    mapping(uint256 roundId => RoundVote) _roundVotes;
    IVoterRewards voterRewards;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernor.GovernorXAllocationVotesCounting")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant GovernorXAllocationVotesCountingStorageLocation =
    0x5c00912e49838455c1e1b04f95a9c09c8d40dfdf1d79671a7f8ad0273f827300;

  function _getGovernorXAllocationVotesCountingStorage()
    private
    pure
    returns (GovernorXAllocationVotesCountingStorage storage $)
  {
    assembly {
      $.slot := GovernorXAllocationVotesCountingStorageLocation
    }
  }

  function __GovernorXAllocationVotesCounting_init(address _voterRewards) internal onlyInitializing {
    __GovernorXAllocationVotesCounting_init_unchained(_voterRewards);
  }

  function __GovernorXAllocationVotesCounting_init_unchained(address _voterRewards) internal onlyInitializing {
    GovernorXAllocationVotesCountingStorage storage $ = _getGovernorXAllocationVotesCountingStorage();

    $.voterRewards = IVoterRewards(_voterRewards);
  }

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

    GovernorXAllocationVotesCountingStorage storage $ = _getGovernorXAllocationVotesCountingStorage();
    XAllocationVotingGovernorStorage storage $governorStorage = _getXAllocationVotingGovernorStorage();

    RoundCore storage round = $governorStorage._rounds[roundId];

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
      totalWeight <= getVotes(voter, round.voteStart),
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

    $.voterRewards.registerVote(round.voteStart, voter, totalWeight);
  }

  function getAppVotes(uint256 roundId, bytes32 app) public view override returns (uint256) {
    GovernorXAllocationVotesCountingStorage storage $ = _getGovernorXAllocationVotesCountingStorage();
    return $._roundVotes[roundId].votesReceived[app];
  }

  function getAppVotesQF(uint256 roundId, bytes32 app) public view override returns (uint256) {
    GovernorXAllocationVotesCountingStorage storage $ = _getGovernorXAllocationVotesCountingStorage();
    return $._roundVotes[roundId].votesReceivedQF[app];
  }

  function totalVotesQF(uint256 roundId) public view override returns (uint256) {
    GovernorXAllocationVotesCountingStorage storage $ = _getGovernorXAllocationVotesCountingStorage();
    return $._roundVotes[roundId].totalVotesQF;
  }

  function totalVotes(uint256 roundId) public view override returns (uint256) {
    GovernorXAllocationVotesCountingStorage storage $ = _getGovernorXAllocationVotesCountingStorage();
    return $._roundVotes[roundId].totalVotes;
  }

  function totalVoters(uint256 roundId) public view override returns (uint256) {
    GovernorXAllocationVotesCountingStorage storage $ = _getGovernorXAllocationVotesCountingStorage();
    return $._roundVotes[roundId].totalVoters;
  }

  function hasVoted(uint256 roundId, address user) public view returns (bool) {
    GovernorXAllocationVotesCountingStorage storage $ = _getGovernorXAllocationVotesCountingStorage();
    return $._roundVotes[roundId].hasVoted[user];
  }

  function _quorumReached(uint256 roundId) internal view virtual override returns (bool) {
    return quorum(roundSnapshot(roundId)) <= totalVotes(roundId);
  }

  // vote is successful if quorum is reached
  function _voteSucceeded(uint256 roundId) internal view virtual override returns (bool) {
    return _quorumReached(roundId);
  }

  function hasVotedOnce(address user) public view returns (bool) {
    GovernorXAllocationVotesCountingStorage storage $ = _getGovernorXAllocationVotesCountingStorage();
    return $._hasVotedOnce[user];
  }

  function voterRewards() public view returns (IVoterRewards) {
    GovernorXAllocationVotesCountingStorage storage $ = _getGovernorXAllocationVotesCountingStorage();
    return $.voterRewards;
  }
}
