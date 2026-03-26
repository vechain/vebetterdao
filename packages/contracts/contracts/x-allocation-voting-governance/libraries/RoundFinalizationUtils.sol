// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { XAllocationVotingStorageTypes } from "./XAllocationVotingStorageTypes.sol";

/**
 * @title RoundFinalizationUtils
 * @notice Library that handles the finalization of allocation voting rounds
 * @dev If a round does not meet the quorum (Failed) we need to know the last round that succeeded,
 * so we can calculate the earnings for the x-2-earn-apps upon that round. By always pointing each round at the last succeeded one, if a round fails,
 * it will be enough to look at what round the previous one points to.
 */
library RoundFinalizationUtils {
  /**
   * @dev Store the last succeeded round for the given round
   * @param roundId The round to finalize
   * @param roundState The pre-computed state of the round (0=Active, 1=Failed, 2=Succeeded)
   * @param active Whether the round is currently active
   */
  function finalizeRound(uint256 roundId, uint8 roundState, bool active) external {
    require(!active, "XAllocationVotingGovernor: round is not ended yet");

    XAllocationVotingStorageTypes.RoundFinalizationStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundFinalizationStorage();

    // First round is always considered succeeded
    if (roundId == 1) {
      $._latestSucceededRoundId[roundId] = 1;
      $._roundFinalized[roundId] = true;
      return;
    }

    // RoundState.Succeeded == 2
    if (roundState == 2) {
      // if round is succeeded, it is the last succeeded round
      $._latestSucceededRoundId[roundId] = roundId;
      $._roundFinalized[roundId] = true;
    }
    // RoundState.Failed == 1
    else if (roundState == 1) {
      // if round is failed, it points to the last succeeded round
      $._latestSucceededRoundId[roundId] = $._latestSucceededRoundId[roundId - 1];
      $._roundFinalized[roundId] = true;
    }
  }

  /**
   * @dev Get the last succeeded round for the given round
   * @param roundId The round to query
   * @return The latest succeeded round id for the given round
   */
  function latestSucceededRoundId(uint256 roundId) external view returns (uint256) {
    XAllocationVotingStorageTypes.RoundFinalizationStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundFinalizationStorage();
    return $._latestSucceededRoundId[roundId];
  }

  /**
   * @dev Check if the round is finalized
   * @param roundId The round to query
   * @return Whether the round has been finalized
   */
  function isFinalized(uint256 roundId) external view returns (bool) {
    XAllocationVotingStorageTypes.RoundFinalizationStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundFinalizationStorage();
    return $._roundFinalized[roundId];
  }
}
