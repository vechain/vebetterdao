// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { DataTypes } from "../../libraries/DataTypes.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { X2EarnAppsUpgradeable } from "../X2EarnAppsUpgradeable.sol";

abstract contract AppsStorage is Initializable, X2EarnAppsUpgradeable {
  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.AppsStorage
  struct AppsStorageStorage {
    // Mapping from app ID to app
    mapping(bytes32 => DataTypes.App) _apps;
    // List of app IDs to enable retrieval of all _apps
    bytes32[] _appIds;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.X2EarnApps.AppsStorage")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant AppsStorageStorageLocation =
    0xb6909058bd527140b8d55a44344c5e42f1f148f1b3b16df7641882df8dd72900;

  function _getAppsStorageStorage() internal pure returns (AppsStorageStorage storage $) {
    assembly {
      $.slot := AppsStorageStorageLocation
    }
  }

  /**
   * @dev Initializes the contract
   */
  function __AppsStorage_init() internal onlyInitializing {
    __AppsStorage_init_unchained();
  }

  function __AppsStorage_init_unchained() internal onlyInitializing {}

  // ---------- Internal ---------- //

  /**
   * @dev Internal function that should add an app. Called by {addApp}.
   *
   * @param receiverAddress the address where the app should receive allocation funds
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
  ) internal virtual override {
    AppsStorageStorage storage $ = _getAppsStorageStorage();
    bytes32 id = hashName(appName);

    require($._apps[id].receiverAddress == address(0), "App with this ID already exists");

    // Store the new app
    $._apps[id] = DataTypes.App(id, receiverAddress, appName, metadataURI, clock(), block.timestamp);
    $._appIds.push(id);
    _setAppAdmin(id, admin);
    _pushAppToEligbleApps(id);

    emit AppAdded(id, receiverAddress, appName, true);
  }

  // ---------- Setters ---------- //
  /**
   * @dev Update the metadata URI of the app
   *
   * @param appId the hashed name of the app
   * @param metadataURI the metadata URI of the app
   */
  function updateAppMetadata(bytes32 appId, string memory metadataURI) external {
    require(appExists(appId), "XApps: app does not exist");

    _authorizeAppMetadataUpdate(appId);
    AppsStorageStorage storage $ = _getAppsStorageStorage();

    $._apps[appId].metadataURI = metadataURI;
  }

  /**
   * @dev Update the address where the x2earn app receives allocation funds
   *
   * @param appId the hashed name of the app
   * @param newReceiverAddress the address of the new receiver
   */
  function updateAppReceiverAddress(bytes32 appId, address newReceiverAddress) external {
    require(appExists(appId), "XApps: app does not exist");

    _authorizeAppManagement(appId);

    AppsStorageStorage storage $ = _getAppsStorageStorage();

    $._apps[appId].receiverAddress = newReceiverAddress;
  }

  function appExists(bytes32 appId) public view override returns (bool) {
    AppsStorageStorage storage $ = _getAppsStorageStorage();

    return $._apps[appId].receiverAddress != address(0);
  }

  // ---------- Getters ---------- //
  // Function to retrieve an app by ID
  function app(bytes32 appId) public view virtual returns (DataTypes.App memory) {
    require(appExists(appId), "XApps: app does not exist");

    AppsStorageStorage storage $ = _getAppsStorageStorage();
    return $._apps[appId];
  }

  // Function to retrieve all apps
  function apps() public view returns (DataTypes.App[] memory) {
    AppsStorageStorage storage $ = _getAppsStorageStorage();

    DataTypes.App[] memory allApps = new DataTypes.App[]($._appIds.length);
    uint256 length = $._appIds.length;
    for (uint i = 0; i < length; i++) {
      allApps[i] = $._apps[$._appIds[i]];
    }
    return allApps;
  }

  function getAppReceiverAddress(bytes32 appId) public view virtual returns (address) {
    AppsStorageStorage storage $ = _getAppsStorageStorage();

    return $._apps[appId].receiverAddress;
  }

  function appURI(bytes32 appId) public view returns (string memory) {
    require(appExists(appId), "XApps: app does not exist");

    AppsStorageStorage storage $ = _getAppsStorageStorage();

    return string(abi.encodePacked(baseURI(), $._apps[appId].metadataURI));
  }

  function createdAt(bytes32 appId) public view override returns (uint48) {
    require(appExists(appId), "XApps: app does not exist");

    AppsStorageStorage storage $ = _getAppsStorageStorage();

    return $._apps[appId].createdAt;
  }
}
