// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { DataTypes } from "../../libraries/DataTypes.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { X2EarnAppsUpgradeable } from "../X2EarnAppsUpgradeable.sol";

abstract contract Administration is Initializable, X2EarnAppsUpgradeable {
  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.Administration
  struct AdministrationStorage {
    mapping(bytes32 => address[]) _moderators;
    mapping(bytes32 => address) _admin;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.X2EarnApps.Administration")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant AdministrationStorageLocation =
    0x5830f0e95c01712d916c34d9e2fa42e9f749b325b67bce7382d70bb99c623500;

  function _getAdministrationStorage() internal pure returns (AdministrationStorage storage $) {
    assembly {
      $.slot := AdministrationStorageLocation
    }
  }

  /**
   * @dev Initializes the contract
   */
  function __Administration_init() internal onlyInitializing {
    __Administration_init_unchained();
  }

  function __Administration_init_unchained() internal onlyInitializing {}

  // ---------- Setters ---------- //

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

    AdministrationStorage storage $ = _getAdministrationStorage();

    $._admin[appId] = newAdmin;
  }

  /**
   * @dev Add a moderator to the app
   *
   * @param appId the hashed name of the app
   * @param moderator the address of the moderator
   */
  function addAppModerator(bytes32 appId, address moderator) external virtual exists(appId) {
    _authorizeAppManagement(appId);

    AdministrationStorage storage $ = _getAdministrationStorage();

    $._moderators[appId].push(moderator);
  }

  /**
   * @dev Remove a moderator from the app
   *
   * @param appId the hashed name of the app
   * @param moderator the address of the moderator
   */
  function removeAppModerator(bytes32 appId, address moderator) external exists(appId) {
    _authorizeAppManagement(appId);

    AdministrationStorage storage $ = _getAdministrationStorage();

    address[] storage moderators = $._moderators[appId];
    for (uint256 i = 0; i < moderators.length; i++) {
      if (moderators[i] == moderator) {
        moderators[i] = moderators[moderators.length - 1];
        moderators.pop();
        break;
      }
    }
  }

  // ---------- Getters ---------- //

  /**
   * @dev Returns true if an account is the admin of the app
   *
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isAppAdmin(bytes32 appId, address account) public view returns (bool) {
    AdministrationStorage storage $ = _getAdministrationStorage();

    return $._admin[appId] == account;
  }

  /**
   * @dev Returns the admin address of the app
   *
   * @param appId the hashed name of the app
   */
  function appAdmin(bytes32 appId) public view returns (address) {
    AdministrationStorage storage $ = _getAdministrationStorage();

    return $._admin[appId];
  }

  /**
   * @dev Returns the list of moderators of the app
   *
   * @param appId the hashed name of the app
   */
  function appModerators(bytes32 appId) public view returns (address[] memory) {
    AdministrationStorage storage $ = _getAdministrationStorage();

    return $._moderators[appId];
  }

  /**
   * @dev Returns true if an account is moderator of the app
   *
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isAppModerator(bytes32 appId, address account) public view returns (bool) {
    AdministrationStorage storage $ = _getAdministrationStorage();

    address[] memory moderators = $._moderators[appId];
    for (uint256 i = 0; i < moderators.length; i++) {
      if (moderators[i] == account) {
        return true;
      }
    }

    return false;
  }
}
