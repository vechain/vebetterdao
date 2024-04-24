// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { DataTypes } from "../libraries/DataTypes.sol";

interface IX2EarnApps {
  /**
   * @dev The clock was incorrectly modified.
   */
  error ERC6372InconsistentClock();

  /**
   * @dev The `appId` doesn't exist.
   */
  error X2EarnNonexistentApp(bytes32 appId);

  /**
   * @dev The `addr` is not valid (eg: is the ZERO ADDRESS).
   */
  error X2EarnInvalidAddress(address addr);

  /**
   * @dev An app with the specified `appId` already exists.
   */
  error X2EarnAppAlreadyExists(bytes32 appId);

  /**
   * @dev The user is not authorized to perform the action.
   */
  error X2EarnUnauthorizedUser(address user);

  /**
   * @dev Lookup to future votes is not available.
   */
  error ERC5805FutureLookup(uint256 timepoint, uint48 clock);

  /**
   * @dev Event fired when a new app is added.
   */
  event AppAdded(bytes32 indexed id, address addr, string name, bool appAvailableForAllocationVoting);

  /**
   * @dev Event fired when an app elegibility for allocation voting changes.
   */
  event VotingElegibilityChanged(bytes32 indexed appId, bool isAvailable);

  /**
   * @dev Generates the hash of the app name to be used as the app id.
   *
   * @param name the name of the app
   */
  function hashAppName(string memory name) external pure returns (bytes32);

  function addApp(address receiverAddress, address admin, string memory appName, string memory metadataURI) external;

  function app(bytes32 appId) external view returns (DataTypes.App memory);

  function addAppModerator(bytes32 appId, address moderator) external;

  function removeAppModerator(bytes32 appId, address moderator) external;

  function setAppAdmin(bytes32 appId, address admin) external;

  function updateAppReceiverAddress(bytes32 appId, address newReceiverAddress) external;

  function updateAppMetadata(bytes32 appId, string memory metadataURI) external;

  function appAdmin(bytes32 appId) external view returns (address);

  function getAppReceiverAddress(bytes32 appId) external view returns (address);

  function createdAt(bytes32 appId) external view returns (uint48);

  function appExists(bytes32 appId) external view returns (bool);

  function setVotingElegibility(bytes32 _appId, bool _isElegible) external;

  function allElegibleApps() external view returns (bytes32[] memory);

  function isElegible(bytes32 appId, uint256 timepoint) external view returns (bool);

  function isElegibleNow(bytes32 appId) external view returns (bool);

  /**
   * @dev Update the base URI to retrieve the metadata of the x2earn apps
   *
   * @param baseUri the base URI for the contract
   */
  function setBaseURI(string memory baseUri) external;
}
