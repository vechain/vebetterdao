// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";

/**
 * @title AutoVotingLogic
 * @notice Library that handles user preferences for automatic voting in allocation rounds
 * @dev This library is intended to be used by the XAllocationVoting contract
 */
library AutoVotingLogic {
  using Checkpoints for Checkpoints.Trace208;

  /**
   * @dev Storage structure for AutoVoting preferences
   * @custom:storage-location erc7201:b3tr.storage.AutoVotingLogic
   */
  struct AutoVotingStorage {
    mapping(address => Checkpoints.Trace208) _autoVotingEnabled;
    mapping(address => bytes32[]) _userVotingPreferences;
    Checkpoints.Trace208 _totalAutoVotingUsers;
  }

  /**
   * @notice Emitted when a user toggles their autovoting status
   * @param account The address of the user
   * @param enabled Whether autovoting is enabled or disabled
   */
  event AutoVotingToggled(address indexed account, bool enabled);

  /**
   * @notice Emitted when a user updates their preferred apps for autovoting
   * @param account The address of the user
   * @param apps The list of app IDs the user prefers to vote for
   */
  event PreferredAppsUpdated(address indexed account, bytes32[] apps);

  // ---------- Setters ---------- //

  /**
   * @dev Toggles autovoting for an account
   * @param $ The storage struct for AutoVoting preferences
   * @param caller The calling contract that provides access to governance functions
   * @param account The address to toggle autovoting for
   * @param clock The current timepoint
   * @notice
   * User Enabled: false ──────────────────────→ true
   * Total Count:  100   ──────────────────────→ 101
   * User Prefs:   [existing preferences kept]
   *
   * User Enabled: true ──────────────────────→ false
   * Total Count:  101   ──────────────────────→ 100
   * User Prefs:   [app1, app2] ────────────────→ [] (deleted)
   */
  function toggleAutovoting(
    AutoVotingStorage storage $,
    IXAllocationVotingGovernor caller,
    address account,
    uint48 clock
  ) external {
    bool currentStatus = $._autoVotingEnabled[account].upperLookupRecent(clock) == 1;
    bool newStatus = !currentStatus;

    // If user is enabling autovoting (was disabled, now enabling), check eligibility
    if (!currentStatus) {
      caller.validatePersonhood(account);
      caller.getAndValidateVotingPower(account, caller.currentRoundSnapshot());
    }

    // If user is disabling autovoting (was enabled, now disabling), clear preferences
    if (currentStatus) {
      delete $._userVotingPreferences[account];
    }

    // Push new checkpoint with toggled status
    $._autoVotingEnabled[account].push(clock, newStatus ? SafeCast.toUint208(1) : SafeCast.toUint208(0));

    uint208 currentTotal = $._totalAutoVotingUsers.upperLookupRecent(clock);
    uint208 newTotal = newStatus ? currentTotal + 1 : currentTotal - 1;
    $._totalAutoVotingUsers.push(clock, newTotal);

    emit AutoVotingToggled(account, newStatus);
  }

  /**
   * @dev Sets the voting preferences for an account
   * @param $ The storage struct for AutoVoting preferences
   * @param x2EarnAppsContract The X2EarnApps contract interface
   * @param account The address to set preferences for
   * @param apps The list of app IDs to vote for
   */
  function setUserVotingPreferences(
    AutoVotingStorage storage $,
    IX2EarnApps x2EarnAppsContract,
    address account,
    bytes32[] memory apps
  ) external {
    require(apps.length > 0, "AutoVotingLogic: no apps to vote for");
    require(apps.length <= 10, "AutoVotingLogic: must vote for less than 10 apps");

    // Iterate through the apps and percentages to calculate the total weight of votes cast by the voter
    for (uint256 i; i < apps.length; i++) {
      // app must be a valid app
      require(x2EarnAppsContract.appExists(apps[i]), "AutoVotingLogic: invalid app");

      // Check current app against ALL previous apps
      for (uint256 j; j < i; j++) {
        require(apps[i] != apps[j], "AutoVotingLogic: duplicate app");
      }
    }

    $._userVotingPreferences[account] = apps;

    emit PreferredAppsUpdated(account, apps);
  }

  // ---------- Getters ---------- //

  /**
   * @dev Checks if autovoting is enabled for an account at the current timepoint
   * @param $ The storage struct for AutoVoting preferences
   * @param account The address to check
   * @param clock The current timepoint
   * @return Whether autovoting is enabled for the account at the current timepoint
   */
  function isAutoVotingEnabled(
    AutoVotingStorage storage $,
    address account,
    uint48 clock
  ) external view returns (bool) {
    return $._autoVotingEnabled[account].upperLookupRecent(clock) == 1;
  }

  /**
   * @dev Checks if autovoting is enabled for an account at a specific timepoint
   * @param $ The storage struct for AutoVoting preferences
   * @param account The address to check
   * @param timepoint The timepoint to check
   * @return Whether autovoting is enabled for the account at the specific timepoint
   */
  function isAutoVotingEnabledAtTimepoint(
    AutoVotingStorage storage $,
    address account,
    uint48 timepoint
  ) external view returns (bool) {
    return $._autoVotingEnabled[account].upperLookupRecent(timepoint) == 1;
  }

  /**
   * @dev Gets the voting preferences for an account
   * @param $ The storage struct for AutoVoting preferences
   * @param account The address to get preferences for
   * @return The list of app IDs the account prefers to vote for
   */
  function getUserVotingPreferences(
    AutoVotingStorage storage $,
    address account
  ) external view returns (bytes32[] memory) {
    return $._userVotingPreferences[account];
  }

  /**
   * @dev Gets the total number of users who enabled autovoting at a specific timepoint
   * @param $ The storage struct for AutoVoting preferences
   * @param timepoint The timepoint to check
   * @return The total number of users who enabled autovoting at the specific timepoint
   */
  function getTotalAutoVotingUsersAtTimepoint(
    AutoVotingStorage storage $,
    uint48 timepoint
  ) external view returns (uint208) {
    return $._totalAutoVotingUsers.upperLookupRecent(timepoint);
  }

  /**
   * @dev Gets the total number of users who enabled autovoting at the current timepoint
   * @param $ The storage struct for AutoVoting preferences
   * @param clock The current timepoint
   * @return The total number of users who enabled autovoting at the current timepoint
   */
  function getTotalAutoVotingUsers(AutoVotingStorage storage $, uint48 clock) external view returns (uint208) {
    return $._totalAutoVotingUsers.upperLookupRecent(clock);
  }
}
