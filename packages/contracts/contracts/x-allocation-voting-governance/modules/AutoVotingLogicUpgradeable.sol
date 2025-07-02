// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";

/**
 * @title AutoVotingLogicUpgradeable
 * @notice Handles user preferences for automatic voting in allocation rounds
 * @dev This module is intended to be inherited by the XAllocationVoting contract
 */
abstract contract AutoVotingLogicUpgradeable is XAllocationVotingGovernor {
  using Checkpoints for Checkpoints.Trace208;

  /**
   * @dev Storage structure for AutoVoting preferences
   * @custom:storage-location erc7201:b3tr.storage.AutoVotingLogic
   */
  struct AutoVotingStorage {
    mapping(address => Checkpoints.Trace208) _autoVotingEnabled;
    mapping(address => bytes32[]) _userVotingPreferences;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.AutoVotingLogic")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant AutoVotingStorageLocation =
    0x9419c2851faafbde6edee787e493cc4536bda194619add1c98e58286236c7c00;

  function _getAutoVotingStorage() private pure returns (AutoVotingStorage storage $) {
    assembly {
      $.slot := AutoVotingStorageLocation
    }
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

  /**
   * @dev Get the X2EarnApps contract interface
   * @return The X2EarnApps contract interface
   */
  function x2EarnApps() public view virtual override returns (IX2EarnApps);

  /**
   * @dev Get the current block number
   * @return The current block number
   */
  function _clock() public view virtual returns (uint48) {
    return Time.blockNumber();
  }

  /**
   * @dev Toggles autovoting for an account
   * @param account The address to toggle autovoting for
   */
  function _toggleAutovoting(address account) internal virtual {
    AutoVotingStorage storage $ = _getAutoVotingStorage();

    // Get current status using checkpoint
    bool currentStatus = $._autoVotingEnabled[account].upperLookupRecent(_clock()) == 1;
    bool newStatus = !currentStatus;

    if (currentStatus && !newStatus) {
      // Reset the user's voting preferences when autovoting is disabled
      delete $._userVotingPreferences[account];
    }

    // Push new checkpoint with toggled status
    $._autoVotingEnabled[account].push(_clock(), newStatus ? SafeCast.toUint208(1) : SafeCast.toUint208(0));

    emit AutoVotingToggled(account, newStatus);
  }

  /**
   * @dev Checks if autovoting is enabled for an account
   * @param account The address to check
   * @return Whether autovoting is enabled for the account
   */
  function _isAutoVotingEnabled(address account) internal view virtual override returns (bool) {
    AutoVotingStorage storage $ = _getAutoVotingStorage();
    return $._autoVotingEnabled[account].upperLookupRecent(_clock()) == 1;
  }

  /**
   * @dev Checks if autovoting is enabled for an account at a specific timepoint
   * @param account The address to check
   * @param timepoint The timepoint to check
   * @return Whether autovoting is enabled for the account at the specific timepoint
   */
  function _isAutoVotingEnabledAtTimepoint(
    address account,
    uint48 timepoint
  ) internal view virtual override returns (bool) {
    AutoVotingStorage storage $ = _getAutoVotingStorage();
    return $._autoVotingEnabled[account].upperLookupRecent(timepoint) == 1;
  }

  /**
   * @dev Sets the voting preferences for an account
   * @param account The address to set preferences for
   * @param apps The list of app IDs to vote for
   */
  function _setUserVotingPreferences(address account, bytes32[] memory apps) internal virtual {
    require(apps.length > 0, "AutoVotingLogic: no apps to vote for");
    require(apps.length <= 10, "AutoVotingLogic: too many apps to vote for");

    // Iterate through the apps and percentages to calculate the total weight of votes cast by the voter
    for (uint256 i; i < apps.length; i++) {
      // app must be a valid app
      require(x2EarnApps().appExists(apps[i]), "AutoVotingLogic: invalid app");

      // Check current app against ALL previous apps
      for (uint256 j; j < i; j++) {
        require(apps[i] != apps[j], "AutoVotingLogic: duplicate app");
      }
    }

    AutoVotingStorage storage $ = _getAutoVotingStorage();
    $._userVotingPreferences[account] = apps;

    emit PreferredAppsUpdated(account, apps);
  }

  /**
   * @dev Gets the voting preferences for an account
   * @param account The address to get preferences for
   * @return The list of app IDs the account prefers to vote for
   */
  function _getUserVotingPreferences(address account) internal view virtual override returns (bytes32[] memory) {
    AutoVotingStorage storage $ = _getAutoVotingStorage();
    return $._userVotingPreferences[account];
  }
}
