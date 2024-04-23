// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { Strings } from "@openzeppelin/contracts/utils/Strings.sol";
import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { DataTypes } from "../../libraries/DataTypes.sol";

abstract contract XAppsUpgradeable is Initializable, XAllocationVotingGovernor {
  using Checkpoints for Checkpoints.Trace208;

  /// @custom:storage-location erc7201:b3tr.storage.XAllocationVotingGovernor.XApps
  struct X2EarnAppsStorage {
    // x2EarnApps
    IX2EarnApps _x2EarnApps;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationVotingGovernor.XApps")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant XAppsStorageLocation = 0xd0d069a754be3c8727b213bc00d418e344adac8f83a7b6d5e0e426a9ddbe0700;

  function _getX2EarnAppsStorage() internal pure returns (X2EarnAppsStorage storage $) {
    assembly {
      $.slot := XAppsStorageLocation
    }
  }

  /**
   * @dev Initializes the contract
   * @param x2earnAppsAddress the address of the x2earn apps contract
   */
  function __XApps_init(IX2EarnApps x2earnAppsAddress) internal onlyInitializing {
    __XApps_init_unchained(x2earnAppsAddress);
  }

  function __XApps_init_unchained(IX2EarnApps x2earnAppsAddress) internal onlyInitializing {
    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();
    $._x2EarnApps = x2earnAppsAddress;
  }

  // ---------- Setters ---------- //

  // ---------- Getters ---------- //

  /**
   * @dev Returns true if an app is enabled to be voted and if it was created before the start of the requested round.
   *
   * @param appId the hashed name of the app
   * @param roundId the round id from the XAllocationVoting contract which represents the allocation round
   */
  function isEligibleForVote(bytes32 appId, uint256 roundId) public view override returns (bool) {
    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();

    // App does not exist
    if ($._x2EarnApps.appExists(appId) == false) {
      return false;
    }

    // We need to check if the app was created before the start of the round
    uint256 roundStartsAt = roundSnapshot(roundId);
    bool isAvailable = $._x2EarnApps.isElegible(appId, roundStartsAt) &&
      $._x2EarnApps.createdAt(appId) <= roundStartsAt;

    return isAvailable;
  }

  /**
   * All apps that are elegible for voting in x-allocation rounds
   */
  function allElegibleApps() public view returns (bytes32[] memory) {
    X2EarnAppsStorage storage $ = _getX2EarnAppsStorage();

    return $._x2EarnApps.allElegibleApps();
  }

  function getAppIds(uint256 roundId) public view override returns (bytes32[] memory) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    return $._appsElegibleForVoting[roundId];
  }

  /**
   * This function could not be efficient with a large number of apps
   */
  function getApps(uint256 roundId) public view returns (DataTypes.App[] memory) {
    XAllocationVotingGovernorStorage storage $ = _getXAllocationVotingGovernorStorage();
    X2EarnAppsStorage storage $$ = _getX2EarnAppsStorage();

    bytes32[] memory appsInRound = $._appsElegibleForVoting[roundId];
    DataTypes.App[] memory allApps = new DataTypes.App[](appsInRound.length);

    uint256 length = appsInRound.length;
    for (uint i = 0; i < length; i++) {
      allApps[i] = $$._x2EarnApps.app(appsInRound[i]);
    }
    return allApps;
  }
}
