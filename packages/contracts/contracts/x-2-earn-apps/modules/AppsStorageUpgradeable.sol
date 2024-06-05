// SPDX-License-Identifier: MIT

//                                      #######
//                                 ################
//                               ####################
//                             ###########   #########
//                            #########      #########
//          #######          #########       #########
//          #########       #########      ##########
//           ##########     ########     ####################
//            ##########   #########  #########################
//              ################### ############################
//               #################  ##########          ########
//                 ##############      ###              ########
//                  ############                       #########
//                    ##########                     ##########
//                     ########                    ###########
//                       ###                    ############
//                                          ##############
//                                    #################
//                                   ##############
//                                   #########

pragma solidity ^0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { X2EarnAppsUpgradeable } from "../X2EarnAppsUpgradeable.sol";
import { X2EarnAppsDataTypes } from "../../libraries/X2EarnAppsDataTypes.sol";

/**
 * @title AppsStorageUpgradeable
 * @dev Contract to manage the x2earn apps storage.
 * Through this contract, the x2earn apps can be added, retrieved, indexed, and managed (update metadata and receiver address).
 */
abstract contract AppsStorageUpgradeable is Initializable, X2EarnAppsUpgradeable {
  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.AppsStorage
  struct AppsStorageStorage {
    // Mapping from app ID to app
    mapping(bytes32 appId => X2EarnAppsDataTypes.App) _apps;
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

  // ---------- Setters ---------- //

  /**
   * @dev See {IX2EarnApps-addApp}.
   */
  function addApp(
    address receiverAddress,
    address admin,
    string memory appName,
    string memory appMetadataURI
  ) public virtual {
    _addApp(receiverAddress, admin, appName, appMetadataURI);
  }

  // ---------- Getters ---------- //
  /**
   * @dev See {IX2EarnApps-appExists}.
   */
  function appExists(bytes32 appId) public view override returns (bool) {
    AppsStorageStorage storage $ = _getAppsStorageStorage();

    return $._apps[appId].createdAtTimestamp != 0;
  }

  /**
   * @dev See {IX2EarnApps-app}.
   *
   * @param appId the id of the app
   */
  function app(bytes32 appId) public view virtual override returns (X2EarnAppsDataTypes.AppWithDetails memory) {
    X2EarnAppsDataTypes.App memory _app = _getAppStorage(appId);

    return
      X2EarnAppsDataTypes.AppWithDetails(
        _app.id,
        appReceiverAddress(appId),
        _app.name,
        metadataURI(appId),
        _app.createdAtTimestamp,
        appAdmin(_app.id),
        appModerators(_app.id),
        receiverAllocationPercentage(_app.id),
        isEligibleNow(_app.id)
      );
  }

  /**
   * @dev Get all apps
   */
  function apps() public view returns (X2EarnAppsDataTypes.AppWithDetails[] memory) {
    AppsStorageStorage storage $ = _getAppsStorageStorage();

    X2EarnAppsDataTypes.AppWithDetails[] memory allApps = new X2EarnAppsDataTypes.AppWithDetails[]($._appIds.length);
    uint256 length = $._appIds.length;
    for (uint i = 0; i < length; i++) {
      X2EarnAppsDataTypes.App memory _app = $._apps[$._appIds[i]];
      allApps[i] = X2EarnAppsDataTypes.AppWithDetails(
        _app.id,
        appReceiverAddress(_app.id),
        _app.name,
        metadataURI(_app.id),
        _app.createdAtTimestamp,
        appAdmin(_app.id),
        appModerators(_app.id),
        receiverAllocationPercentage(_app.id),
        isEligibleNow(_app.id)
      );
    }
    return allApps;
  }

  /**
   * @dev See {IX2EarnApps-appsCount}.
   */
  function appsCount() public view returns (uint256) {
    AppsStorageStorage storage $ = _getAppsStorageStorage();
    return $._appIds.length;
  }

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
  function _addApp(address receiverAddress, address admin, string memory appName, string memory metadataURI) internal {
    if (receiverAddress == address(0)) {
      revert X2EarnInvalidAddress(receiverAddress);
    }
    if (admin == address(0)) {
      revert X2EarnInvalidAddress(admin);
    }

    AppsStorageStorage storage $ = _getAppsStorageStorage();
    bytes32 id = hashAppName(appName);

    if (appExists(id)) {
      revert X2EarnAppAlreadyExists(id);
    }

    // Store the new app
    $._apps[id] = X2EarnAppsDataTypes.App(id, appName, block.timestamp);
    $._appIds.push(id);
    _setAppAdmin(id, admin);
    _setVotingEligibility(id, true);
    _updateAppReceiverAddress(id, receiverAddress);
    _updateAppMetadata(id, metadataURI);

    emit AppAdded(id, receiverAddress, appName, true);
  }

  /**
   * @dev Get the app data saved in storage
   *
   * @param appId the if of the app
   */
  function _getAppStorage(bytes32 appId) internal view returns (X2EarnAppsDataTypes.App memory) {
    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    AppsStorageStorage storage $ = _getAppsStorageStorage();
    return $._apps[appId];
  }
}
