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

/**
 * @title AdministrationUpgradeable
 * @dev Contract module that provides the administration functionalities of the x2earn apps.
 * Each app has an admin and a list of moderators that can manage the app:
 * - Admin can add/remove moderators, change the admin address, update the receiver address and allocation percentage,
 * add/remove reward distributor addresses, and update the metadata URI
 * - Moderators can manage the app metadata
 */
abstract contract AdministrationUpgradeable is Initializable, X2EarnAppsUpgradeable {
  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.Administration
  struct AdministrationStorage {
    mapping(bytes32 appId => address) _admin;
    mapping(bytes32 appId => address[]) _moderators;
    mapping(bytes32 appId => address[]) _rewardDistributors; // addresses that can distribute rewards from X2EarnRewardsPool
    mapping(bytes32 appId => address) _receiverAddress;
    mapping(bytes32 appId => uint256) _receiverAllocationPercentage; // percentage of the allocation funds that the receiver address gets
    mapping(bytes32 appId => string) _metadataURI;
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
   * @dev See {IX2EarnApps-setAppAdmin}.
   */
  function setAppAdmin(bytes32 appId, address newAdmin) public virtual override {
    _setAppAdmin(appId, newAdmin);
  }

  /**
   * @dev See {IX2EarnApps-addAppModerator}.
   */
  function addAppModerator(bytes32 appId, address moderator) public virtual override {
    _addAppModerator(appId, moderator);
  }

  /**
   * @dev See {IX2EarnApps-removeAppModerator}.
   */
  function removeAppModerator(bytes32 appId, address moderator) public virtual override {
    _removeAppModerator(appId, moderator);
  }

  /**
   * @dev See {IX2EarnApps-addRewardDistributor}.
   */
  function addRewardDistributor(bytes32 appId, address distributor) public virtual override {
    _addRewardDistributor(appId, distributor);
  }

  /**
   * @dev See {IX2EarnApps-removeRewardDistributor}.
   */
  function removeRewardDistributor(bytes32 appId, address distributor) public virtual override {
    _removeRewardDistributor(appId, distributor);
  }

  /**
   * @dev See {IX2EarnApps-updateAppReceiverAddress}.
   */
  function updateAppReceiverAddress(bytes32 appId, address newReceiverAddress) public virtual override {
    _updateAppReceiverAddress(appId, newReceiverAddress);
  }

  /**
   * @dev See {IX2EarnApps-updateReceiverAllocationPercentage}.
   */
  function updateReceiverAllocationPercentage(bytes32 appId, uint256 percentage) public virtual override {
    _updateReceiverAllocationPercentage(appId, percentage);
  }

  /**
   * @dev See {IX2EarnApps-updateAppMetadata}.
   */
  function updateAppMetadata(bytes32 appId, string memory newMetadataURI) public virtual override {
    _updateAppMetadata(appId, newMetadataURI);
  }

  // ---------- Getters ---------- //

  /**
   * @dev Check if an account is the admin of the app
   *
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isAppAdmin(bytes32 appId, address account) public view returns (bool) {
    AdministrationStorage storage $ = _getAdministrationStorage();

    return $._admin[appId] == account;
  }

  /**
   * @dev See {IX2EarnApps-appAdmin}
   */
  function appAdmin(bytes32 appId) public view override returns (address) {
    AdministrationStorage storage $ = _getAdministrationStorage();

    return $._admin[appId];
  }

  /**
   * @dev Returns the list of moderators of the app
   *
   * @param appId the hashed name of the app
   */
  function appModerators(bytes32 appId) public view override returns (address[] memory) {
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

  /**
   * @dev Get the receiver address of the app
   *
   * @param appId the hashed name of the app
   */
  function appReceiverAddress(bytes32 appId) public view override returns (address) {
    AdministrationStorage storage $ = _getAdministrationStorage();

    return $._receiverAddress[appId];
  }

  /**
   * @dev Function to get the percentage of the allocation of the receiver address each round.
   *
   * @param appId the app id
   */
  function receiverAllocationPercentage(bytes32 appId) public view override returns (uint256) {
    AdministrationStorage storage $ = _getAdministrationStorage();

    return $._receiverAllocationPercentage[appId];
  }

  /**
   * @dev Returns the list of reward distributors of the app
   *
   * @param appId the hashed name of the app
   */
  function appRewardDistributors(bytes32 appId) public view returns (address[] memory) {
    AdministrationStorage storage $ = _getAdministrationStorage();

    return $._rewardDistributors[appId];
  }

  /**
   * @dev Returns true if an account is a reward distributor of the app
   *
   * @param appId the hashed name of the app
   * @param account the address of the account
   */
  function isRewardDistributor(bytes32 appId, address account) public view returns (bool) {
    AdministrationStorage storage $ = _getAdministrationStorage();

    address[] memory distributors = $._rewardDistributors[appId];
    for (uint256 i = 0; i < distributors.length; i++) {
      if (distributors[i] == account) {
        return true;
      }
    }

    return false;
  }

  /**
   * @dev Get the metadata URI of the app
   *
   * @param appId the app id
   */
  function metadataURI(bytes32 appId) public view override returns (string memory) {
    AdministrationStorage storage $ = _getAdministrationStorage();

    return $._metadataURI[appId];
  }

  // ---------- Internal ---------- //
  /**
   * @dev Internal function to set the admin address of the app
   *
   * @param appId the hashed name of the app
   * @param newAdmin the address of the new admin
   */
  function _setAppAdmin(bytes32 appId, address newAdmin) internal override {
    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    if (newAdmin == address(0)) {
      revert X2EarnInvalidAddress(newAdmin);
    }

    AdministrationStorage storage $ = _getAdministrationStorage();

    emit AppAdminUpdated(appId, $._admin[appId], newAdmin);

    $._admin[appId] = newAdmin;
  }

  /**
   * @dev Internal function to add a moderator to the app
   *
   * @param appId the hashed name of the app
   * @param moderator the address of the moderator
   */
  function _addAppModerator(bytes32 appId, address moderator) internal {
    if (moderator == address(0)) {
      revert X2EarnInvalidAddress(moderator);
    }

    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    AdministrationStorage storage $ = _getAdministrationStorage();

    $._moderators[appId].push(moderator);

    emit ModeratorAddedToApp(appId, moderator);
  }

  /**
   * @dev Internal function to remove a moderator from the app
   *
   * @param appId the hashed name of the app
   * @param moderator the address of the moderator
   */
  function _removeAppModerator(bytes32 appId, address moderator) internal {
    if (moderator == address(0)) {
      revert X2EarnInvalidAddress(moderator);
    }

    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    AdministrationStorage storage $ = _getAdministrationStorage();

    address[] storage moderators = $._moderators[appId];
    for (uint256 i = 0; i < moderators.length; i++) {
      if (moderators[i] == moderator) {
        moderators[i] = moderators[moderators.length - 1];
        moderators.pop();
        emit ModeratorRemovedFromApp(appId, moderator);
        break;
      }
    }
  }

  /**
   * @dev Internal function to add a reward distributor to the app
   *
   * @param appId the hashed name of the app
   * @param distributor the address of the reward distributor
   */
  function _addRewardDistributor(bytes32 appId, address distributor) internal {
    if (distributor == address(0)) {
      revert X2EarnInvalidAddress(distributor);
    }

    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    AdministrationStorage storage $ = _getAdministrationStorage();

    $._rewardDistributors[appId].push(distributor);

    emit RewardDistributorAddedToApp(appId, distributor);
  }

  /**
   * @dev Internal function to remove a reward distributor from the app
   *
   * @param appId the hashed name of the app
   * @param distributor the address of the reward distributor
   */
  function _removeRewardDistributor(bytes32 appId, address distributor) internal {
    if (distributor == address(0)) {
      revert X2EarnInvalidAddress(distributor);
    }

    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    AdministrationStorage storage $ = _getAdministrationStorage();

    address[] storage distributors = $._rewardDistributors[appId];
    for (uint256 i = 0; i < distributors.length; i++) {
      if (distributors[i] == distributor) {
        distributors[i] = distributors[distributors.length - 1];
        distributors.pop();
        emit RewardDistributorRemovedFromApp(appId, distributor);
        break;
      }
    }
  }

  /**
   * @dev Update the address where the x2earn app receives allocation funds
   *
   * @param appId the hashed name of the app
   * @param newReceiverAddress the address of the new receiver
   */
  function _updateAppReceiverAddress(bytes32 appId, address newReceiverAddress) internal override {
    if (newReceiverAddress == address(0)) {
      revert X2EarnInvalidAddress(newReceiverAddress);
    }

    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    AdministrationStorage storage $ = _getAdministrationStorage();
    address oldReceiverAddress = $._receiverAddress[appId];
    $._receiverAddress[appId] = newReceiverAddress;

    emit AppReceiverAddressUpdated(appId, oldReceiverAddress, newReceiverAddress);
  }

  /**
   * @dev Update the metadata URI of the app
   *
   * @param appId the hashed name of the app
   * @param newMetadataURI the metadata URI of the app
   *
   * Emits a {AppMetadataURIUpdated} event.
   */
  function _updateAppMetadata(bytes32 appId, string memory newMetadataURI) internal override {
    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    AdministrationStorage storage $ = _getAdministrationStorage();
    string memory oldMetadataURI = $._metadataURI[appId];
    $._metadataURI[appId] = newMetadataURI;

    emit AppMetadataURIUpdated(appId, oldMetadataURI, newMetadataURI);
  }

  /**
   * @dev Update the allocation percentage of the receiver address
   *
   * @param appId the app id
   * @param newAllocationPercentage the new allocation percentage
   */
  function _updateReceiverAllocationPercentage(
    bytes32 appId,
    uint256 newAllocationPercentage
  ) internal virtual override {
    if (newAllocationPercentage > 100) {
      revert X2EarnInvalidAllocationPercentage(newAllocationPercentage);
    }

    AdministrationStorage storage $ = _getAdministrationStorage();
    uint256 oldAllocationPercentage = $._receiverAllocationPercentage[appId];
    $._receiverAllocationPercentage[appId] = newAllocationPercentage;

    emit ReceiverAllocationPercentageUpdated(appId, oldAllocationPercentage, newAllocationPercentage);
  }
}
