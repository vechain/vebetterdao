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

import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { INavigator } from "./interfaces/INavigator.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";
import { IVeBetterPassport } from "./interfaces/IVeBetterPassport.sol";

/**
 * @title Navigator
 * @notice Manages navigator registration, staking, delegation, and fee handling for VeBetterDAO
 * @dev Navigators are public voting agents who manage aggregated delegated voting power.
 * Uses checkpointed aggregate power (like OZ VotesUpgradeable) for O(1) voting operations.
 *
 * Key features:
 * - Navigator registration with IPFS profile
 * - VOT3 staking for capacity
 * - Checkpointed aggregate voting power per navigator (no loops)
 * - Navigator votes with total delegated power, rewards flow to navigator
 * - Fee locking for configurable rounds before claimable
 */
contract Navigator is INavigator, AccessControlUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
  using Checkpoints for Checkpoints.Trace208;

  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  bytes32 public constant FEE_RECORDER_ROLE = keccak256("FEE_RECORDER_ROLE");
  bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");

  /// @custom:storage-location erc7201:b3tr.storage.Navigator
  struct NavigatorStorage {
    mapping(address => NavigatorInfo) navigators;
    mapping(address => uint256) navigatorStake;
    mapping(address => address) userToNavigator;
    mapping(address => Checkpoints.Trace208) delegationCheckpoints; // User -> navigator at timepoint
    mapping(address => Checkpoints.Trace208) navigatorVotingPower; // Navigator -> aggregate voting power
    mapping(address => uint256) delegatedAmount; // Amount each user delegated
    mapping(address => mapping(uint256 => uint256)) lockedFees;
    mapping(address => uint256[]) navigatorFeeRounds;
    IERC20 vot3Token;
    IERC20 b3trToken;
    IXAllocationVotingGovernor xAllocationVotingContract;
    IVeBetterPassport veBetterPassport;
    uint256 feePercentageDefault;
    uint256 minStakeAmount;
    uint256 maxStakeAmount;
    uint256 stakeRatioBps;
    uint256 feeLockRoundsCount;
    uint256 maxFeePercentageBps;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.Navigator")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant NavigatorStorageLocation =
    0x9a4c08c1e0e1f9b2a3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a500;

  function _getNavigatorStorage() private pure returns (NavigatorStorage storage $) {
    assembly {
      $.slot := NavigatorStorageLocation
    }
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  struct InitializationData {
    address admin;
    address upgrader;
    address feeRecorder;
    address governance;
    address vot3;
    address b3tr;
    address xAllocationVoting;
    address veBetterPassport;
    uint256 minStake;
    uint256 maxStake;
    uint256 stakeRatio;
    uint256 feeLockRounds;
    uint256 maxFeePercentage;
  }

  function initialize(InitializationData memory data) external initializer {
    __AccessControl_init();
    __ReentrancyGuard_init();
    __UUPSUpgradeable_init();

    if (data.admin == address(0)) revert ZeroAddress();
    if (data.vot3 == address(0)) revert ZeroAddress();
    if (data.b3tr == address(0)) revert ZeroAddress();
    if (data.xAllocationVoting == address(0)) revert ZeroAddress();
    if (data.veBetterPassport == address(0)) revert ZeroAddress();

    _grantRole(DEFAULT_ADMIN_ROLE, data.admin);
    _grantRole(UPGRADER_ROLE, data.upgrader);
    _grantRole(FEE_RECORDER_ROLE, data.feeRecorder);
    _grantRole(GOVERNANCE_ROLE, data.governance);

    NavigatorStorage storage $ = _getNavigatorStorage();
    $.veBetterPassport = IVeBetterPassport(data.veBetterPassport);
    $.vot3Token = IERC20(data.vot3);
    $.b3trToken = IERC20(data.b3tr);
    $.xAllocationVotingContract = IXAllocationVotingGovernor(data.xAllocationVoting);
    $.minStakeAmount = data.minStake;
    $.maxStakeAmount = data.maxStake;
    $.stakeRatioBps = data.stakeRatio;
    $.feeLockRoundsCount = data.feeLockRounds;
    $.maxFeePercentageBps = data.maxFeePercentage;
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  function clock() public view returns (uint48) {
    return Time.blockNumber();
  }

  // ============ Navigator Registration ============

  function registerNavigator(string calldata profile, uint256 feePercentage) external override {
    NavigatorStorage storage $ = _getNavigatorStorage();

    if ($.navigators[msg.sender].registered) {
      revert NavigatorAlreadyRegistered(msg.sender);
    }
    if (feePercentage > $.maxFeePercentageBps) {
      revert FeePercentageTooHigh(feePercentage, $.maxFeePercentageBps);
    }

    $.navigators[msg.sender] = NavigatorInfo({
      registered: true,
      active: false,
      profile: profile,
      registeredAt: block.timestamp,
      feePercentage: feePercentage
    });

    emit NavigatorRegistered(msg.sender, profile, feePercentage);
  }

  function updateProfile(string calldata newProfile) external override {
    NavigatorStorage storage $ = _getNavigatorStorage();

    if (!$.navigators[msg.sender].registered) {
      revert NotRegisteredNavigator(msg.sender);
    }

    $.navigators[msg.sender].profile = newProfile;

    emit NavigatorProfileUpdated(msg.sender, newProfile);
  }

  function getNavigatorInfo(address navigator) external view override returns (NavigatorInfo memory) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.navigators[navigator];
  }

  function isRegisteredNavigator(address account) external view override returns (bool) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.navigators[account].registered;
  }

  function isNavigatorActive(address navigator) public view override returns (bool) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.navigators[navigator].active;
  }

  function _updateNavigatorActiveStatus(address navigator) internal {
    NavigatorStorage storage $ = _getNavigatorStorage();

    if (!$.navigators[navigator].registered) return;

    uint256 capacity = getDelegationCapacity(navigator);
    bool shouldBeActive = capacity > 0;
    bool isCurrentlyActive = $.navigators[navigator].active;

    if (shouldBeActive && !isCurrentlyActive) {
      $.navigators[navigator].active = true;
      emit NavigatorActivated(navigator);
    } else if (!shouldBeActive && isCurrentlyActive) {
      $.navigators[navigator].active = false;
      emit NavigatorDeactivated(navigator);
    }
  }

  // ============ Staking ============

  function stake(uint256 amount) external override nonReentrant {
    NavigatorStorage storage $ = _getNavigatorStorage();

    if (!$.navigators[msg.sender].registered) {
      revert NotRegisteredNavigator(msg.sender);
    }

    uint256 newStake = $.navigatorStake[msg.sender] + amount;
    if (newStake < $.minStakeAmount) {
      revert StakeBelowMinimum(newStake, $.minStakeAmount);
    }

    $.navigatorStake[msg.sender] = newStake;

    require($.vot3Token.transferFrom(msg.sender, address(this), amount), "Navigator: stake transfer failed");

    _updateNavigatorActiveStatus(msg.sender);

    emit NavigatorStaked(msg.sender, amount, newStake);
  }

  function unstake(uint256 amount) external override nonReentrant {
    NavigatorStorage storage $ = _getNavigatorStorage();

    if (!$.navigators[msg.sender].registered) {
      revert NotRegisteredNavigator(msg.sender);
    }

    uint256 currentStake = $.navigatorStake[msg.sender];
    if (amount > currentStake) {
      revert InsufficientStake(amount, currentStake);
    }

    uint256 newStake = currentStake - amount;
    uint256 totalDelegated = $.navigatorVotingPower[msg.sender].latest();

    if (newStake > 0 && newStake < $.minStakeAmount) {
      revert StakeBelowMinimum(newStake, $.minStakeAmount);
    }

    uint256 newCapacity = _calculateCapacity(newStake);
    if (totalDelegated > newCapacity) {
      revert UnstakeWouldExceedCapacity(msg.sender);
    }

    $.navigatorStake[msg.sender] = newStake;

    require($.vot3Token.transfer(msg.sender, amount), "Navigator: unstake transfer failed");

    _updateNavigatorActiveStatus(msg.sender);

    emit NavigatorUnstaked(msg.sender, amount, newStake);
  }

  function getStake(address navigator) external view override returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.navigatorStake[navigator];
  }

  function getDelegationCapacity(address navigator) public view override returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    uint256 staked = $.navigatorStake[navigator];
    return _calculateCapacity(staked);
  }

  function _calculateCapacity(uint256 staked) internal view returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();

    if (staked < $.minStakeAmount) return 0;

    uint256 effectiveStake = staked > $.maxStakeAmount ? $.maxStakeAmount : staked;
    return (effectiveStake * 10000) / $.stakeRatioBps;
  }

  /**
   * @dev Get current total delegated power for a navigator (latest checkpoint)
   */
  function getTotalDelegated(address navigator) external view override returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.navigatorVotingPower[navigator].latest();
  }

  /**
   * @dev Get navigator's voting power at a specific timepoint (for historical lookups)
   */
  function getNavigatorVotingPower(address navigator, uint256 timepoint) public view returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.navigatorVotingPower[navigator].upperLookupRecent(SafeCast.toUint48(timepoint));
  }

  function getAvailableCapacity(address navigator) external view override returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    uint256 capacity = getDelegationCapacity(navigator);
    uint256 delegated = $.navigatorVotingPower[navigator].latest();
    return capacity > delegated ? capacity - delegated : 0;
  }

  // ============ Delegation ============

  function delegateTo(address navigator) external override {
    NavigatorStorage storage $ = _getNavigatorStorage();

    if (!$.navigators[navigator].active) {
      revert NavigatorNotActive(navigator);
    }

    address currentNavigator = $.userToNavigator[msg.sender];
    if (currentNavigator != address(0)) {
      revert AlreadyDelegated(msg.sender, currentNavigator);
    }

    uint256 userVotingPower = $.vot3Token.balanceOf(msg.sender);
    uint256 capacity = getDelegationCapacity(navigator);
    uint256 currentDelegated = $.navigatorVotingPower[navigator].latest();

    if (currentDelegated + userVotingPower > capacity) {
      revert NavigatorCapacityExceeded(navigator, capacity, currentDelegated + userVotingPower);
    }

    // Update user's navigator
    $.userToNavigator[msg.sender] = navigator;
    $.delegatedAmount[msg.sender] = userVotingPower;

    // Update navigator's checkpointed voting power
    _updateNavigatorVotingPower(navigator, currentDelegated + userVotingPower);

    // Checkpoint user's delegation
    uint208 encodedNavigator = uint208(uint160(navigator));
    $.delegationCheckpoints[msg.sender].push(clock(), encodedNavigator);

    emit DelegatedToNavigator(msg.sender, navigator, userVotingPower);
  }

  function removeDelegation() external override {
    NavigatorStorage storage $ = _getNavigatorStorage();

    address currentNavigator = $.userToNavigator[msg.sender];
    if (currentNavigator == address(0)) {
      revert NotDelegated(msg.sender);
    }

    uint256 delegatedPower = $.delegatedAmount[msg.sender];
    uint256 currentTotal = $.navigatorVotingPower[currentNavigator].latest();

    // Update navigator's checkpointed voting power
    _updateNavigatorVotingPower(currentNavigator, currentTotal - delegatedPower);

    $.delegatedAmount[msg.sender] = 0;
    $.userToNavigator[msg.sender] = address(0);
    $.delegationCheckpoints[msg.sender].push(clock(), 0);

    emit DelegationRemoved(msg.sender, currentNavigator);
  }

  /**
   * @dev Update navigator's checkpointed voting power
   */
  function _updateNavigatorVotingPower(address navigator, uint256 newPower) internal {
    NavigatorStorage storage $ = _getNavigatorStorage();
    $.navigatorVotingPower[navigator].push(clock(), SafeCast.toUint208(newPower));
  }

  /**
   * @dev Refresh delegation to update voting power if user's VOT3 balance changed.
   * Can be called by anyone to sync the navigator's power with user's current balance.
   */
  function refreshDelegation(address user) external {
    NavigatorStorage storage $ = _getNavigatorStorage();

    address currentNavigator = $.userToNavigator[user];
    if (currentNavigator == address(0)) {
      revert NotDelegated(user);
    }

    uint256 oldAmount = $.delegatedAmount[user];
    uint256 newAmount = $.vot3Token.balanceOf(user);

    if (oldAmount == newAmount) {
      return; // No change needed
    }

    // Update navigator's checkpointed voting power
    uint256 currentTotal = $.navigatorVotingPower[currentNavigator].latest();
    uint256 newTotal = currentTotal - oldAmount + newAmount;
    _updateNavigatorVotingPower(currentNavigator, newTotal);

    $.delegatedAmount[user] = newAmount;

    emit DelegationRefreshed(user, currentNavigator, oldAmount, newAmount);
  }

  /**
   * @dev Get the amount a user delegated (stored at delegation time).
   */
  function getDelegatedAmount(address user) external view returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.delegatedAmount[user];
  }

  function getNavigatorOf(address user) external view override returns (address) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.userToNavigator[user];
  }

  function getNavigatorAtTimepoint(address user, uint256 timepoint) public view override returns (address) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    uint208 encoded = $.delegationCheckpoints[user].upperLookupRecent(SafeCast.toUint48(timepoint));
    return address(uint160(encoded));
  }

  // Note: getDelegators removed - aggregate model doesn't track individual delegators on-chain
  // Navigator votes with aggregate power, rewards flow to navigator

  // ============ Fee Management ============

  function recordFee(address navigator, uint256 round, uint256 amount) external override onlyRole(FEE_RECORDER_ROLE) {
    NavigatorStorage storage $ = _getNavigatorStorage();

    if ($.lockedFees[navigator][round] == 0) {
      $.navigatorFeeRounds[navigator].push(round);
    }

    $.lockedFees[navigator][round] += amount;

    emit FeesRecorded(navigator, round, amount);
  }

  function claimFees(uint256 round) external override nonReentrant {
    NavigatorStorage storage $ = _getNavigatorStorage();

    if (!$.navigators[msg.sender].registered) {
      revert NotRegisteredNavigator(msg.sender);
    }

    uint256 currentRound = $.xAllocationVotingContract.currentRoundId();
    if (round + $.feeLockRoundsCount >= currentRound) {
      revert FeesStillLocked(round, round + $.feeLockRoundsCount);
    }

    uint256 amount = $.lockedFees[msg.sender][round];
    if (amount == 0) {
      revert NoFeesToClaim(msg.sender, round);
    }

    $.lockedFees[msg.sender][round] = 0;

    require($.b3trToken.transfer(msg.sender, amount), "Navigator: fee transfer failed");

    emit FeesClaimed(msg.sender, round, amount);
  }

  function getLockedFees(address navigator, uint256 round) external view override returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.lockedFees[navigator][round];
  }

  function getTotalUnclaimedFees(address navigator) external view override returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();

    uint256 total = 0;
    uint256[] memory rounds = $.navigatorFeeRounds[navigator];
    for (uint256 i = 0; i < rounds.length; i++) {
      total += $.lockedFees[navigator][rounds[i]];
    }
    return total;
  }

  function areFeesClaimable(uint256 round) public view override returns (bool) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    uint256 currentRound = $.xAllocationVotingContract.currentRoundId();
    return round + $.feeLockRoundsCount < currentRound;
  }

  // ============ Configuration Getters ============

  function feeLockRounds() external view override returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.feeLockRoundsCount;
  }

  function minStake() external view override returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.minStakeAmount;
  }

  function maxStake() external view override returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.maxStakeAmount;
  }

  function stakeRatio() external view override returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.stakeRatioBps;
  }

  function maxFeePercentage() external view override returns (uint256) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return $.maxFeePercentageBps;
  }

  function vot3() external view override returns (address) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return address($.vot3Token);
  }

  function b3tr() external view override returns (address) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return address($.b3trToken);
  }

  function veBetterPassport() external view returns (address) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return address($.veBetterPassport);
  }

  function xAllocationVoting() external view override returns (address) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    return address($.xAllocationVotingContract);
  }

  // ============ Governance Setters ============

  function setMinStake(uint256 newMinStake) external onlyRole(GOVERNANCE_ROLE) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    $.minStakeAmount = newMinStake;
  }

  function setMaxStake(uint256 newMaxStake) external onlyRole(GOVERNANCE_ROLE) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    $.maxStakeAmount = newMaxStake;
  }

  function setStakeRatio(uint256 newStakeRatio) external onlyRole(GOVERNANCE_ROLE) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    $.stakeRatioBps = newStakeRatio;
  }

  function setFeeLockRounds(uint256 newFeeLockRounds) external onlyRole(GOVERNANCE_ROLE) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    $.feeLockRoundsCount = newFeeLockRounds;
  }

  function setMaxFeePercentage(uint256 newMaxFeePercentage) external onlyRole(GOVERNANCE_ROLE) {
    NavigatorStorage storage $ = _getNavigatorStorage();
    $.maxFeePercentageBps = newMaxFeePercentage;
  }

  function version() external pure override returns (string memory) {
    return "1";
  }
}
