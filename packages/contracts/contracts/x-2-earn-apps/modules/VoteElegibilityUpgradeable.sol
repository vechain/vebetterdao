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
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
 * @title VoteElegibilityUpgradeable
 * @notice Contract module that provides the vote elegibility functionalities of the x2earn apps.
 * By deafult every new added app becomes elegible for voting. The elegibility can be changed.
 * The elegibility is stored in a checkpoint so we can track the changes over time.
 */
abstract contract VoteElegibilityUpgradeable is Initializable, X2EarnAppsUpgradeable {
  using Checkpoints for Checkpoints.Trace208; // Checkpoints used to track elegibility changes over time

  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.VoteElegibility
  struct VoteElegibilityStorage {
    bytes32[] _elegibleApps; // Array containing an up to date list of apps that are elegible for voting
    mapping(bytes32 appId => uint256 index) _elegibleAppIndex; // Mapping from app ID to index in the _elegibleApps array, so we can remove an app in O(1)
    mapping(bytes32 appId => Checkpoints.Trace208) _isAppElegibleCheckpoints; // Checkpoints to track the elegibility changes of an app over time
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.X2EarnApps.VoteElegibility")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant VoteElegibilityStorageLocation =
    0x1b89599d9cb7d2a710d5070bd3bdaa71840495c5ed3eca567ac62b6cc4584a00;

  function _getVoteElegibilityStorage() internal pure returns (VoteElegibilityStorage storage $) {
    assembly {
      $.slot := VoteElegibilityStorageLocation
    }
  }

  /**
   * @dev Initializes the contract
   */
  function __VoteElegibility_init() internal onlyInitializing {
    __VoteElegibility_init_unchained();
  }

  function __VoteElegibility_init_unchained() internal onlyInitializing {}

  /**
   * @dev Update the app availability for voting checkpoint.
   */
  function _setVotingElegibility(bytes32 appId, bool canBeVoted) internal virtual override {
    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    VoteElegibilityStorage storage $ = _getVoteElegibilityStorage();

    // We update the checkpoint with the new elegibility status
    _pushCheckpoint($._isAppElegibleCheckpoints[appId], canBeVoted ? 1 : 0);

    if (!canBeVoted) {
      // If the app is not elegible for voting we need to remove it from the _elegibleApps array
      /**
       * In order to remove an app from the _elegibleApps array correctly we need to:
       * 1) move the element in the last position of the array to the index we want to remove
       * 2) Update the `_elegibleAppIndex` mapping accordingly.
       * 3) pop() the last element of the _elegibleApps array and delete the index mapping of the app we removed
       *
       * Example:
       *
       * _elegibleApps = [A, B, C, D, E]
       * _elegibleAppIndex = {A: 0, B: 1, C: 2, D: 3, E: 4}
       *
       * If we want to remove C:
       *
       * 1) Move E to the index of C
       * _elegibleApps = [A, B, E, D, E]
       *
       * 2) Update the index of E in the mapping
       * _elegibleAppIndex = {A: 0, B: 1, C: 2, D: 3, E: 2}
       *
       * 3) pop() the last element of the array and delete the index mapping of the app we removed
       * _elegibleApps = [A, B, E, D]
       * _elegibleAppIndex = {A: 0, B: 1, D: 3, E: 2}
       *
       */
      uint256 index = $._elegibleAppIndex[appId];
      uint256 lastIndex = $._elegibleApps.length - 1;
      bytes32 lastAppId = $._elegibleApps[lastIndex];

      $._elegibleApps[index] = lastAppId;
      $._elegibleAppIndex[lastAppId] = index;

      $._elegibleApps.pop();
      delete $._elegibleAppIndex[appId];
    } else {
      // If the app is elegible for voting we need to add it to the _elegibleApps array
      $._elegibleApps.push(appId);
      $._elegibleAppIndex[appId] = $._elegibleApps.length - 1;
    }

    emit VotingElegibilityUpdated(appId, canBeVoted);
  }

  /**
   * @dev Store a new checkpoint for the app's elegibility.
   */
  function _pushCheckpoint(Checkpoints.Trace208 storage store, uint208 delta) private returns (uint208, uint208) {
    return store.push(clock(), delta);
  }

  /**
   * @dev All apps that are currently elegible for voting in x-allocation rounds
   */
  function allElegibleApps() public view returns (bytes32[] memory) {
    VoteElegibilityStorage storage $ = _getVoteElegibilityStorage();

    return $._elegibleApps;
  }

  /**
   * @dev Returns true if an app is elegible for voting in a specific timepoint.
   *
   * @param appId the hashed name of the app
   * @param timepoint the timepoint when the app should be checked for elegibility
   */
  function isElegible(bytes32 appId, uint256 timepoint) public view override returns (bool) {
    if (!appExists(appId)) {
      return false;
    }

    VoteElegibilityStorage storage $ = _getVoteElegibilityStorage();

    uint48 currentTimepoint = clock();
    if (timepoint > currentTimepoint) {
      revert ERC5805FutureLookup(timepoint, currentTimepoint);
    }

    // We check also that the timepoint is after the app creation because once the first checkpoint is created
    // it will return true for any block before that timepoint.
    return
      $._isAppElegibleCheckpoints[appId].upperLookupRecent(SafeCast.toUint48(timepoint)) == 1 &&
      createdAt(appId) <= timepoint;
  }

  /**
   * @dev Returns true if an app is elegible for voting in the current block.
   *
   * @param appId the hashed name of the app
   */
  function isElegibleNow(bytes32 appId) public view override returns (bool) {
    if (!appExists(appId)) {
      return false;
    }

    VoteElegibilityStorage storage $ = _getVoteElegibilityStorage();

    return $._isAppElegibleCheckpoints[appId].latest() == 1;
  }
}
