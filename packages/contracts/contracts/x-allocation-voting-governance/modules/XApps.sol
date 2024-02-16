// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { IXApps } from "../../interfaces/IXApps.sol";

abstract contract XApps is IXApps, XAllocationVotingGovernor {
  using Checkpoints for Checkpoints.Trace208;

  struct App {
    bytes32 id;
    address addr;
    string name;
    string metadata; //ipfs hash
    uint48 createdAt; // block number when app was added
  }

  // Mapping from app ID to app
  mapping(bytes32 => App) internal _apps;

  // List of app IDs to enable retrieval of all _apps
  bytes32[] internal _appIds;

  // Array containing an up to date list of apps that are elegible for voting
  bytes32[] internal _elegibleAppsForNextRound;
  // Mapping from app ID to index in the _elegibleAppsForNextRound array
  mapping(bytes32 => uint256) internal _idToElegibleAppsIndex;
  // Mapping from app ID to a checkpoint of the app's elegibility in a specific block
  mapping(bytes32 appId => Checkpoints.Trace208) internal _isAppElegibleCheckpoints;

  // ---------- Setters ---------- //

  function addApp(address appAddress, string memory name, string memory metadata) public virtual {
    bytes32 id = hashName(name);

    require(_apps[id].addr == address(0), "App with this ID already exists");

    // Store the new app
    _apps[id] = App(id, appAddress, name, metadata, clock());
    _appIds.push(id);
    _pushAppToEligbleApps(id);

    emit AppAdded(id, appAddress, name, metadata, true);
  }

  function setVotingElegibility(bytes32 appId, bool isElegible) public virtual {
    _updateVotingElegibilityCheckpoint(appId, isElegible);
  }

  // ---------- Internal and private ---------- //

  function _pushAppToEligbleApps(bytes32 appId) private {
    _elegibleAppsForNextRound.push(appId);
    _idToElegibleAppsIndex[appId] = _elegibleAppsForNextRound.length - 1;
    _push(_isAppElegibleCheckpoints[appId], 1);
  }

  /**
   * @dev Update the app availability for voting checkpoint.
   */
  function _updateVotingElegibilityCheckpoint(bytes32 appId, bool canBeVoted) private {
    _push(_isAppElegibleCheckpoints[appId], canBeVoted ? 1 : 0);

    if (!canBeVoted) {
      // In order to remove an app from the _elegibleAppsForNextRound array correctly we need to move the element in the last position
      // to the index we want to remove and pop() the last element of the array.
      // We also need to update the `_idToElegibleAppsIndex` mapping accordingly.

      // ID of the last item now points to the new index
      _idToElegibleAppsIndex[_elegibleAppsForNextRound[_elegibleAppsForNextRound.length - 1]] = _idToElegibleAppsIndex[
        appId
      ];

      // Move last item at the index of the app we are removing and pop the last element of the array
      _elegibleAppsForNextRound[_idToElegibleAppsIndex[appId]] = _elegibleAppsForNextRound[
        _elegibleAppsForNextRound.length - 1
      ];
      _elegibleAppsForNextRound.pop();

      // delete the mapping that belongs to the app we removed
      delete _idToElegibleAppsIndex[appId];
    } else {
      _pushAppToEligbleApps(appId);
    }

    emit VotingElegibilityChanged(appId, canBeVoted);
  }

  function _push(Checkpoints.Trace208 storage store, uint208 delta) private returns (uint208, uint208) {
    return store.push(clock(), delta);
  }

  // ---------- Getters ---------- //

  /**
   * All apps that are elegible for voting in x-allocation rounds
   */
  function allElegibleApps() public view returns (bytes32[] memory) {
    return _elegibleAppsForNextRound;
  }

  /**
   * @dev Returns true if an app is enabled to be voted and if it was created before the start of the requested round.
   *
   * @param appId the hashed name of the app
   * @param roundId the round id from the XAllocationVoting contract which represents the allocation round
   */
  function isEligibleForVote(bytes32 appId, uint256 roundId) public view override returns (bool) {
    // App does not exist
    if (_apps[appId].addr == address(0)) {
      return false;
    }

    // We need to check if the app was created before the start of the round
    uint256 roundStartsAt = roundSnapshot(roundId);
    bool isAvailable = _isAppElegibleCheckpoints[appId].upperLookupRecent(SafeCast.toUint48(roundStartsAt)) == 1 &&
      _apps[appId].createdAt <= roundStartsAt;

    return isAvailable;
  }

  function isElegibleForVoteLatestCheckpoint(bytes32 appId) public view returns (bool) {
    return _isAppElegibleCheckpoints[appId].latest() == 1;
  }

  function isElegibleForVotePastCheckpoint(bytes32 appId, uint256 timepoint) public view returns (bool) {
    uint48 currentTimepoint = clock();
    if (timepoint >= currentTimepoint) {
      revert ERC5805FutureLookup(timepoint, currentTimepoint);
    }

    return _isAppElegibleCheckpoints[appId].upperLookupRecent(SafeCast.toUint48(timepoint)) == 1;
  }

  function hashName(string memory name) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(name));
  }

  // Function to retrieve an app by ID
  function getApp(bytes32 id) public view virtual returns (App memory) {
    require(_apps[id].addr != address(0), "App does not exist");
    return _apps[id];
  }

  // Function to retrieve all apps
  function getAllApps() public view returns (App[] memory) {
    App[] memory allApps = new App[](_appIds.length);
    uint256 length = _appIds.length;
    for (uint i = 0; i < length; i++) {
      allApps[i] = _apps[_appIds[i]];
    }
    return allApps;
  }

  function getAppReceiverAddress(bytes32 appId) public view override returns (address) {
    return _apps[appId].addr;
  }
}
