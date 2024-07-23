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
    bytes32[] _unendorsedApps; // List of apps pending endorsement
    mapping(bytes32 => uint256) _unendorsedAppsIndex; // Mapping from app ID to index in the _unendorsedApps array, so we can remove an app in O(1)
    mapping(bytes32 => address[]) _appEndorsers; // Mapping to the endorsers of an app
    mapping(uint8 => uint256) _nodeEnodorsmentScore; // The endorsement score for each node level
    mapping(bytes32 => uint256) _appGracePeriod; // The grace period elapsed by the app since endorsed
    mapping(address => bool) endorsers; // Mapping to check if an address is an endorser
    uint256 _gracePeriodDuration; // The grace period threshold for no endorsement in blocks
    ITokenAuction _tokenAuctionContract; // The token auction contract
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
   * @param gracePeriodDuration The initial grace period.
   */
  function __Endorsement_init(uint256 gracePeriodDuration) internal onlyInitializing {
    __Endorsement_init_unchained(gracePeriodDuration);
  }

  function __Endorsement_init_unchained(uint256 gracePeriodDuration) internal onlyInitializing {
    EndorsementStorage storage $ = _getEndorsementStorage();
    $._gracePeriodDuration = gracePeriodDuration;
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
    // Get the endorsement storage
    EndorsementStorage storage $ = _getEndorsementStorage();

    // Calculate the score of the app, considering if any endorser needs to be removed
    uint256 score = _getScore(appId, address(0));

    // Check the total score and update the grace period and voting eligibility accordingly
    if (score < 100) {
      if ($._appGracePeriod[appId] == 0) {
        $._appGracePeriod[appId] = clock() + $._gracePeriodDuration;
      } else if ($._appGracePeriod[appId] > clock() && isEligibleNow(appId)) {
        // Mark the app as not eligible for voting
        _setVotingEligibility(appId, false);

        // Update the endorsement status
        _setEndorsementStatus(appId, false);

        // Return false indicating the app is not eligible for voting
        return false;
      }
    } else if ($._appGracePeriod[appId] > 0) {
      // If the app is not eligible for voting, mark the app as eligible for voting
      if (!isEligibleNow(appId)) {
        // Mark the app as eligible for voting
        _setVotingEligibility(appId, true);

        // Update the endorsement status
        _setEndorsementStatus(appId, true);
      }

      // Reset the grace period if the app has more than 100 points
      $._appGracePeriod[appId] = 0;
    }

    // Return true indicating the app is eligible for voting
    return true;
  }

  /**
   * @notice Endorses an app.
   * @param appId The unique identifier of the app being endorsed.
   */
  function endorseApp(bytes32 appId) public {
    // Get the endorsement storage
    EndorsementStorage storage $ = _getEndorsementStorage();

    // Check if the app is pending endorsement
    if (!appPendingEndorsment(appId)) {
      revert X2EarnAppAlreadyEndorsed(appId);
    }

    // Check if the caller is already an endorser
    if ($.endorsers[msg.sender]) {
      revert X2EarnAlreadyEndorser();
    }

    // Check if the caller is a node holder
    if (!$._tokenAuctionContract.isToken(msg.sender)) {
      revert X2EarnNonNodeHolder();
    }

    // Add the caller to the list of endorsers for the app
    $._appEndorsers[appId].push(msg.sender);
    $.endorsers[msg.sender] = true;

    // Calculate the score of the app, considering the new endorsement
    uint256 score = _getScore(appId, address(0));

    // Check if the score is equal to or greater than 100
    if (score >= 100) {
      // Check if the app has a grace period greater than 0
      if ($._appGracePeriod[appId] > 0) {
        // If the app is not eligible for voting, mark it as eligible
        if (!isEligibleNow(appId)) {
          // Mark the app as eligible for voting
          _setVotingEligibility(appId, true);

          // Update the endorsement status
          _setEndorsementStatus(appId, true);
        }

        // Reset the grace period if the app has more than 100 points
        $._appGracePeriod[appId] = 0;
      } else {
        // Add the app to the list of apps
        _addApp(appId);

        // Update the endorsement status
        _setEndorsementStatus(appId, true);
      }
    }

    // Emit an event indicating the app has been endorsed by the caller
    emit AppEndorsed(appId, msg.sender, true);
  }

  /**
   * @notice Unendorses an app.
   * @param appId The unique identifier of the app being unendorsed.
   */
  function unendorseApp(bytes32 appId) external {
    // Get the endorsement storage
    EndorsementStorage storage $ = _getEndorsementStorage();

    // Check if the caller is an endorser
    if (!$.endorsers[msg.sender]) {
      revert X2EarnNonEndorser();
    }

    // Calculate the new score of the app after removing the caller's endorsement
    uint256 score = _getScore(appId, msg.sender);

    // Emit an event indicating the app has been unendorsed by the caller
    emit AppEndorsed(appId, msg.sender, false);

    if ($._unendorsedAppsIndex[appId] < $._unendorsedApps.length) {
      return;
    }

    if (score < 100) {
      if ($._appGracePeriod[appId] == 0) {
        $._appGracePeriod[appId] = clock() + $._gracePeriodDuration;
      } else if ($._appGracePeriod[appId] > clock()) {
        // Mark the app as not eligible for voting
        _setVotingEligibility(appId, false);

        // Update the endorsement status
        _setEndorsementStatus(appId, false);
      }
    }

    return;
  }

  // ---------- Internal ---------- //
  /**
   * @dev Internal function to get the score of an app and optionally remove an endorser's endorsement.
   * @param appId The unique identifier of the app.
   * @param endorserToRemove Optional parameter. If provided, the function will remove this endorser's endorsement.
   * @return uint256 The score of the app.
   */
  function _getScore(bytes32 appId, address endorserToRemove) internal returns (uint256) {
    EndorsementStorage storage $ = _getEndorsementStorage();
    uint256 score;
    for (uint256 i; i < $._appEndorsers[appId].length; ) {
      address endorser = $._appEndorsers[appId][i];
      uint256 endorserTokenID = $._tokenAuctionContract.ownerToId(endorser);
      (, uint8 nodeLevel, , , , , ) = $._tokenAuctionContract.getMetadata(endorserTokenID);

      if (nodeLevel == 0 || endorser == endorserToRemove) {
        // Remove endorser by swapping with the last element and then reducing the length
        $._appEndorsers[appId][i] = $._appEndorsers[appId][$._appEndorsers[appId].length - 1];
        $._appEndorsers[appId].pop();
        delete $.endorsers[endorser];
      } else {
        score += $._nodeEnodorsmentScore[nodeLevel];
        i++; // Only increment i if we didn't remove an endorser
      }
    }
    return score;
  }

  /**
   * @dev Update the endorsement status of an app.
   * @param appId The unique identifier of the app.
   * @param endorsed The endorsement status to set.
   */
  function _setEndorsementStatus(bytes32 appId, bool endorsed) internal override {
    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    EndorsementStorage storage $ = _getEndorsementStorage();

    if (!endorsed) {
      /**
       *  If the app is no longer pending endorsement we need to remove it from the _unendorsedApps array
       *
       * In order to remove an app from the _unendorsedApps array correctly we need to:
       * 1) move the element in the last position of the array to the index we want to remove
       * 2) Update the `_unendorsedAppsIndex` mapping accordingly.
       * 3) pop() the last element of the _unendorsedApps array and delete the index mapping of the app we removed
       *
       * Example:
       *
       * _unendorsedApps = [A, B, C, D, E]
       * _unendorsedAppsIndex = {A: 0, B: 1, C: 2, D: 3, E: 4}
       *
       * If we want to remove C:
       *
       * 1) Move E to the index of C
       * _unendorsedApps = [A, B, E, D, E]
       *
       * 2) Update the index of E in the mapping
       * _unendorsedAppsIndex = {A: 0, B: 1, C: 2, D: 3, E: 2}
       *
       * 3) pop() the last element of the array and delete the index mapping of the app we removed
       * _unendorsedApps = [A, B, E, D]
       * _unendorsedAppsIndex = {A: 0, B: 1, D: 3, E: 2}
       *
       */
      uint256 index = $._unendorsedAppsIndex[appId];
      uint256 lastIndex = $._unendorsedApps.length - 1;
      bytes32 lastAppId = $._unendorsedApps[lastIndex];

      $._unendorsedApps[index] = lastAppId;
      $._unendorsedAppsIndex[lastAppId] = index;

      $._unendorsedApps.pop();
      delete $._unendorsedAppsIndex[appId];
    } else {
      // If the app is pending endorsement we need to add it to the _unendorsedApps array
      $._unendorsedApps.push(appId);
      $._unendorsedAppsIndex[appId] = $._unendorsedApps.length - 1;
    }

    emit AppEndorsementStatusUpdated(appId, endorsed);
  }

  /**
   * @dev Internal function to update the grace period.
   *
   * @param gracePeriodDuration The new grace period.
   *
   * Emits a {GracePeriodUpdated} event.
   */
  function _setGracePeriod(uint256 gracePeriodDuration) internal {
    EndorsementStorage storage $ = _getEndorsementStorage();

    emit GracePeriodUpdated($._gracePeriodDuration, gracePeriodDuration);

    $._gracePeriodDuration = gracePeriodDuration;
  }

  // ---------- Getters ---------- //

  /**
   * @dev See {IX2EarnApps-gracePeriod}.
   * @return The current grace period duration in blocks.
   */
  function gracePeriod() external view returns (uint256) {
    EndorsementStorage storage $ = _getEndorsementStorage();

    return $._gracePeriodDuration;
  }

  /**
   * @dev See {IX2EarnApps-appPendingEndorsment}.
   * @param appId The unique identifier of the app.
   * @return True if the app is pending endorsement.
   */
  function appPendingEndorsment(bytes32 appId) public view override returns (bool) {
    EndorsementStorage storage $ = _getEndorsementStorage();

    if ($._unendorsedAppsIndex[appId] < $._unendorsedApps.length || $._appGracePeriod[appId] > 0) {
      return true;
    }

    return false;
  }

  /**
   * @dev See {IX2EarnApps-appIdsPendingEndorsement}.
   */
  function appIdsPendingEndorsement() public view returns (bytes32[] memory) {
    EndorsementStorage storage $ = _getEndorsementStorage();

    return $._unendorsedApps;
  }

  /**
   * @dev See {IX2EarnApps-appsPendingEndorsment}.
   */
  function appsPendingEndorsement() external view returns (X2EarnAppsDataTypes.AppWithDetailsReturnType[] memory) {
    bytes32[] memory appIds = appIdsPendingEndorsement();
    return _getAppsInfo(appIds);
  }
}
