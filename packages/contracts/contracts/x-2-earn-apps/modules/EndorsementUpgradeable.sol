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

pragma solidity 0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { X2EarnAppsUpgradeable } from "../X2EarnAppsUpgradeable.sol";
import { ITokenAuction } from "../../interfaces/ITokenAuction.sol";
import { X2EarnAppsDataTypes } from "../../libraries/X2EarnAppsDataTypes.sol";

abstract contract EndorsementUpgradeable is Initializable, X2EarnAppsUpgradeable {
  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.Endorsment
  struct EndorsementStorage {
    mapping(bytes32 appId => X2EarnAppsDataTypes.App apps) appsPendingEndorsements; // The pending endorsements for each app

    uint245 gracePeriod; // The cooldown period for the endorsement in cycles
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.X2EarnApps.Endorsement")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant EndorsementStorageLocation =
    0x83b9a7e51f394efa93107c3888716138908bbbe611dfc86afa3639a826441100;

  function _getEndorsementStorage() internal pure returns (ContractSettingsStorage storage $) {
    assembly {
      $.slot := EndorsementStorageLocation
    }
  }

  /**
   * @dev Sets the value for {baseURI}
   */
  function __Endorsement_init(uint256 _gracePeriod) internal onlyInitializing {
    __Endorsement_init_unchained(_gracePeriod);
  }

  function __Endorsement_init_unchained(uint256 _gracePeriod) internal onlyInitializing {
    EndorsementStorage storage $ = _getEndorsementStorage();
    $.gracePeriod = _gracePeriod;
  }

  // ---------- Internal ---------- //

  /**
   * @dev Create app.
   * The id of the app is the hash of the app name.
   * Will be eligible for voting by default from the next round and
   * the team allocation percentage will be 0%.
   *
   * @param teamWalletAddress the address where the app should receive allocation funds
   * @param admin the address of the admin
   * @param appName the name of the app
   * @param metadataURI the metadata URI of the app
   *
   * Emits a {AppAdded} event.
   */
  function _registerApp(
    address teamWalletAddress,
    address admin,
    string memory appName,
    string memory metadataURI
  ) internal {
    if (teamWalletAddress == address(0)) {
      revert X2EarnInvalidAddress(teamWalletAddress);
    }
    if (admin == address(0)) {
      revert X2EarnInvalidAddress(admin);
    }

    EndorsementStorage storage $ = _getEndorsementStorage();
    bytes32 id = hashAppName(appName);

    if (appExists(id)) {
      revert X2EarnAppAlreadyExists(id);
    }

    if (appPendingEndorsment(id)) {
      revert X2EarnAppAlreadyExists(id);
    }

    // Store the new app
    $.pendingEndorsements[id] = X2EarnAppsDataTypes.App(id, appName, block.timestamp);
    _setAppAdmin(id, admin);
    _updateTeamWalletAddress(id, teamWalletAddress);
    _updateAppMetadata(id, metadataURI);
    _setTeamAllocationPercentage(id, 0);

    emit AppPendingEndorsment(id, teamWalletAddress, appName, true);
  }

  /**
   * @dev Internal function to update the grace period.
   *
   * @param gracePeriod The new grace period.
   *
   * Emits a {GracePeriodUpdated} event.
   */
  function _setGracePeriod(uint256 gracePeriod) internal {
    EndorsementStorage storage $ = _getEndorsementStorage();

    emit GracePeriodUpdated($.gracePeriod, gracePeriod);

    $.gracePeriod = gracePeriod;
  }

  function _addAppForEndorsement(bytes32 appId, X2EarnAppsDataTypes.App memory app) internal {
    EndorsementStorage storage $ = _getEndorsementStorage();

    $.appsPendingEndorsements[appId] = app;
  }

  // ---------- Getters ---------- //

  /**
   * @dev See {IX2EarnApps-gracePeriod}.
   */
  function gracePeriod() public view virtual override returns (string memory) {
    ContractSettingsStorage storage $ = _getContractSettingsStorage();

    return $.gracePeriod;
  }

  /**
   * @dev See {IX2EarnApps-appPendingEndorsment}.
   */
  function appPendingEndorsment(bytes32 appId) public view override returns (bool) {
    AppsStorageStorage storage $ = _getAppsStorageStorage();

    return $.appsPendingEndorsements[appId].createdAtTimestamp != 0;
  }
}
