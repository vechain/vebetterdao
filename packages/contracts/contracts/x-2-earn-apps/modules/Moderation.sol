// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { DataTypes } from "../../libraries/DataTypes.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { X2EarnAppsUpgradeable } from "../X2EarnAppsUpgradeable.sol";

abstract contract Moderation is Initializable, X2EarnAppsUpgradeable {
  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.Moderation
  struct ModerationStorage {
    mapping(bytes32 => address[]) _appModerators;
    mapping(bytes32 => address) _admin;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.X2EarnApps.Moderation")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant ModerationStorageLocation =
    0x3afe0a34e7e49fed8548e2cced017fb9ddf26feed8e8f54514897fdcd4779800;

  function _getModerationStorage() internal pure returns (ModerationStorage storage $) {
    assembly {
      $.slot := ModerationStorageLocation
    }
  }

  /**
   * @dev Initializes the contract
   */
  function __Moderation_init() internal onlyInitializing {
    __Moderation_init_unchained();
  }

  function __Moderation_init_unchained() internal onlyInitializing {}

  /////// Admin ///////

  /**
   * @dev Returns true if an account is the admin of the app
   *
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isAppAdmin(bytes32 appId, address account) public view returns (bool) {
    ModerationStorage storage $ = _getModerationStorage();

    return $._admin[appId] == account;
  }

  /**
   * @dev Returns the admin address of the app
   *
   * @param appId the hashed name of the app
   */
  function admin(bytes32 appId) public view returns (address) {
    ModerationStorage storage $ = _getModerationStorage();

    return $._admin[appId];
  }

  /**
   * @dev Update the admin address of the app
   *
   * @param appId the hashed name of the app
   * @param newAdmin the address of the new admin
   */
  function setAppAdmin(bytes32 appId, address newAdmin) external exists(appId) {
    _authorizeAppManagement(appId);

    _setAppAdmin(appId, newAdmin);
  }

  /**
   * @dev Internal function to set the admin address of the app
   *
   * @param appId the hashed name of the app
   * @param newAdmin the address of the new admin
   */
  function _setAppAdmin(bytes32 appId, address newAdmin) internal virtual override exists(appId) {
    require(newAdmin != address(0), "XApps: admin is the zero address");

    ModerationStorage storage $ = _getModerationStorage();

    $._admin[appId] = newAdmin;
  }

  /////// Moderators ///////

  /**
   * @dev Add a moderator to the app
   *
   * @param appId the hashed name of the app
   * @param moderator the address of the moderator
   */
  function addAppModerator(bytes32 appId, address moderator) external virtual exists(appId) {
    _authorizeAppManagement(appId);

    ModerationStorage storage $ = _getModerationStorage();

    $._appModerators[appId].push(moderator);
  }

  /**
   * @dev Remove a moderator from the app
   *
   * @param appId the hashed name of the app
   * @param moderator the address of the moderator
   */
  function removeAppModerator(bytes32 appId, address moderator) external exists(appId) {
    _authorizeAppManagement(appId);

    ModerationStorage storage $ = _getModerationStorage();

    address[] storage moderators = $._appModerators[appId];
    for (uint256 i = 0; i < moderators.length; i++) {
      if (moderators[i] == moderator) {
        moderators[i] = moderators[moderators.length - 1];
        moderators.pop();
        break;
      }
    }
  }

  /**
   * @dev Returns the list of moderators of the app
   *
   * @param appId the hashed name of the app
   */
  function appModerators(bytes32 appId) public view returns (address[] memory) {
    ModerationStorage storage $ = _getModerationStorage();

    return $._appModerators[appId];
  }

  /**
   * @dev Returns true if an account is moderator of the app
   *
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isAppModerator(bytes32 appId, address account) public view returns (bool) {
    ModerationStorage storage $ = _getModerationStorage();

    address[] memory moderators = $._appModerators[appId];
    for (uint256 i = 0; i < moderators.length; i++) {
      if (moderators[i] == account) {
        return true;
      }
    }

    return false;
  }
}
