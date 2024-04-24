// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { DataTypes } from "../../libraries/DataTypes.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { X2EarnAppsUpgradeable } from "../X2EarnAppsUpgradeable.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

abstract contract VoteElegibility is Initializable, X2EarnAppsUpgradeable {
  using Checkpoints for Checkpoints.Trace208;
  /// @custom:storage-location erc7201:b3tr.storage.X2EarnApps.VoteElegibility
  struct VoteElegibilityStorage {
    // Array containing an up to date list of apps that are elegible for voting
    bytes32[] _elegibleAppsForNextRound;
    // Mapping from app ID to index in the _elegibleAppsForNextRound array
    mapping(bytes32 => uint256) _idToElegibleAppsIndex;
    // Mapping from app ID to a checkpoint of the app's elegibility in a specific block
    mapping(bytes32 appId => Checkpoints.Trace208) _isAppElegibleCheckpoints;
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
    VoteElegibilityStorage storage $ = _getVoteElegibilityStorage();

    _push($._isAppElegibleCheckpoints[appId], canBeVoted ? 1 : 0);

    if (!canBeVoted) {
      // In order to remove an app from the _elegibleAppsForNextRound array correctly we need to move the element in the last position
      // to the index we want to remove and pop() the last element of the array.
      // We also need to update the `_idToElegibleAppsIndex` mapping accordingly.

      // ID of the last item now points to the new index
      $._idToElegibleAppsIndex[$._elegibleAppsForNextRound[$._elegibleAppsForNextRound.length - 1]] = $
        ._idToElegibleAppsIndex[appId];

      // Move last item at the index of the app we are removing and pop the last element of the array
      $._elegibleAppsForNextRound[$._idToElegibleAppsIndex[appId]] = $._elegibleAppsForNextRound[
        $._elegibleAppsForNextRound.length - 1
      ];
      $._elegibleAppsForNextRound.pop();

      // delete the mapping that belongs to the app we removed
      delete $._idToElegibleAppsIndex[appId];
    } else {
      // push app to elegible apps
      $._elegibleAppsForNextRound.push(appId);
      $._idToElegibleAppsIndex[appId] = $._elegibleAppsForNextRound.length - 1;
      _push($._isAppElegibleCheckpoints[appId], 1);
    }

    emit VotingElegibilityUpdated(appId, canBeVoted);
  }

  function _push(Checkpoints.Trace208 storage store, uint208 delta) private returns (uint208, uint208) {
    return store.push(clock(), delta);
  }

  /**
   * All apps that are elegible for voting in x-allocation rounds
   */
  function allElegibleApps() public view returns (bytes32[] memory) {
    VoteElegibilityStorage storage $ = _getVoteElegibilityStorage();

    return $._elegibleAppsForNextRound;
  }

  /**
   * @dev Returns true if an app is enabled to be voted and if it was created before the start of the requested round.
   *
   * @param appId the hashed name of the app
   * @param timepoint the timepoint when the app should be checked for elegibility
   */
  function isElegible(bytes32 appId, uint256 timepoint) public view override returns (bool) {
    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    VoteElegibilityStorage storage $ = _getVoteElegibilityStorage();

    uint48 currentTimepoint = clock();
    if (timepoint > currentTimepoint) {
      revert ERC5805FutureLookup(timepoint, currentTimepoint);
    }

    return $._isAppElegibleCheckpoints[appId].upperLookupRecent(SafeCast.toUint48(timepoint)) == 1;
  }

  function isElegibleNow(bytes32 appId) public view override returns (bool) {
    if (!appExists(appId)) {
      revert X2EarnNonexistentApp(appId);
    }

    VoteElegibilityStorage storage $ = _getVoteElegibilityStorage();

    return $._isAppElegibleCheckpoints[appId].latest() == 1;
  }
}
