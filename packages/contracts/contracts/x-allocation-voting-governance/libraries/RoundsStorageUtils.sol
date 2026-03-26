// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { XAllocationVotingStorageTypes } from "./XAllocationVotingStorageTypes.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { X2EarnAppsDataTypes } from "../../libraries/X2EarnAppsDataTypes.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";

/**
 * @title RoundsStorageUtils
 * @notice Library for round lifecycle storage operations.
 * @dev Handles round creation and read access. Does NOT orchestrate external calls
 * (finalization, earnings snapshots, relayer rewards) — the caller is responsible for that.
 */
library RoundsStorageUtils {
  /// @dev Emitted when a new round is created
  event RoundCreated(
    uint256 indexed roundId,
    address indexed proposer,
    uint256 startBlock,
    uint256 deadline,
    bytes32[] eligible_apps
  );

  // ------- Setters ------- //

  /**
   * @dev Create a new round. Increments round count, stores RoundCore, and emits RoundCreated.
   * Does NOT finalize the previous round, snapshot earnings, or call external contracts.
   * @param proposer The address of the proposer
   * @param clock The current clock value (block number / timestamp)
   * @param votingPeriodDuration The duration of the voting period
   * @return roundId The id of the new round
   *
   * Emits a {RoundCreated} event
   */
  function createRound(
    address proposer,
    uint48 clock,
    uint32 votingPeriodDuration
  ) external returns (uint256 roundId) {
    XAllocationVotingStorageTypes.RoundsStorageStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundsStorageStorage();

    ++$._roundCount;
    roundId = $._roundCount;

    XAllocationVotingStorageTypes.RoundCore storage round = $._rounds[roundId];
    round.proposer = proposer;
    round.voteStart = SafeCast.toUint48(clock);
    round.voteDuration = votingPeriodDuration;

    emit RoundCreated(roundId, proposer, clock, uint256(clock) + uint256(votingPeriodDuration), $._appsEligibleForVoting[roundId]);
  }

  /**
   * @dev Store the apps eligible for voting in a round
   * @param roundId The round to set apps for
   * @param apps The app ids eligible for voting
   */
  function setAppsEligibleForVoting(uint256 roundId, bytes32[] memory apps) external {
    XAllocationVotingStorageTypes.RoundsStorageStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundsStorageStorage();
    $._appsEligibleForVoting[roundId] = apps;
  }

  // ------- Getters ------- //

  /**
   * @dev Get the current round id
   */
  function currentRoundId() external view returns (uint256) {
    XAllocationVotingStorageTypes.RoundsStorageStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundsStorageStorage();
    return $._roundCount;
  }

  /**
   * @dev Get the current round start block
   */
  function currentRoundSnapshot() external view returns (uint256) {
    XAllocationVotingStorageTypes.RoundsStorageStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundsStorageStorage();
    uint256 id = $._roundCount;
    return $._rounds[id].voteStart;
  }

  /**
   * @dev Get the current round deadline block
   */
  function currentRoundDeadline() external view returns (uint256) {
    XAllocationVotingStorageTypes.RoundsStorageStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundsStorageStorage();
    uint256 id = $._roundCount;
    return uint256($._rounds[id].voteStart) + uint256($._rounds[id].voteDuration);
  }

  /**
   * @dev Get the start block of a round
   */
  function roundSnapshot(uint256 roundId) external view returns (uint256) {
    XAllocationVotingStorageTypes.RoundsStorageStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundsStorageStorage();
    return $._rounds[roundId].voteStart;
  }

  /**
   * @dev Get the deadline block of a round
   */
  function roundDeadline(uint256 roundId) external view returns (uint256) {
    XAllocationVotingStorageTypes.RoundsStorageStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundsStorageStorage();
    return uint256($._rounds[roundId].voteStart) + uint256($._rounds[roundId].voteDuration);
  }

  /**
   * @dev Get the proposer of a round
   */
  function roundProposer(uint256 roundId) external view returns (address) {
    XAllocationVotingStorageTypes.RoundsStorageStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundsStorageStorage();
    return $._rounds[roundId].proposer;
  }

  /**
   * @dev Get the ids of the apps eligible for voting in a round
   */
  function getAppIdsOfRound(uint256 roundId) external view returns (bytes32[] memory) {
    XAllocationVotingStorageTypes.RoundsStorageStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundsStorageStorage();
    return $._appsEligibleForVoting[roundId];
  }

  /**
   * @dev Get the data of a round
   */
  function getRound(uint256 roundId) external view returns (XAllocationVotingStorageTypes.RoundCore memory) {
    XAllocationVotingStorageTypes.RoundsStorageStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundsStorageStorage();
    return $._rounds[roundId];
  }

  /**
   * @dev Get all the apps in the form of {AppWithDetailsReturnType} eligible for voting in a round
   * @notice This function could not be efficient with a large number of apps, in that case, use {getAppIdsOfRound}
   * and then call {IX2EarnApps-app} for each app id
   * @param roundId The round to query
   * @param x2EarnAppsContract The X2EarnApps contract to fetch app details from
   */
  function getAppsOfRound(
    uint256 roundId,
    IX2EarnApps x2EarnAppsContract
  ) external view returns (X2EarnAppsDataTypes.AppWithDetailsReturnType[] memory) {
    XAllocationVotingStorageTypes.RoundsStorageStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundsStorageStorage();

    bytes32[] memory appsInRound = $._appsEligibleForVoting[roundId];
    uint256 length = appsInRound.length;
    X2EarnAppsDataTypes.AppWithDetailsReturnType[] memory allApps = new X2EarnAppsDataTypes.AppWithDetailsReturnType[](
      length
    );

    for (uint i; i < length; i++) {
      allApps[i] = x2EarnAppsContract.app(appsInRound[i]);
    }
    return allApps;
  }
}
