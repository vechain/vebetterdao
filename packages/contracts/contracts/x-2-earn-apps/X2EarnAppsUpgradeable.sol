// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { IX2EarnApps } from "../interfaces/IX2EarnApps.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { DataTypes } from "../libraries/DataTypes.sol";

abstract contract X2EarnAppsUpgradeable is Initializable, IX2EarnApps {
  function __XApps_init() internal onlyInitializing {
    __XApps_init_unchained();
  }

  function __XApps_init_unchained() internal onlyInitializing {}

  // ---------- Setters ---------- //

  function addApp(
    address receiverAddress,
    address admin,
    string memory appName,
    string memory metadataURI
  ) public virtual {
    _authorizeAddApp();

    _addApp(receiverAddress, admin, appName, metadataURI);
  }

  // ---------- Getters ---------- //

  /**
   * @dev Clock used for flagging checkpoints. Can be overridden to implement timestamp based
   * checkpoints (and voting), in which case {CLOCK_MODE} should be overridden as well to match.
   */
  function clock() public view virtual returns (uint48) {
    return Time.blockNumber();
  }

  /**
   * @dev Hashes the name of the app to be used as the app ID.
   */
  function hashName(string memory appName) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(appName));
  }

  // --- To be implemented by the inheriting contract --- //

  function appExists(bytes32 appId) public view virtual returns (bool);

  function _pushAppToEligbleApps(bytes32 appId) internal virtual;

  function _setAppAdmin(bytes32 appId, address admin) internal virtual;

  /**
   * @dev Function that should add an app. Called by {addApp}.
   *
   * @param receiverAddress the address of the app
   * @param admin the address of the admin
   * @param appName the name of the app
   * @param metadataURI the metadata URI of the app
   *
   * Emits a {AppAdded} event.
   */
  function _addApp(
    address receiverAddress,
    address admin,
    string memory appName,
    string memory metadataURI
  ) internal virtual;

  function baseURI() public view virtual returns (string memory);

  /**
   * @dev Function that should revert when `msg.sender` is not authorized to add an app. Called by
   * {addApp}.
   */
  function _authorizeAddApp() internal virtual;

  /**
   * @dev Function that should revert when `msg.sender` is not authorized to sensible updates to an app. Called by
   * {addAppModerator}, {removeAppModerator}, {setAppAdminAddress}, {updateAppReceiverAddress}.
   */
  function _authorizeAppManagement(bytes32 appId) internal virtual;

  /**
   * @dev Function that should revert when `msg.sender` is not authorized to update the app. Called by
   * {updateAppMetadata}.
   */
  function _authorizeAppMetadataUpdate(bytes32 appId) internal virtual;
}
