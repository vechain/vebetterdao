// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IXAllocationPool } from "./interfaces/IXAllocationPool.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";

contract XAllocationPool is IXAllocationPool, AccessControl {
  using Checkpoints for Checkpoints.Trace208;

  struct App {
    bytes32 id;
    address addr;
    string name;
    string metadata; //ipfs hash
    uint48 createdAt; // block number when app was added
  }

  // Mapping from app ID to app
  mapping(bytes32 => App) private apps;

  // List of app IDs to enable retrieval of all apps
  bytes32[] private appIds;

  // Checkpoints for app availability for voting
  mapping(bytes32 appId => Checkpoints.Trace208) private _appCanBeVotedForCheckpoints;

  IXAllocationVotingGovernor public xAllocationVoting;

  constructor(address[] memory admins) {
    for (uint i = 0; i < admins.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, admins[i]);
    }
  }

  // ---------- Setters ---------- //

  function setXAllocationVotingAddress(address _xAllocationVoting) public onlyRole(DEFAULT_ADMIN_ROLE) {
    xAllocationVoting = IXAllocationVotingGovernor(_xAllocationVoting);
  }

  function addApp(
    address appAddress,
    string memory name,
    string memory metadata,
    bool availableForAllocationVoting
  ) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    bytes32 id = hashName(name);

    require(apps[id].addr == address(0), "App with this ID already exists");

    // Store the new app
    apps[id] = App(id, appAddress, name, metadata, clock());
    appIds.push(id);
    _updateAppCanBeVotedForChechkpoint(id, availableForAllocationVoting);

    emit AppAdded(id, appAddress, name, metadata, availableForAllocationVoting);
  }

  function setAppAvailabilityForAllocationVoting(
    bytes32 appId,
    bool isAvailableForVoting
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _updateAppCanBeVotedForChechkpoint(appId, isAvailableForVoting);
  }

  // ---------- Internal and private ---------- //

  /**
   * @dev Update the app availability for voting checkpoint.
   */
  function _updateAppCanBeVotedForChechkpoint(bytes32 appId, bool isAvailableForVoting) private {
    _push(_appCanBeVotedForCheckpoints[appId], isAvailableForVoting ? 1 : 0);
    emit AppAvailabilityForAllocationVotingChanged(appId, isAvailableForVoting);
  }

  function _push(Checkpoints.Trace208 storage store, uint208 delta) private returns (uint208, uint208) {
    return store.push(clock(), delta);
  }

  // ---------- Getters ---------- //

  function canBeVotedFor(bytes32 appId) public view virtual override returns (bool) {
    require(apps[appId].addr != address(0), "App does not exist");
    require(xAllocationVoting != IXAllocationVotingGovernor(address(0)), "XAllocationVoting address not set");

    // if it was available for voting and it was created before the start of the current round
    uint256 roundStartsAt = xAllocationVoting.getCurrentAllocationRoundSnapshot();
    bool isAvailable = _appCanBeVotedForCheckpoints[appId].latest() == 1 && apps[appId].createdAt <= roundStartsAt;

    return isAvailable;
  }

  function couldBeVotedFor(bytes32 appId, uint256 timepoint) public view virtual override returns (bool) {
    require(apps[appId].addr != address(0), "App does not exist");

    uint48 currentTimepoint = clock();
    if (timepoint >= currentTimepoint) {
      revert ERC5805FutureLookup(timepoint, currentTimepoint);
    }

    // if it was available for voting in that timepoint and it was created before that timepoint
    bool isAvailable = _appCanBeVotedForCheckpoints[appId].upperLookupRecent(SafeCast.toUint48(timepoint)) == 1 &&
      apps[appId].createdAt <= timepoint;

    return isAvailable;
  }

  function hashName(string memory name) public pure returns (bytes32) {
    return keccak256(abi.encodePacked(name));
  }

  // Function to retrieve an app by ID
  function getApp(bytes32 id) public view virtual returns (App memory) {
    require(apps[id].addr != address(0), "App does not exist");
    return apps[id];
  }

  // Function to retrieve all apps
  function getAllApps() public view returns (App[] memory) {
    App[] memory allApps = new App[](appIds.length);
    for (uint i = 0; i < appIds.length; i++) {
      allApps[i] = apps[appIds[i]];
    }
    return allApps;
  }

  /**
   * @dev Clock used for flagging checkpoints. Can be overridden to implement timestamp based
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
}
