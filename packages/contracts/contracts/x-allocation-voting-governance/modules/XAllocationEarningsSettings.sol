// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";

/**
 * @title XAllocationEarningsSettings
 * @notice The settings for the x-allocation earnings calculations:
 * - baseAllocationPercentage: The base allocation percentage to be divided among the x-apps each round
 * - appSharesCap: The maximum percentage of shares an x-app can reach in each round
 *
 * Since the base allocation percentage and app shares cap can be updated, we store the values for each round.
 */
abstract contract XAllocationEarningsSettings is Initializable, XAllocationVotingGovernor {
  /// @custom:storage-location erc7201:b3tr.storage.XAllocationEarningsSettings
  struct EarningsSettingsStorage {
    uint256 baseAllocationPercentage;
    uint256 appSharesCap;
    mapping(uint256 => uint256) _roundBaseAllocationPercentage;
    mapping(uint256 => uint256) _roundAppSharesCap;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.XAllocationEarningsSettings")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant EarningsSettingsStorageLocation =
    0xc3a4d99759cc5032c73cc00e3f07178d23bb491c1e49c7c1383ff18be60ed800;

  function _getEarningsSettingsStorage() internal pure returns (EarningsSettingsStorage storage $) {
    assembly {
      $.slot := EarningsSettingsStorageLocation
    }
  }

  // ---------- Initialization ---------- //

  /**
   * @dev Initialize the contract
   * @param initialBaseAllocationPercentage The initial base allocation percentage
   * @param initialAppSharesCap The initial app shares cap
   */
  function __XAllocationEarningsSettings_init(
    uint256 initialBaseAllocationPercentage,
    uint256 initialAppSharesCap
  ) internal onlyInitializing {
    __XAllocationEarningsSettings_init_unchained(initialBaseAllocationPercentage, initialAppSharesCap);
  }

  function __XAllocationEarningsSettings_init_unchained(
    uint256 initialBaseAllocationPercentage,
    uint256 initialAppSharesCap
  ) internal onlyInitializing {
    _setBaseAllocationPercentage(initialBaseAllocationPercentage);
    _setAppSharesCap(initialAppSharesCap);
  }

  // ---------- Getters ---------- //

  /**
   * @notice Get the base allocation percentage
   */
  function baseAllocationPercentage() public view returns (uint256) {
    EarningsSettingsStorage storage $ = _getEarningsSettingsStorage();
    return $.baseAllocationPercentage;
  }

  /**
   * @notice Get the app shares cap
   */
  function appSharesCap() public view returns (uint256) {
    EarningsSettingsStorage storage $ = _getEarningsSettingsStorage();
    return $.appSharesCap;
  }

  /**
   * Returns the base allocation percentage for a given round
   */
  function getRoundBaseAllocationPercentage(uint256 roundId) public view returns (uint256) {
    EarningsSettingsStorage storage $ = _getEarningsSettingsStorage();
    return $._roundBaseAllocationPercentage[roundId];
  }

  /**
   * Returns the app shares cap for a given round
   */
  function getRoundAppSharesCap(uint256 roundId) public view returns (uint256) {
    EarningsSettingsStorage storage $ = _getEarningsSettingsStorage();
    return $._roundAppSharesCap[roundId];
  }

  // ---------- Internal ---------- //

  /**
   * @notice Set the base allocation percentage
   * @param baseAllocationPercentage_ The new base allocation percentage
   */
  function _setBaseAllocationPercentage(uint256 baseAllocationPercentage_) internal {
    require(baseAllocationPercentage_ <= 100, "Base allocation percentage must be less than or equal to 100");
    EarningsSettingsStorage storage $ = _getEarningsSettingsStorage();
    $.baseAllocationPercentage = baseAllocationPercentage_;
  }

  /**
   * @notice Set the app shares cap
   * @param appSharesCap_ The new app shares cap
   */
  function _setAppSharesCap(uint256 appSharesCap_) internal {
    require(appSharesCap_ <= 100, "App shares cap must be less than or equal to 100");
    EarningsSettingsStorage storage $ = _getEarningsSettingsStorage();
    $.appSharesCap = appSharesCap_;
  }

  // ---------- Setters ---------- //

  function setAppSharesCap(uint256 appSharesCap_) external virtual;

  function setBaseAllocationPercentage(uint256 baseAllocationPercentage_) external virtual;
}
