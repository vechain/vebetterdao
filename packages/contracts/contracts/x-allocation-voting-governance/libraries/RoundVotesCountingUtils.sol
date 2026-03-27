// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { XAllocationVotingStorageTypes } from "./XAllocationVotingStorageTypes.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { FreshnessUtils } from "./FreshnessUtils.sol";

/**
 * @title RoundVotesCountingUtils
 * @notice Library for vote counting with quadratic funding math in the XAllocationVoting system.
 * @dev Extracted from RoundVotesCountingUpgradeable module. Uses ERC-7201 namespaced storage.
 */
library RoundVotesCountingUtils {
  // ------- Events ------- //

  /// @notice Emitted when the voting threshold is updated
  event VotingThresholdSet(uint256 oldVotingThreshold, uint256 newVotingThreshold);

  /// @notice Emitted when a vote is cast
  event AllocationVoteCast(address indexed voter, uint256 indexed roundId, bytes32[] appsIds, uint256[] voteWeights);

  // ------- Errors ------- //

  /// @dev Error thrown when trying to vote for the same app multiple times in one transaction
  error DuplicateAppVote();

  // ------- Initialization ------- //

  /**
   * @notice Initializes the voting threshold
   * @param votingThreshold_ The initial minimum number of tokens needed to cast a vote
   */
  function initialize(uint256 votingThreshold_) external {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    $.votingThreshold = votingThreshold_;
  }

  // ------- Setters ------- //

  /**
   * @notice Sets the voting threshold
   * @param newVotingThreshold The new minimum number of tokens needed to cast a vote
   */
  function setVotingThreshold(uint256 newVotingThreshold) external {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    emit VotingThresholdSet($.votingThreshold, newVotingThreshold);
    $.votingThreshold = newVotingThreshold;
  }

  // ------- Getters ------- //

  /// @notice Returns the current voting threshold
  function votingThreshold() external view returns (uint256) {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    return $.votingThreshold;
  }

  /// @notice Returns the votes received by a specific app in a given round
  function getAppVotes(uint256 roundId, bytes32 app) external view returns (uint256) {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    return $._roundVotes[roundId].votesReceived[app];
  }

  /// @notice Returns the quadratic funding votes received by a specific app in a given round
  function getAppVotesQF(uint256 roundId, bytes32 app) external view returns (uint256) {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    return $._roundVotes[roundId].votesReceivedQF[app];
  }

  /// @notice Returns the total votes cast in a given round
  function totalVotes(uint256 roundId) external view returns (uint256) {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    return $._roundVotes[roundId].totalVotes;
  }

  /// @notice Returns the total quadratic funding votes cast in a given round
  function totalVotesQF(uint256 roundId) external view returns (uint256) {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    return $._roundVotes[roundId].totalVotesQF;
  }

  /// @notice Returns the total number of voters in a given round
  function totalVoters(uint256 roundId) external view returns (uint256) {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    return $._roundVotes[roundId].totalVoters;
  }

  /// @notice Returns whether a user has voted in a given round
  function hasVoted(uint256 roundId, address user) external view returns (bool) {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    return $._roundVotes[roundId].hasVoted[user];
  }

  /// @notice Returns whether a user has voted at least once across all rounds
  function hasVotedOnce(address user) external view returns (bool) {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    return $._hasVotedOnce[user];
  }

  /// @notice Returns whether quorum has been reached for a given round
  /// @param roundId The round to check
  /// @param quorumValue The quorum threshold (caller must provide)
  function quorumReached(uint256 roundId, uint256 quorumValue) external view returns (bool) {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    return quorumValue <= $._roundVotes[roundId].totalVotes;
  }

  /// @notice Returns whether the vote succeeded (totalVotes > 0)
  /// @dev Vote is successful if quorum is reached
  function voteSucceeded(uint256 roundId, uint256 quorumValue) external view returns (bool) {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    return $._roundVotes[roundId].totalVotes >= quorumValue;
  }

  // ------- Core Vote Counting ------- //

  /**
   * @notice Counts votes for a given round, applying quadratic funding principles.
   * @dev Allows a voter to allocate weights to various apps for a specific voting round.
   * Each voter can only vote once per round. Quadratic funding calculates the impact of each vote
   * by computing the square root of each individual vote weight and aggregating them.
   *
   * @param roundId The identifier of the current voting round
   * @param voter The address of the voter casting the votes
   * @param apps An array of app identifiers that the voter is allocating votes to
   * @param weights An array of vote weights corresponding to each app
   * @param voterTotalVotingPower The total voting power available to the voter
   * @param roundStart The block number when the round started (used for reward registration)
   */
  function countVote(
    uint256 roundId,
    address voter,
    bytes32[] memory apps,
    uint256[] memory weights,
    uint256 voterTotalVotingPower,
    uint256 roundStart
  ) external {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    XAllocationVotingStorageTypes.ExternalContractsStorage storage contracts = XAllocationVotingStorageTypes
      ._getExternalContractsStorage();

    // Voter must not have already voted in this round
    if ($._roundVotes[roundId].hasVoted[voter]) {
      revert IXAllocationVotingGovernor.GovernorAlreadyCastVote(voter);
    }

    // To hold the total weight of votes cast by the voter
    uint256 totalWeight;
    // To hold the total adjustment to the quadratic funding value for the given app
    uint256 totalQFVotesAdjustment;

    // Iterate through the apps and weights to calculate the total weight of votes cast by the voter
    for (uint256 i; i < apps.length; i++) {
      // Check current app against ALL previous apps for duplicates (O(n^2))
      for (uint256 j; j < i; j++) {
        if (apps[i] == apps[j]) {
          revert DuplicateAppVote();
        }
      }

      totalWeight += weights[i];

      if (totalWeight > voterTotalVotingPower) {
        revert IXAllocationVotingGovernor.GovernorInsufficientVotingPower();
      }

      // Check if the app is eligible for votes in the current round
      if (!IXAllocationVotingGovernor(address(this)).isEligibleForVote(apps[i], roundId)) {
        revert IXAllocationVotingGovernor.GovernorAppNotAvailableForVoting(apps[i]);
      }

      totalQFVotesAdjustment += _processAppVote($, roundId, apps[i], weights[i]);
    }

    // Check if the total weight of votes cast by the voter is greater than the voting threshold
    if (totalWeight < $.votingThreshold) {
      revert IXAllocationVotingGovernor.GovernorVotingThresholdNotMet($.votingThreshold, totalWeight);
    }

    // Apply the total adjustment to storage
    // Update the total quadratic funding value for the round
    // ∑(∑sqrt(votes))^2 -> (sqrt(votesAppX1) + sqrt(votesAppX2) + ...)^2 + (sqrt(votesAppY1) + sqrt(votesAppY2) + ...)^2 + ...
    $._roundVotes[roundId].totalVotesQF += totalQFVotesAdjustment;
    // Update total votes
    $._roundVotes[roundId].totalVotes += totalWeight;
    // Mark the voter as having voted
    $._roundVotes[roundId].hasVoted[voter] = true;
    // Increment the total number of voters
    $._roundVotes[roundId].totalVoters++;

    // Save that user cast vote only the first time
    if (!$._hasVotedOnce[voter]) {
      $._hasVotedOnce[voter] = true;
    }

    // Apply freshness multiplier to reward weight (does NOT affect on-chain vote count)
    uint256 freshnessMultiplier = FreshnessUtils.updateAndGetMultiplier(
      voter,
      roundId,
      apps,
      roundStart,
      address(contracts._voterRewards)
    );
    uint256 rewardWeight = (totalWeight * freshnessMultiplier) / 10000;
    uint256 rewardSqrt = Math.sqrt(rewardWeight);

    // Register the vote for rewards calculation with freshness-adjusted weight
    contracts._voterRewards.registerVote(roundStart, voter, rewardWeight, rewardSqrt);

    // Emit the AllocationVoteCast event
    emit AllocationVoteCast(voter, roundId, apps, weights);
  }

  /// @dev Process a single app vote: update QF and raw vote storage, return QF adjustment
  function _processAppVote(
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $,
    uint256 roundId,
    bytes32 appId,
    uint256 weight
  ) private returns (uint256 qfAdjustment) {
    // Get the current sum of the square roots of individual votes for the given project
    // ∑(sqrt(votes)) -> sqrt(votes1) + sqrt(votes2) + ... + sqrt(votesN)
    uint256 qfAppVotesPreVote = $._roundVotes[roundId].votesReceivedQF[appId];

    // Calculate the new sum of the square roots of individual votes for the given project
    // If the weight is greater than 1e18, calculate the square root, otherwise use weight / 1e9 (since sqrt(1e18) = 1e9)
    uint256 newQFVotes = weight > 1e18 ? Math.sqrt(weight) : weight / 1e9;
    // ∑(sqrt(votes)) -> sqrt(votes1) + sqrt(votes2) + ... + sqrt(votesN) + sqrt(votesN+1)
    uint256 qfAppVotesPostVote = qfAppVotesPreVote + newQFVotes;

    // Calculate the adjustment to the quadratic funding value for the given app
    // (sqrt(votes1) + ... + sqrt(votesN+1))^2 - (sqrt(votes1) + ... + sqrt(votesN))^2
    qfAdjustment = (qfAppVotesPostVote * qfAppVotesPostVote) - (qfAppVotesPreVote * qfAppVotesPreVote);

    // Update the quadratic funding votes received for the given app - sum of the square roots of individual votes
    $._roundVotes[roundId].votesReceivedQF[appId] = qfAppVotesPostVote;
    // Update the votes received for the given app
    $._roundVotes[roundId].votesReceived[appId] += weight;
  }
}
