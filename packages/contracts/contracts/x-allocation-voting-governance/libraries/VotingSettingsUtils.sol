// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { XAllocationVotingStorageTypes } from "./XAllocationVotingStorageTypes.sol";

/**
 * @title VotingSettingsUtils
 * @notice Library for managing voting period settings in the XAllocationVoting system.
 * @dev Extracted from VotingSettingsUpgradeable module. Uses ERC-7201 namespaced storage.
 */
library VotingSettingsUtils {
  /// @notice Emitted when the voting period is updated
  event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);

  /// @notice Thrown when the voting period is invalid (zero or >= emissions cycle duration)
  error GovernorInvalidVotingPeriod(uint256 votingPeriod);

  /**
   * @notice Returns the current voting period
   * @return The voting period in blocks
   */
  function votingPeriod() external view returns (uint256) {
    XAllocationVotingStorageTypes.VotingSettingsStorage storage $ = XAllocationVotingStorageTypes
      ._getVotingSettingsStorage();
    return $._votingPeriod;
  }

  /**
   * @notice Sets the voting period
   * @param newVotingPeriod The new voting period in blocks
   * @param emissionsCycleDuration The current emissions cycle duration (caller must provide)
   * @dev Validates that newVotingPeriod > 0 and < emissionsCycleDuration.
   *
   * Emits a {VotingPeriodSet} event.
   */
  function setVotingPeriod(uint32 newVotingPeriod, uint256 emissionsCycleDuration) external {
    if (newVotingPeriod == 0) {
      revert GovernorInvalidVotingPeriod(0);
    }

    // Ensure the voting period is less than the emissions cycle duration.
    if (newVotingPeriod >= emissionsCycleDuration) {
      revert GovernorInvalidVotingPeriod(newVotingPeriod);
    }

    XAllocationVotingStorageTypes.VotingSettingsStorage storage $ = XAllocationVotingStorageTypes
      ._getVotingSettingsStorage();

    emit VotingPeriodSet($._votingPeriod, newVotingPeriod);
    $._votingPeriod = newVotingPeriod;
  }
}
