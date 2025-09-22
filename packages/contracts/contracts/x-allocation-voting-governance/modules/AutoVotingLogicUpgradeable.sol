// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { AutoVotingLogic } from "../libraries/AutoVotingLogic.sol";

/**
 * @title AutoVotingLogicUpgradeable
 * @notice Handles user preferences for automatic voting in allocation rounds
 * @dev This module is intended to be inherited by the XAllocationVoting contract
 */
abstract contract AutoVotingLogicUpgradeable is XAllocationVotingGovernor {
  // Import the storage struct from the library
  using AutoVotingLogic for AutoVotingLogic.AutoVotingStorage;

  /// @notice Storage struct is defined in AutoVotingLogic library but storage location is managed here
  /// @dev keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernor.AutoVotingLogic")) - 1)) & ~bytes32(uint256(0xff))
  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.AutoVotingLogic
  bytes32 private constant AutoVotingStorageLocation =
    0x79e5bcd052c027862431086e284ba2fb16d80aac052316614d6368ef7f884a00;

  function _getAutoVotingStorage() private pure returns (AutoVotingLogic.AutoVotingStorage storage $) {
    assembly {
      $.slot := AutoVotingStorageLocation
    }
  }

  /**
   * @dev Get the X2EarnApps contract interface
   * @return The X2EarnApps contract interface
   */
  function x2EarnApps() public view virtual override returns (IX2EarnApps);

  // ---------- Setters ---------- //

  /**
   * @dev Toggles autovoting for an account
   */
  function _toggleAutovoting(address account) internal virtual override {
    AutoVotingLogic.AutoVotingStorage storage $ = _getAutoVotingStorage();
    AutoVotingLogic.toggleAutovoting($, address(this), account, clock());
  }

  /**
   * @dev Sets the voting preferences for an account
   */
  function _setUserVotingPreferences(address account, bytes32[] memory apps) internal virtual {
    AutoVotingLogic.AutoVotingStorage storage $ = _getAutoVotingStorage();
    AutoVotingLogic.setUserVotingPreferences($, address(x2EarnApps()), account, apps);
  }

  /**
   * @dev Prepares arrays for auto-voting by filtering eligible apps and calculating vote weights
   */
  function _prepareAutoVoteArrays(
    address voter,
    uint256 roundId,
    bytes32[] memory preferredApps
  ) internal virtual override returns (bytes32[] memory finalAppIds, uint256[] memory voteWeights) {
    return AutoVotingLogic.prepareAutoVoteArrays(address(this), voter, roundId, preferredApps);
  }

  // ---------- Getters ---------- //

  /**
   * @dev Checks if autovoting is enabled for an account at latest timepoint
   */
  function _isAutoVotingEnabled(address account) internal view virtual override returns (bool) {
    AutoVotingLogic.AutoVotingStorage storage $ = _getAutoVotingStorage();
    return AutoVotingLogic.isAutoVotingEnabled($, account);
  }

  /**
   * @dev Checks if autovoting is enabled for an account at a specific timepoint
   */
  function _isAutoVotingEnabledAtTimepoint(
    address account,
    uint48 timepoint
  ) internal view virtual override returns (bool) {
    AutoVotingLogic.AutoVotingStorage storage $ = _getAutoVotingStorage();
    return AutoVotingLogic.isAutoVotingEnabledAtTimepoint($, account, timepoint);
  }

  /**
   * @dev Gets the voting preferences for an account
   */
  function _getUserVotingPreferences(address account) internal view virtual override returns (bytes32[] memory) {
    AutoVotingLogic.AutoVotingStorage storage $ = _getAutoVotingStorage();
    return AutoVotingLogic.getUserVotingPreferences($, account);
  }

  /**
   * @dev Gets the total number of users who enabled autovoting at a specific timepoint
   */
  function _getTotalAutoVotingUsersAtTimepoint(uint48 timepoint) internal view virtual override returns (uint208) {
    AutoVotingLogic.AutoVotingStorage storage $ = _getAutoVotingStorage();
    return AutoVotingLogic.getTotalAutoVotingUsersAtTimepoint($, timepoint);
  }

  /**
   * @dev Gets the total number of users who enabled autovoting at the current timepoint
   */
  function _getTotalAutoVotingUsers() internal view virtual returns (uint208) {
    AutoVotingLogic.AutoVotingStorage storage $ = _getAutoVotingStorage();
    return AutoVotingLogic.getTotalAutoVotingUsers($, clock());
  }
}
