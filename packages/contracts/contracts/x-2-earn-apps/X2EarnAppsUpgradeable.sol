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

import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { IX2EarnApps } from "../interfaces/IX2EarnApps.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { X2EarnAppsDataTypes } from "../libraries/X2EarnAppsDataTypes.sol";

/**
 * @title X2EarnAppsUpgradeable
 * @dev Core of x-2-earn applications management, designed to be extended through various modules.
 *
 * This contract is abstract and requires several functions to be implemented in various modules:
 * - a module to handle the storage of the apps and implement {_addApp}, {appExists}, {_updateAppMetadata}, and {_updateAppReceiverAddress} functions
 * - a module to handle the voting Eligibility of the apps and implement {_setVotingEligibility} and {isEligible} functions
 * - a module to handle the authorization to addresses to perform app management and implement {_setAppAdmin}, {_addAppModerator}, {_removeAppModerator} functions
 * - a module to handle the settings of the apps and implement {baseURI} function
 *
 * The inheriting contract should also implement the authorization functions {_authorizeAddApp}, {_authorizeAppManagement}, and {_authorizeAppMetadataUpdate}.
 */
abstract contract X2EarnAppsUpgradeable is Initializable, IX2EarnApps {
  /**
   * @dev Initializes the contract
   */
  function __X2EarnApps_init() internal onlyInitializing {
    __X2EarnApps_init_unchained();
  }

  function __X2EarnApps_init_unchained() internal onlyInitializing {}

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
    _authorizeAddApp();

    _addApp(receiverAddress, admin, appName, appMetadataURI);
  }

  /**
   * @dev See {IX2EarnApps-updateAppReceiverAddress}.
   */
  function updateAppReceiverAddress(bytes32 appId, address newReceiverAddress) public virtual {
    _authorizeAppManagement(appId);

    _updateAppReceiverAddress(appId, newReceiverAddress);
  }

  /**
   * @dev See {IX2EarnApps-updateAppMetadata}.
   */
  function updateAppMetadata(bytes32 appId, string memory newMetadataURI) public virtual {
    _authorizeAppMetadataUpdate(appId);

    _updateAppMetadata(appId, newMetadataURI);
  }

  /**
   * @dev See {IX2EarnApps-setAppAdmin}.
   */
  function setAppAdmin(bytes32 appId, address newAdmin) public virtual {
    _authorizeAppManagement(appId);

    _setAppAdmin(appId, newAdmin);
  }

  /**
   * @dev See {IX2EarnApps-addAppModerator}.
   */
  function addAppModerator(bytes32 appId, address moderator) public virtual {
    _authorizeAppManagement(appId);

    _addAppModerator(appId, moderator);
  }

  /**
   * @dev See {IX2EarnApps-removeAppModerator}.
   */
  function removeAppModerator(bytes32 appId, address moderator) public virtual {
    _authorizeAppManagement(appId);

    _removeAppModerator(appId, moderator);
  }

  /**
   * @dev See {IX2EarnApps-addRewardDistributor}.
   */
  function addRewardDistributor(bytes32 appId, address distributor) public virtual {
    _authorizeAppManagement(appId);

    _addRewardDistributor(appId, distributor);
  }

  /**
   * @dev See {IX2EarnApps-removeRewardDistributor}.
   */
  function removeRewardDistributor(bytes32 appId, address distributor) public virtual {
    _authorizeAppManagement(appId);

    _removeRewardDistributor(appId, distributor);
  }

  /**
   * @dev See {IX2EarnApps-setVotingEligibility}.
   */
  function setVotingEligibility(bytes32 _appId, bool _isEligible) public virtual override {
    _setVotingEligibility(_appId, _isEligible);
  }

  // ---------- Getters ---------- //

  /**
   * @dev Get the baseURI and metadata URI of the app concatenated
   *
   * @param appId the hashed name of the app
   */
  function appURI(bytes32 appId) public view returns (string memory) {
    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    return string(abi.encodePacked(baseURI(), metadataURI(appId)));
  }

  /**
   * @dev Clock used for flagging checkpoints or to retrieve the current block number. Can be overridden to implement timestamp based
   * checkpoints (and voting), in which case {CLOCK_MODE} should be overridden as well to match.
   */
  function clock() public view virtual returns (uint48) {
    return Time.blockNumber();
  }

  /**
   * @dev Machine-readable description of the clock as specified in EIP-6372.
   */
  // solhint-disable-next-line func-name-mixedcase
  function CLOCK_MODE() public view virtual returns (string memory) {
    // Check that the clock was not modified
    if (clock() != Time.blockNumber()) {
      revert ERC6372InconsistentClock();
    }
    return "mode=blocknumber&from=default";
  }

  /**
   * @dev See {IX2EarnApps-hashAppName}.
   */
  function hashAppName(string memory appName) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(appName));
  }

  /**
   * @notice Returns the version of the contract
   * @dev This should be updated every time a new version of implementation is deployed
   * @return sting The version of the contract
   */
  function version() public pure virtual returns (string memory) {
    return "1";
  }

  // --- To be implemented by the inheriting contract --- //

  /**
   * @inheritdoc IX2EarnApps
   */
  function appExists(bytes32 appId) public view virtual returns (bool);

  /**
   * @inheritdoc IX2EarnApps
   */
  function baseURI() public view virtual returns (string memory);

  /**
   * @inheritdoc IX2EarnApps
   */
  function appReceiverAddress(bytes32 appId) public view virtual returns (address);

  /**
   * @dev Function to get the number of apps.
   */
  function appsCount() public view virtual returns (uint256);

  /**
   * @dev Function to get the metadataURI of an app.
   */
  function metadataURI(bytes32 appId) public view virtual returns (string memory);

  /**
   * @dev Function to set the voting Eligibility of an app.
   */
  function _setVotingEligibility(bytes32 _appId, bool _isEligible) internal virtual;

  /**
   * @dev Function to update the admin of the app.
   */
  function _setAppAdmin(bytes32 appId, address admin) internal virtual;

  /**
   * @dev Function to update the receiver address of the app.
   */
  function _updateAppReceiverAddress(bytes32 appId, address newReceiverAddress) internal virtual;

  /**
   * @dev Function to update the metadata URI of the app.
   */
  function _updateAppMetadata(bytes32 appId, string memory metadataURI) internal virtual;

  /**
   * @dev Function to add a moderator to the app.
   */
  function _addAppModerator(bytes32 appId, address moderator) internal virtual;

  /**
   * @dev Function to remove a moderator from the app.
   */
  function _removeAppModerator(bytes32 appId, address moderator) internal virtual;

  /**
   * @dev Function to add a reward distributor to the app.
   */
  function _addRewardDistributor(bytes32 appId, address distributor) internal virtual;

  /**
   * @dev Function to remove a reward distributor from the app.
   */
  function _removeRewardDistributor(bytes32 appId, address distributor) internal virtual;

  /**
   * @dev Save app in storage.
   */
  function _addApp(
    address receiverAddress,
    address admin,
    string memory appName,
    string memory metadataURI
  ) internal virtual;

  /**
   * @dev Function to get the app data by its id.
   */
  function _getAppStorage(bytes32 appId) internal view virtual returns (X2EarnAppsDataTypes.App memory);

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
