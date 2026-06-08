// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import { IX2EarnApps } from "./interfaces/IX2EarnApps.sol";
import { IB3TR } from "./interfaces/IB3TR.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { PausableUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import { IXAllocationPool } from "./interfaces/IXAllocationPool.sol";
import { IX2EarnRewardsPool } from "./interfaces/IX2EarnRewardsPool.sol";
import { IVeBetterPassport } from "./interfaces/IVeBetterPassport.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";
import { IDynamicBaseAllocationPool } from "./interfaces/IDynamicBaseAllocationPool.sol";

/**
 * @title DynamicBaseAllocationPool (DBA)
 * @notice This contract receives surplus B3TR allocations from XAllocationPool
 * and distributes them to eligible apps using a flat distribution with a merit cap.
 *
 * --------- Version 2 ---------
 * - Add storage to track the reward amount for each app for each round
 * - Add seed function to seed historical rewards
 *
 * --------- Version 3 ---------
 * - Merit-capped flat distribution: each app gets min(flatShare, meritCapMultiplier * voteAllocation)
 * - Overflow from merit cap + integer remainder sent to VBD Treasury
 * - Treasury address and meritCapMultiplier stored on-chain
 *
 * --------- Version 4 ---------
 * - On-chain eligibility filtering: distributeDBARewards no longer takes an app list, derives it from chain state
 *   using the 3 historical rules (in-round participation + at least one rewarded action + endorsement boundaries)
 * - New contract refs: VeBetterPassport (for appRoundActionCount) and XAllocationVoting (for getAppIdsOfRound +
 *   roundSnapshot + roundDeadline)
 * - The duplicate-check pass is removed (set is derived, duplicate-free by construction)
 */
contract DBAPool is
  AccessControlUpgradeable,
  ReentrancyGuardUpgradeable,
  UUPSUpgradeable,
  PausableUpgradeable,
  IDynamicBaseAllocationPool
{
  /// @notice The role that can upgrade the contract.
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  /// @notice The role that can distribute funds to apps.
  bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");

  // ---------- Storage ---------- //

  /// @custom:storage-location erc7201:b3tr.storage.DBAPool
  struct DBAPoolStorage {
    IX2EarnApps x2EarnApps;
    IXAllocationPool xAllocationPool;
    IX2EarnRewardsPool x2EarnRewardsPool;
    IB3TR b3tr;
    uint256 distributionStartRound; // The round from which DBA rewards distribution starts
    mapping(uint256 roundId => bool) dbaRewardsDistributed; // Tracks if DBA rewards have been distributed for a round
    mapping(uint256 roundId => mapping(bytes32 appId => uint256 amount)) dbaRoundRewardsForApp; // Tracks the reward amount an app has received from the DBA
    // V3
    address treasuryAddress; // The address to which overflow from the merit cap is routed
    uint256 meritCapMultiplier; // Multiplier for the merit cap (e.g. 2 = 2x vote allocation)
    // V4
    IVeBetterPassport veBetterPassport; // Used to read appRoundActionCount (rule 2)
    IXAllocationVotingGovernor xAllocationVoting; // Used to read getAppIdsOfRound + roundSnapshot + roundDeadline (rules 1 & 3)
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.DBAPool")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant DBAPoolStorageLocation = 0x4f3bb8da144f5f8e75f17301cb1e55dff8f5406135253ffe9ec628919faae200;

  function _getDBAPoolStorage() private pure returns (DBAPoolStorage storage $) {
    assembly {
      $.slot := DBAPoolStorageLocation
    }
  }

  // ---------- Initializers ---------- //

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  struct InitializeV1Params {
    address admin;
    address x2EarnApps;
    address xAllocationPool;
    address x2earnRewardsPool;
    address b3tr;
    uint256 distributionStartRound;
  }

  function initialize(InitializeV1Params memory params) public initializer {
    require(params.admin != address(0), "DBAPool: admin is the zero address");
    require(params.x2EarnApps != address(0), "DBAPool: x2EarnApps is the zero address");
    require(params.xAllocationPool != address(0), "DBAPool: xAllocationPool is the zero address");
    require(params.x2earnRewardsPool != address(0), "DBAPool: x2EarnRewardsPool is the zero address");
    require(params.b3tr != address(0), "DBAPool: b3tr is the zero address");
    require(params.distributionStartRound != 0, "DBAPool: distribution start round is zero");

    __AccessControl_init();
    __ReentrancyGuard_init();
    __UUPSUpgradeable_init();
    __Pausable_init();

    _grantRole(DEFAULT_ADMIN_ROLE, params.admin);

    DBAPoolStorage storage $ = _getDBAPoolStorage();
    $.x2EarnApps = IX2EarnApps(params.x2EarnApps);
    $.xAllocationPool = IXAllocationPool(params.xAllocationPool);
    $.x2EarnRewardsPool = IX2EarnRewardsPool(params.x2earnRewardsPool);
    $.b3tr = IB3TR(params.b3tr);
    $.distributionStartRound = params.distributionStartRound;
  }

  /// @notice V3 reinitializer: sets the treasury address for overflow routing
  /// @param _treasuryAddress The VBD Treasury address
  function initializeV3(address _treasuryAddress) public reinitializer(3) {
    require(_treasuryAddress != address(0), "DBAPool: treasury is the zero address");
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    $.treasuryAddress = _treasuryAddress;
    $.meritCapMultiplier = 2;
  }

  /// @notice V4 reinitializer: wires VeBetterPassport and XAllocationVoting for on-chain eligibility filtering
  /// @param _veBetterPassport The VeBetterPassport address (action count source)
  /// @param _xAllocationVoting The XAllocationVoting address (round apps + boundaries source)
  function initializeV4(address _veBetterPassport, address _xAllocationVoting) public reinitializer(4) {
    require(_veBetterPassport != address(0), "DBAPool: veBetterPassport is the zero address");
    require(_xAllocationVoting != address(0), "DBAPool: xAllocationVoting is the zero address");
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    $.veBetterPassport = IVeBetterPassport(_veBetterPassport);
    $.xAllocationVoting = IXAllocationVotingGovernor(_xAllocationVoting);
  }

  // ---------- Authorizers ---------- //

  /**
   * @notice Authorizes the upgrade of the contract.
   * @param _newImplementation The new implementation address.
   */
  function _authorizeUpgrade(address _newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  // ---------- Setters ---------- //

  /**
   * @notice Distributes DBA rewards to apps eligible under the on-chain rules for a specific round.
   * @dev Eligibility is derived on-chain: the contract loops over `xAllocationVoting.getAppIdsOfRound(_roundId)`
   * and includes apps that (a) registered at least one action with proof in the round and (b) were not
   * unendorsed at BOTH round-start and round-end. Excluded apps still consume their share of the pool
   * via the merit-cap overflow path, which is routed to the treasury alongside the integer-division
   * remainder.
   *
   * Permissionless: now that the eligible set is derived from chain state the caller has no
   * leverage over who gets paid, so `DISTRIBUTOR_ROLE` was dropped. Anyone may trigger
   * distribution; idempotency is enforced by `dbaRewardsDistributed[_roundId]`.
   *
   * @param _roundId The round ID for which to distribute DBA rewards.
   */
  function distributeDBARewards(uint256 _roundId) external nonReentrant whenNotPaused {
    DBAPoolStorage storage $ = _getDBAPoolStorage();

    // Validate that round can be distributed based on different criteria
    require(_canDistributeDBARewards($, _roundId), "DBAPool: Round invalid or not ready to distribute");

    // Validate that contract has enough funds
    require($.b3tr.balanceOf(address(this)) > 0, "DBAPool: no funds available");

    // Build the eligible set on-chain by applying the 3 rules to every app in the round
    (bytes32[] memory eligibleApps, uint256 eligibleCount) = _buildEligibleApps($, _roundId);

    // Mark round as distributed even if the eligible set is empty, to prevent re-triggering.
    $.dbaRewardsDistributed[_roundId] = true;

    uint256 dbaPoolAmount = $.xAllocationPool.unallocatedFunds(_roundId);

    if (eligibleCount == 0) {
      // No eligible apps — entire pool is overflow and routed to treasury
      if (dbaPoolAmount > 0) {
        require($.b3tr.transfer($.treasuryAddress, dbaPoolAmount), "DBAPool: Transfer of overflow to treasury failed");
      }
      emit FundsDistributedToTreasury(dbaPoolAmount, _roundId);
      return;
    }

    // Calculate flat share per app and initialize overflow with integer-division remainder
    uint256 flatSharePerApp = dbaPoolAmount / eligibleCount;
    uint256 totalOverflow = dbaPoolAmount % eligibleCount;

    // Cache base allocation (same for all apps in the round)
    uint256 baseAllocation = $.xAllocationPool.baseAllocationAmount(_roundId);

    // Distribute to each eligible app
    for (uint256 i = 0; i < eligibleCount; i++) {
      bytes32 appId = eligibleApps[i];

      // Sanity check: app must exist (apps coming from getAppIdsOfRound must exist by construction)
      require($.x2EarnApps.appExists(appId), "DBAPool: app does not exist");

      // Cap each app's DBA reward relative to a multiple of its vote-based XAllocation earnings
      // (excluding the base amount all apps receive equally)
      //
      // * Example 1: if the multiplier is 2, and the app vote earnings are 200, the merit cap is 400
      //       if the DBA share for the app is 1000, the app will receive 400.
      // * Example 2: if the multiplier is 2, and the app vote earnings are 1000, the merit cap is 2000
      //       if the DBA share for the app is 1000, the app will receive 1000.
      uint256 appReward;
      {
        (uint256 totalEarnings, , , ) = $.xAllocationPool.roundEarnings(_roundId, appId);
        uint256 meritCap = $.meritCapMultiplier * (totalEarnings - baseAllocation);
        appReward = flatSharePerApp < meritCap ? flatSharePerApp : meritCap;
      }

      // Accumulate overflow from merit cap capping
      totalOverflow += (flatSharePerApp - appReward);

      // Deposit to X2EarnRewardsPool
      if (appReward > 0) {
        require(
          $.b3tr.approve(address($.x2EarnRewardsPool), appReward),
          "DBAPool: Approval of B3TR token to x2EarnRewardsPool failed"
        );
        require(
          $.x2EarnRewardsPool.deposit(appReward, appId),
          "DBAPool: Deposit of rewards allocation to x2EarnRewardsPool failed"
        );
      }

      // Track the reward amount for the app for later on-chain retrieval
      $.dbaRoundRewardsForApp[_roundId][appId] = appReward;

      // Emit event for each app
      emit FundsDistributedToApp(appId, appReward, _roundId);
    }

    // Send accumulated overflow to treasury
    if (totalOverflow > 0) {
      require(
        $.b3tr.transfer($.treasuryAddress, totalOverflow),
        "DBAPool: Transfer of overflow to treasury failed"
      );
      emit FundsDistributedToTreasury(totalOverflow, _roundId);
    }
  }

  // ---------- Internal eligibility filter ---------- //

  /**
   * @dev Applies the 3 historical eligibility rules on-chain. Returns an over-allocated
   * memory array sized to the round's app count plus the actual number of eligible apps,
   * so callers can iterate `[0, eligibleCount)` ignoring the tail.
   *
   * Rules (replicating the off-chain filterEligibleAppsForDBA logic):
   *  1. App was in the round → comes from `xAllocationVoting.getAppIdsOfRound(roundId)`
   *  2. App had at least 1 action with proof → `veBetterPassport.appRoundActionCount(appId, roundId) > 0`
   *  3. App NOT excluded by endorsement → not (unendorsed at snapshot AND unendorsed at deadline)
   *
   * Rule 3 uses the historical endorsement score (`getScoreAtTimepoint`) against the
   * current threshold rather than `isEligible`. `isEligible` is the wrong primitive because:
   *   a. Apps in `getAppIdsOfRound` are by construction eligible at the snapshot — that list
   *      IS the eligibility snapshot — so `isEligible(_, snapshot)` is structurally always
   *      true and the AND would never short-circuit.
   *   b. During the endorsement grace period the eligibility checkpoint stays at 1 even
   *      after the unendorsed-set membership flips, so an app that lost its endorser for
   *      the whole round still reads `isEligible == true` at both boundaries.
   *
   * Score-based comparison gives the actual "was the score above the endorsement threshold
   * at block X" answer, which matches what `isAppUnendorsed` returned off-chain.
   */
  function _buildEligibleApps(
    DBAPoolStorage storage $,
    uint256 _roundId
  ) internal view returns (bytes32[] memory eligibleApps, uint256 eligibleCount) {
    bytes32[] memory appsOfRound = $.xAllocationVoting.getAppIdsOfRound(_roundId);
    eligibleApps = new bytes32[](appsOfRound.length);

    // Round bounds for the endorsement-score checkpoint reads
    uint256 snapshot = $.xAllocationVoting.roundSnapshot(_roundId);
    uint256 deadline = $.xAllocationVoting.roundDeadline(_roundId);
    uint256 threshold = $.x2EarnApps.endorsementScoreThreshold();

    for (uint256 i = 0; i < appsOfRound.length; i++) {
      bytes32 appId = appsOfRound[i];

      // Rule 2: at least one rewarded action in the round
      if ($.veBetterPassport.appRoundActionCount(appId, _roundId) == 0) {
        continue;
      }

      // Rule 3: exclude only if unendorsed at BOTH boundaries
      bool unendorsedAtStart = $.x2EarnApps.getScoreAtTimepoint(appId, snapshot) < threshold;
      bool unendorsedAtEnd = $.x2EarnApps.getScoreAtTimepoint(appId, deadline) < threshold;
      if (unendorsedAtStart && unendorsedAtEnd) {
        continue;
      }

      eligibleApps[eligibleCount] = appId;
      unchecked {
        eligibleCount++;
      }
    }
  }

  // ---------- Getters ---------- //

  /**
   * @notice Returns the apps eligible for DBA rewards in a given round
   * @dev Same on-chain filter used internally by `distributeDBARewards`. Useful for
   * off-chain monitoring and pre-distribution simulation.
   * @param _roundId The round ID to check
   * @return The eligible app IDs (trimmed to actual count)
   */
  function eligibleAppsForRound(uint256 _roundId) external view returns (bytes32[] memory) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    (bytes32[] memory eligibleApps, uint256 eligibleCount) = _buildEligibleApps($, _roundId);
    bytes32[] memory trimmed = new bytes32[](eligibleCount);
    for (uint256 i = 0; i < eligibleCount; i++) {
      trimmed[i] = eligibleApps[i];
    }
    return trimmed;
  }

  /**
   * @notice Gets the reward amount distributed to a specific app for a specific round
   * @param _roundId The round ID to check
   * @param _appId The app ID to check
   * @return The reward amount for the app for the round or 0 if no rewards have been distributed
   */
  function dbaRoundRewardsForApp(uint256 _roundId, bytes32 _appId) external view returns (uint256) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.dbaRoundRewardsForApp[_roundId][_appId];
  }

  /**
   * @notice Gets the current B3TR balance of this contract
   * @return The current B3TR balance
   */
  function b3trBalance() external view returns (uint256) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.b3tr.balanceOf(address(this));
  }

  /**
   * @notice External getter to check if DBA rewards can be distributed for a specific round
   * @param _roundId The round ID to check
   * @return True if DBA rewards can be distributed for the round
   */
  function canDistributeDBARewards(uint256 _roundId) external view returns (bool) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return _canDistributeDBARewards($, _roundId);
  }

  /**
   * @notice Internal function to check if DBA rewards can be distributed for a specific round
   * @param _roundId The round ID to check
   * @return True if DBA rewards can be distributed for the round
   */
  function _canDistributeDBARewards(DBAPoolStorage storage $, uint256 _roundId) internal view returns (bool) {
    // Round is valid if it's after the designated start round and rewards have not been distributed yet
    bool isRoundValid = _roundId >= $.distributionStartRound && !$.dbaRewardsDistributed[_roundId];

    // Unallocated funds must exist
    uint256 totalUnallocatedFunds = $.xAllocationPool.unallocatedFunds(_roundId);

    // All apps must have claimed their rewards for the round, otherwise the unallocated funds cannot be considered final
    bool allFundsClaimed = $.xAllocationPool.allFundsClaimed(_roundId);

    return isRoundValid && totalUnallocatedFunds > 0 && allFundsClaimed;
  }

  /**
   * @notice External getter to get the amount of funds to distribute for a specific round
   * @param _roundId The round ID to check
   * @return The amount of funds to distribute for the round
   */
  function fundsForRound(uint256 _roundId) external view returns (uint256) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.xAllocationPool.unallocatedFunds(_roundId);
  }

  /**
   * @notice Checks if DBA rewards have been distributed for a specific round
   * @param _roundId The round ID to check
   * @return True if rewards have been distributed for the round
   */
  function isDBARewardsDistributed(uint256 _roundId) external view returns (bool) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.dbaRewardsDistributed[_roundId];
  }

  /**
   * @notice Gets the starting round for DBA distribution
   * @return The starting round ID
   */
  function distributionStartRound() external view returns (uint256) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.distributionStartRound;
  }

  /**
   * @notice Gets the treasury address for overflow routing
   * @return The treasury address
   */
  function treasuryAddress() external view returns (address) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.treasuryAddress;
  }

  /**
   * @notice Gets the merit cap multiplier
   * @return The merit cap multiplier
   */
  function meritCapMultiplier() external view returns (uint256) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.meritCapMultiplier;
  }

  /**
   * @notice Gets the X2EarnApps contract
   * @return The contract interface
   */
  function x2EarnApps() external view returns (IX2EarnApps) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.x2EarnApps;
  }

  /**
   * @notice Gets the B3TR token contract
   * @return The contract interface
   */
  function b3tr() external view returns (IB3TR) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.b3tr;
  }

  /**
   * @notice Gets the XAllocationPool contract
   * @return The contract interface
   */
  function xAllocationPool() external view returns (IXAllocationPool) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.xAllocationPool;
  }

  /**
   * @notice Gets the X2EarnRewardsPool contract
   * @return The contract interface
   */
  function x2EarnRewardsPool() external view returns (IX2EarnRewardsPool) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.x2EarnRewardsPool;
  }

  /**
   * @notice Gets the VeBetterPassport contract (V4)
   * @return The contract interface
   */
  function veBetterPassport() external view returns (IVeBetterPassport) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.veBetterPassport;
  }

  /**
   * @notice Gets the XAllocationVoting contract (V4)
   * @return The contract interface
   */
  function xAllocationVoting() external view returns (IXAllocationVotingGovernor) {
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    return $.xAllocationVoting;
  }

  /**
   * @notice Gets the contract version
   * @return The version string
   */
  function version() external pure returns (string memory) {
    return "4";
  }

  // ---------- Admin functions ---------- //

  /**
   * @notice Pauses the contract
   */
  function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _pause();
  }

  /**
   * @notice Unpauses the contract
   */
  function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
    _unpause();
  }

  /**
   * @notice Updates the X2EarnApps contract
   * @param _x2EarnApps The new contract interface
   */
  function setX2EarnApps(IX2EarnApps _x2EarnApps) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(address(_x2EarnApps) != address(0), "DBAPool: zero address");
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    $.x2EarnApps = _x2EarnApps;
  }

  /**
   * @notice Updates the XAllocationPool contract
   * @param _xAllocationPool The new contract interface
   */
  function setXAllocationPool(IXAllocationPool _xAllocationPool) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(address(_xAllocationPool) != address(0), "DBAPool: zero address");
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    $.xAllocationPool = _xAllocationPool;
  }

  /**
   * @notice Updates the X2EarnRewardsPool contract
   * @param _x2EarnRewardsPool The new contract interface
   */
  function setX2EarnRewardsPool(IX2EarnRewardsPool _x2EarnRewardsPool) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(address(_x2EarnRewardsPool) != address(0), "DBAPool: zero address");
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    $.x2EarnRewardsPool = _x2EarnRewardsPool;
  }

  /**
   * @notice Updates the distribution start round
   * @param _distributionStartRound The new distribution start round
   */
  function setDistributionStartRound(uint256 _distributionStartRound) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_distributionStartRound != 0, "DBAPool: distribution start round is zero");
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    $.distributionStartRound = _distributionStartRound;
  }

  /**
   * @notice Updates the treasury address for overflow routing
   * @param _treasuryAddress The new treasury address
   */
  function setTreasuryAddress(address _treasuryAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_treasuryAddress != address(0), "DBAPool: zero address");
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    $.treasuryAddress = _treasuryAddress;
  }

  /**
   * @notice Updates the merit cap multiplier
   * @param _meritCapMultiplier The new multiplier (e.g. 2 = 2x vote allocation)
   */
  function setMeritCapMultiplier(uint256 _meritCapMultiplier) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(_meritCapMultiplier > 0, "DBAPool: merit cap multiplier is zero");
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    $.meritCapMultiplier = _meritCapMultiplier;
  }

  /**
   * @notice Updates the VeBetterPassport contract used for on-chain action count reads
   * @param _veBetterPassport The new contract interface
   */
  function setVeBetterPassport(IVeBetterPassport _veBetterPassport) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(address(_veBetterPassport) != address(0), "DBAPool: zero address");
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    $.veBetterPassport = _veBetterPassport;
  }

  /**
   * @notice Updates the XAllocationVoting contract used for on-chain round/endorsement reads
   * @param _xAllocationVoting The new contract interface
   */
  function setXAllocationVoting(IXAllocationVotingGovernor _xAllocationVoting) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(address(_xAllocationVoting) != address(0), "DBAPool: zero address");
    DBAPoolStorage storage $ = _getDBAPoolStorage();
    $.xAllocationVoting = _xAllocationVoting;
  }

  /**
   * @notice Seeds the reward amounts for multiple apps across multiple rounds (batch operation)
   * @param _roundIds Array of round IDs to seed
   * @param _appIds Array of app IDs to seed
   * @param _amounts Array of amounts to seed
   */
  function seedDBARewardsForApps(
    uint256[] calldata _roundIds,
    bytes32[] calldata _appIds,
    uint256[] calldata _amounts
  ) external onlyRole(UPGRADER_ROLE) {
    require(_roundIds.length == _appIds.length, "DBAPool: arrays length mismatch");
    require(_roundIds.length == _amounts.length, "DBAPool: arrays length mismatch");
    require(_roundIds.length > 0, "DBAPool: empty arrays");

    DBAPoolStorage storage $ = _getDBAPoolStorage();

    for (uint256 i = 0; i < _roundIds.length; i++) {
      uint256 roundId = _roundIds[i];
      bytes32 appId = _appIds[i];
      uint256 amount = _amounts[i];

      // Validate amount
      require(amount > 0, "DBAPool: amount is zero");

      // Validate that the round is valid: after distribution start
      require(roundId >= $.distributionStartRound, "DBAPool: round is invalid");

      // Validate that the app exists
      require($.x2EarnApps.appExists(appId), "DBAPool: app does not exist");

      // If the app has already received rewards for the round, revert
      require($.dbaRoundRewardsForApp[roundId][appId] == 0, "DBAPool: app has already received rewards for the round");

      // Seed the reward amount
      $.dbaRoundRewardsForApp[roundId][appId] = amount;
    }
  }
}
