// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { IXApps } from "../interfaces/IXApps.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { DataTypes } from "../libraries/DataTypes.sol";

abstract contract X2EarnAppsUpgradeable is Initializable, IXApps {
  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.XApps
  struct XAppsStorage {
    // Mapping from app ID to app
    mapping(bytes32 => DataTypes.App) _apps;
    // List of app IDs to enable retrieval of all _apps
    bytes32[] _appIds;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernor.XApps")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant XAppsStorageLocation = 0xd0d069a754be3c8727b213bc00d418e344adac8f83a7b6d5e0e426a9ddbe0700;

  function _getXAppsStorage() internal pure returns (XAppsStorage storage $) {
    assembly {
      $.slot := XAppsStorageLocation
    }
  }

  modifier exists(bytes32 appId) {
    XAppsStorage storage $ = _getXAppsStorage();
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

    XAppsStorage storage $ = _getXAppsStorage();
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
    XAppsStorage storage $ = _getXAppsStorage();

    return $._apps[appId].receiverAddress != address(0);
  }

  function hashName(string memory appName) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(appName));
  }

  // Function to retrieve an app by ID
  function app(bytes32 appId) public view virtual exists(appId) returns (DataTypes.App memory) {
    XAppsStorage storage $ = _getXAppsStorage();
    return $._apps[appId];
  }

  // Function to retrieve all apps
  function apps() public view returns (DataTypes.App[] memory) {
    XAppsStorage storage $ = _getXAppsStorage();

    DataTypes.App[] memory allApps = new DataTypes.App[]($._appIds.length);
    uint256 length = $._appIds.length;
    for (uint i = 0; i < length; i++) {
      allApps[i] = $._apps[$._appIds[i]];
    }
    return allApps;
  }

  function getAppReceiverAddress(bytes32 appId) public view virtual returns (address) {
    XAppsStorage storage $ = _getXAppsStorage();

    return $._apps[appId].receiverAddress;
  }

  function appURI(bytes32 appId) public view exists(appId) returns (string memory) {
    XAppsStorage storage $ = _getXAppsStorage();

    return string(abi.encodePacked(baseURI(), $._apps[appId].metadataURI));
  }

  function createdAt(bytes32 appId) public view override exists(appId) returns (uint48) {
    XAppsStorage storage $ = _getXAppsStorage();

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
