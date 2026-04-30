// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IX2EarnApps } from "../../../../interfaces/IX2EarnApps.sol";
import { XAllocationVotingGovernorV8 as XAllocationVotingGovernor } from "../XAllocationVotingGovernorV8.sol";
import { AutoVotingLogicV8 } from "../libraries/AutoVotingLogicV8.sol";
import { XAllocationVotingDataTypesV8 } from "../libraries/XAllocationVotingDataTypesV8.sol";

/**
 * @title AutoVotingLogicUpgradeable
 * @notice Handles user preferences for automatic voting in allocation rounds
 * @dev This module is intended to be inherited by the XAllocationVoting contract
 */
abstract contract AutoVotingLogicUpgradeableV8 is XAllocationVotingGovernor {
  /// @notice Storage location for AutoVoting data using ERC-7201 namespaced storage pattern
  /// @dev This constant defines the storage slot for AutoVotingStorage struct (defined in XAllocationVotingDataTypes)
  /// @dev Calculated as: keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernorV8.AutoVoting")) - 1)) & ~bytes32(uint256(0xff))
  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernorV8.AutoVoting
  bytes32 private constant AutoVotingStorageLocation =
    0x38ba4d920474025bc119851d51630794ab25dc91b5f613afc3c0e85f09fdc100;

  function _getAutoVotingStorage() private pure returns (XAllocationVotingDataTypesV8.AutoVotingStorage storage $) {
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
  function _toggleAutoVoting(address account) internal virtual override {
    XAllocationVotingDataTypesV8.AutoVotingStorage storage $ = _getAutoVotingStorage();
    AutoVotingLogicV8.toggleAutoVoting($, address(this), account, clock());
  }

  /**
   * @dev Sets the voting preferences for an account
   */
  function _setUserVotingPreferences(address account, bytes32[] memory apps) internal virtual {
    XAllocationVotingDataTypesV8.AutoVotingStorage storage $ = _getAutoVotingStorage();
    AutoVotingLogicV8.setUserVotingPreferences($, address(x2EarnApps()), account, apps);
  }

  /**
   * @dev Prepares arrays for auto-voting by filtering eligible apps and calculating vote weights
   */
  function _prepareAutoVoteArrays(
    address voter,
    uint256 roundId,
    bytes32[] memory preferredApps
  )
    internal
    virtual
    override
    returns (bytes32[] memory finalAppIds, uint256[] memory voteWeights, uint256 votingPower)
  {
    return AutoVotingLogicV8.prepareAutoVoteArrays(address(this), voter, roundId, preferredApps);
  }

  // ---------- Getters ---------- //

  /**
   * @dev Checks if autovoting is enabled for an account at latest timepoint
   */
  function _isAutoVotingEnabled(address account) internal view virtual override returns (bool) {
    XAllocationVotingDataTypesV8.AutoVotingStorage storage $ = _getAutoVotingStorage();
    return AutoVotingLogicV8.isAutoVotingEnabled($, account);
  }

  /**
   * @dev Checks if autovoting is enabled for an account at a specific timepoint
   */
  function _isAutoVotingEnabledAtTimepoint(
    address account,
    uint48 timepoint
  ) internal view virtual override returns (bool) {
    XAllocationVotingDataTypesV8.AutoVotingStorage storage $ = _getAutoVotingStorage();
    return AutoVotingLogicV8.isAutoVotingEnabledAtTimepoint($, account, timepoint);
  }

  /**
   * @dev Gets the voting preferences for an account
   */
  function _getUserVotingPreferences(address account) internal view virtual override returns (bytes32[] memory) {
    XAllocationVotingDataTypesV8.AutoVotingStorage storage $ = _getAutoVotingStorage();
    return AutoVotingLogicV8.getUserVotingPreferences($, account);
  }

  /**
   * @dev Gets the total number of users who enabled autovoting at a specific timepoint
   */
  function _getTotalAutoVotingUsersAtTimepoint(uint48 timepoint) internal view virtual override returns (uint208) {
    XAllocationVotingDataTypesV8.AutoVotingStorage storage $ = _getAutoVotingStorage();
    return AutoVotingLogicV8.getTotalAutoVotingUsersAtTimepoint($, timepoint);
  }

  /**
   * @dev Gets the total number of users who enabled autovoting at the current timepoint
   */
  function _getTotalAutoVotingUsers() internal view virtual returns (uint208) {
    XAllocationVotingDataTypesV8.AutoVotingStorage storage $ = _getAutoVotingStorage();
    return AutoVotingLogicV8.getTotalAutoVotingUsers($, clock());
  }
}
