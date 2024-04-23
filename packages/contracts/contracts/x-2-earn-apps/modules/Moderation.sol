// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { DataTypes } from "../../libraries/DataTypes.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { X2EarnAppsUpgradeable } from "../X2EarnAppsUpgradeable.sol";

abstract contract Moderation is Initializable, X2EarnAppsUpgradeable {
  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.Moderation
  struct ModerationStorage {
    mapping(bytes32 => address[]) _appModerators;
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
   * @dev Returns true if an account is the admin of the app
   *
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isAppAdmin(bytes32 appId, address account) public view returns (bool) {
    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();

    return $._apps[appId].admin == account;
  }

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
   * @dev Update the admin address of the app
   *
   * @param appId the hashed name of the app
   * @param newAdmin the address of the new admin
   */
  function updateAppAdminAddress(bytes32 appId, address newAdmin) external exists(appId) {
    _authorizeAppManagement(appId);

    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();

    $._apps[appId].admin = newAdmin;
  }

  /**
   * @dev Update the metadata URI of the app
   *
   * @param appId the hashed name of the app
   * @param metadataURI the metadata URI of the app
   */
  function updateAppMetadata(bytes32 appId, string memory metadataURI) external exists(appId) {
    _authorizeAppMetadataUpdate(appId);
    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();

    $._apps[appId].metadataURI = metadataURI;
  }

  /**
   * @dev Update the address where the x2earn app receives allocation funds
   *
   * @param appId the hashed name of the app
   * @param newReceiverAddress the address of the new receiver
   */
  function updateAppReceiverAddress(bytes32 appId, address newReceiverAddress) external exists(appId) {
    _authorizeAppManagement(appId);

    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();

    $._apps[appId].receiverAddress = newReceiverAddress;
  }

  /**
   * @dev Function that should revert when `msg.sender` is not authorized to sensible updates to an app. Called by
   * {addAppModerator}, {removeAppModerator}, {updateAppAdminAddress}, {updateAppReceiverAddress}.
   */
  function _authorizeAppManagement(bytes32 appId) internal virtual;

  /**
   * @dev Function that should revert when `msg.sender` is not authorized to update the app. Called by
   * {updateAppMetadata}.
   */
  function _authorizeAppMetadataUpdate(bytes32 appId) internal virtual;
}
