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
    mapping(bytes32 appId => address[] endorsers) appEndorsers; // Mapping to the endorsers of an app
    mapping(uint8 nodeLevel => uint256 score) nodeEnodorsmentScore; // The endorsement score for each node
    mapping(address endorsers => uint256 nodeId) nodeEndorsers; // The endorsers and their node ID
    mapping(bytes32 appId => uint256 periodsElasapsed) appGracePeriod; // The grace period for the endorsement
    mapping(uint256 => bool) endorsers; // The nodes thatare being used for endorsement
    uint256 gracePeriod; // The grace period for the endorsement in cycles
    ITokenAuction tokenAuction; // The token auction contract
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.X2EarnApps.Endorsement")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant EndorsementStorageLocation =
    0x83b9a7e51f394efa93107c3888716138908bbbe611dfc86afa3639a826441100;

  function _getEndorsementStorage() internal pure returns (EndorsementStorage storage $) {
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

  // ---------- Public ---------- //
  /**
   * @notice Checks endorsements for a given app and updates its voting eligibility based on the endorsements' scores.
   * @dev This function is intended to be called by a cron job prior to the start of each voting round.
   * If the app has less than 100 points, the grace period is increased by 1.
   * If the grace period elapsed by the app is greater than the threshold grace period, the app is marked as not eligible for voting.
   * If an endorser has lost its node status (level 0), it is removed from the endorsers list.
   * @param appId The unique identifier of the app being checked.
   * @return True if the app is eligible for voting.
   */
  function checkEndorsement(bytes32 appId) external returns (bool) {
    EndorsementStorage storage $ = _getEndorsementStorage();

    uint256 score;
    for (uint256 i; i < $.appEndorsers[appId].length; ) {
      address endorser = $.appEndorsers[appId][i];
      uint256 endorserTokenID = $.tokenAuction.ownerToId(endorser);
      (,uint8 nodeLevel,,,,,) = $.tokenAuction.getMetadata(endorserTokenID);

      if (nodeLevel == 0) {
        // Remove endorser by swapping with the last element and then reducing the length
        $.appEndorsers[appId][i] = $.appEndorsers[appId][$.appEndorsers[appId].length - 1];
        $.appEndorsers[appId].pop();
      } else {
        score += $.nodeEnodorsmentScore[nodeLevel];
        i++; // Only increment i if we didn't remove an endorser
      }
    }

    // Check the total score and update the grace period and voting eligibility accordingly
    if (score < 100) {
      $.appGracePeriod[appId] += 1;
      if ($.appGracePeriod[appId] > $.gracePeriod) {
        _setVotingEligibility(appId, false);
        return false;
      }
    } else if ($.appGracePeriod[appId] > 0) {
      $.appGracePeriod[appId] = 0;
      _setVotingEligibility(appId, true);
    }

    return true;
  }

  // ---------- Internal ---------- //

  /**
   * @dev Create app.
   * The id of the app is the hash of the app name.
   * Will be pending endorsement.
   *
   * @param teamWalletAddress the address where the app should receive allocation funds
   * @param admin the address of the admin
   * @param appName the name of the app
   * @param metadataURI the metadata URI of the app
   *
   * Emits a {AppPendingEndorsment} event.
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
    $.appsPendingEndorsements[id] = X2EarnAppsDataTypes.App(id, appName, block.timestamp);
    _setAppAdmin(id, admin);
    _updateTeamWalletAddress(id, teamWalletAddress);
    _updateAppMetadata(id, metadataURI);
    _setTeamAllocationPercentage(id, 0);

    emit AppPendingEndorsment(id, teamWalletAddress, appName);
  }

  /**
   * @dev Internal function to update the grace period.
   *
   * @param _gracePeriod The new grace period.
   *
   * Emits a {GracePeriodUpdated} event.
   */
  function _setGracePeriod(uint256 _gracePeriod) internal {
    EndorsementStorage storage $ = _getEndorsementStorage();

    emit GracePeriodUpdated($.gracePeriod, _gracePeriod);

    $.gracePeriod = _gracePeriod;
  }

  // ---------- Getters ---------- //

  /**
   * @dev See {IX2EarnApps-gracePeriod}.
   */
  function gracePeriod() public view virtual override returns (uint256) {
    EndorsementStorage storage $ = _getEndorsementStorage();

    return $.gracePeriod;
  }

  /**
   * @dev See {IX2EarnApps-appPendingEndorsment}.
   */
  function appPendingEndorsment(bytes32 appId) public view override returns (bool) {
    EndorsementStorage storage $ = _getEndorsementStorage();

    return $.appsPendingEndorsements[appId].createdAtTimestamp != 0;
  }
}
