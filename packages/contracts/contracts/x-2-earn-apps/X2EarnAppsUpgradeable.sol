// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { IX2EarnApps } from "../interfaces/IX2EarnApps.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { DataTypes } from "../libraries/DataTypes.sol";

abstract contract X2EarnAppsUpgradeable is Initializable, IX2EarnApps {
  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.X2EarnAppsUpgradeable
  struct X2EarnAppsStorage {
    // Mapping from app ID to app
    mapping(bytes32 => DataTypes.App) _apps;
    // List of app IDs to enable retrieval of all _apps
    bytes32[] _appIds;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.X2EarnApps.X2EarnAppsUpgradeable")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant X2EarnAppsStorageLocation =
    0xb423b41d65418e0143bc6b14b268b74bdbc6d11d6910765864262835c534cb00;

  function _getX2EarnAppsStorage() internal pure returns (X2EarnAppsStorage storage $) {
    assembly {
      $.slot := X2EarnAppsStorageLocation
    }
  }

  modifier exists(bytes32 appId) {
    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();
    require($._apps[appId].receiverAddress != address(0), "App does not exist");
    _;
  }

  /**
   * @dev Sets the value for {baseURI}
   */
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

    require(receiverAddress != address(0), "XApps: receiverAddress is the zero address");
    require(admin != address(0), "XApps: admin is the zero address");

    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();
    bytes32 id = hashName(appName);

    require($._apps[id].receiverAddress == address(0), "App with this ID already exists");

    // Store the new app
    $._apps[id] = DataTypes.App(id, receiverAddress, admin, appName, metadataURI, clock(), block.timestamp);
    $._appIds.push(id);
    pushAppToEligbleApps(id);

    emit AppAdded(id, receiverAddress, appName, true);
  }

  // ---------- Getters ---------- //

  /**
   * @dev Clock used for flagging checkpoints. Can be overridden to implement timestamp based
   * checkpoints (and voting), in which case {CLOCK_MODE} should be overridden as well to match.
   */
  function clock() public view virtual returns (uint48) {
    return Time.blockNumber();
  }

  function appExists(bytes32 appId) public view override returns (bool) {
    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();

    return $._apps[appId].receiverAddress != address(0);
  }

  function hashName(string memory appName) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(appName));
  }

  // Function to retrieve an app by ID
  function app(bytes32 appId) public view virtual exists(appId) returns (DataTypes.App memory) {
    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();
    return $._apps[appId];
  }

  // Function to retrieve all apps
  function apps() public view returns (DataTypes.App[] memory) {
    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();

    DataTypes.App[] memory allApps = new DataTypes.App[]($._appIds.length);
    uint256 length = $._appIds.length;
    for (uint i = 0; i < length; i++) {
      allApps[i] = $._apps[$._appIds[i]];
    }
    return allApps;
  }

  function getAppReceiverAddress(bytes32 appId) public view virtual returns (address) {
    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();

    return $._apps[appId].receiverAddress;
  }

  function appURI(bytes32 appId) public view exists(appId) returns (string memory) {
    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();

    return string(abi.encodePacked(baseURI(), $._apps[appId].metadataURI));
  }

  function createdAt(bytes32 appId) public view override exists(appId) returns (uint48) {
    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();

    return $._apps[appId].createdAt;
  }

  // --- To be implemented by the inheriting contract --- //

  function pushAppToEligbleApps(bytes32 appId) internal virtual;

  function baseURI() public view virtual returns (string memory);

  /**
   * @dev Function that should revert when `msg.sender` is not authorized to add an app. Called by
   * {addApp}.
   *
   * Normally, this function will use an xref:access.adoc[access control] modifier such as {Ownable-onlyOwner}.
   *
   * ```solidity
   * function _authorizeAddApp(address) internal onlyOwner {}
   * ```
   */
  function _authorizeAddApp() internal virtual;
}
