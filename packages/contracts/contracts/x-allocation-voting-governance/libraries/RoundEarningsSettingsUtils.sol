// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { XAllocationVotingStorageTypes } from "./XAllocationVotingStorageTypes.sol";

/**
 * @title RoundEarningsSettingsUtils
 * @notice Library for managing x-allocation earnings settings (base allocation percentage, app shares cap).
 * @dev Extracted from RoundEarningsSettingsUpgradeable module. Uses ERC-7201 namespaced storage.
 *
 * Since the base allocation percentage and app shares cap can be updated, values are snapshotted per round.
 */
library RoundEarningsSettingsUtils {
  /// @notice Thrown when the base allocation percentage exceeds 100
  error BaseAllocationPercentageTooHigh(uint256 provided);

  /// @notice Thrown when the app shares cap exceeds 100
  error AppSharesCapTooHigh(uint256 provided);

  // ---------- Getters ---------- //

  /**
   * @notice Get the current base allocation percentage
   */
  function baseAllocationPercentage() external view returns (uint256) {
    XAllocationVotingStorageTypes.EarningsSettingsStorage storage $ = XAllocationVotingStorageTypes
      ._getEarningsSettingsStorage();
    return $.baseAllocationPercentage;
  }

  /**
   * @notice Get the current app shares cap
   */
  function appSharesCap() external view returns (uint256) {
    XAllocationVotingStorageTypes.EarningsSettingsStorage storage $ = XAllocationVotingStorageTypes
      ._getEarningsSettingsStorage();
    return $.appSharesCap;
  }

  /**
   * @notice Returns the base allocation percentage for a given round
   * @param roundId The round to query
   */
  function getRoundBaseAllocationPercentage(uint256 roundId) external view returns (uint256) {
    XAllocationVotingStorageTypes.EarningsSettingsStorage storage $ = XAllocationVotingStorageTypes
      ._getEarningsSettingsStorage();
    return $._roundBaseAllocationPercentage[roundId];
  }

  /**
   * @notice Returns the app shares cap for a given round
   * @param roundId The round to query
   */
  function getRoundAppSharesCap(uint256 roundId) external view returns (uint256) {
    XAllocationVotingStorageTypes.EarningsSettingsStorage storage $ = XAllocationVotingStorageTypes
      ._getEarningsSettingsStorage();
    return $._roundAppSharesCap[roundId];
  }

  // ---------- Setters ---------- //

  /**
   * @notice Set the base allocation percentage
   * @param baseAllocationPercentage_ The new base allocation percentage (must be <= 100)
   */
  function setBaseAllocationPercentage(uint256 baseAllocationPercentage_) external {
    if (baseAllocationPercentage_ > 100) {
      revert BaseAllocationPercentageTooHigh(baseAllocationPercentage_);
    }
    XAllocationVotingStorageTypes.EarningsSettingsStorage storage $ = XAllocationVotingStorageTypes
      ._getEarningsSettingsStorage();
    $.baseAllocationPercentage = baseAllocationPercentage_;
  }

  /**
   * @notice Set the app shares cap
   * @param appSharesCap_ The new app shares cap (must be <= 100)
   */
  function setAppSharesCap(uint256 appSharesCap_) external {
    if (appSharesCap_ > 100) {
      revert AppSharesCapTooHigh(appSharesCap_);
    }
    XAllocationVotingStorageTypes.EarningsSettingsStorage storage $ = XAllocationVotingStorageTypes
      ._getEarningsSettingsStorage();
    $.appSharesCap = appSharesCap_;
  }

  // ---------- Snapshot ---------- //

  /**
   * @notice Snapshot the current earnings settings for a round
   * @param roundId The id of the round to snapshot
   * @dev Stores current baseAllocationPercentage and appSharesCap for the given round
   */
  function snapshotRoundEarningsCap(uint256 roundId) external {
    XAllocationVotingStorageTypes.EarningsSettingsStorage storage $ = XAllocationVotingStorageTypes
      ._getEarningsSettingsStorage();
    $._roundBaseAllocationPercentage[roundId] = $.baseAllocationPercentage;
    $._roundAppSharesCap[roundId] = $.appSharesCap;
  }
}
