// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { NavigatorStorageTypes } from "./NavigatorStorageTypes.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title NavigatorStakingUtils
/// @notice Handles navigator registration, staking, and capacity management.
/// @dev Navigators stake B3TR to register. Stake determines delegation capacity (10:1 ratio).
/// - Minimum stake: configurable (default 50,000 B3TR)
/// - Maximum stake: configurable percentage of VOT3 total supply (enforced at deposit only)
/// - Delegation capacity: stake must be >= 10% of total delegated VOT3
library NavigatorStakingUtils {
  /// @notice Basis points scale
  uint256 private constant BASIS_POINTS = 10000;

  /// @notice Delegation ratio: stake must be >= totalDelegated / DELEGATION_RATIO
  uint256 private constant DELEGATION_RATIO = 10;

  // ======================== Events ======================== //

  /// @notice Emitted when a navigator registers by staking B3TR
  event NavigatorRegistered(address indexed navigator, uint256 stakeAmount, string metadataURI);

  /// @notice Emitted when a navigator adds to their stake
  event StakeAdded(address indexed navigator, uint256 amount, uint256 newTotal);

  /// @notice Emitted when a navigator withdraws stake (after exit)
  event StakeWithdrawn(address indexed navigator, uint256 amount, uint256 remaining);

  // ======================== Errors ======================== //

  /// @notice Thrown when stake is below minimum
  error StakeBelowMinimum(uint256 provided, uint256 minimum);

  /// @notice Thrown when stake exceeds maximum (% of VOT3 supply)
  error StakeExceedsMaximum(uint256 provided, uint256 maximum);

  /// @notice Thrown when caller is already a registered navigator
  error AlreadyRegistered(address navigator);

  /// @notice Thrown when caller is not a registered navigator
  error NotRegistered(address navigator);

  /// @notice Thrown when navigator is deactivated
  error NavigatorDeactivated(address navigator);

  /// @notice Thrown when trying to unstake while still active (must exit first)
  error NavigatorStillActive(address navigator);

  /// @notice Thrown when trying to withdraw more stake than is available
  error InsufficientStake(uint256 available, uint256 requested);

  // ======================== Registration ======================== //

  /// @notice Register as a navigator by staking B3TR
  /// @dev Permissionless — anyone can register by meeting the minimum stake.
  /// Transfers B3TR from caller to this contract.
  /// @param navigator The address registering as navigator (must be msg.sender in the main contract)
  /// @param amount The B3TR amount to stake
  /// @param metadataURI_ The navigator's profile metadata URI (IPFS or similar)
  function register(address navigator, uint256 amount, string calldata metadataURI_) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if ($.isRegistered[navigator]) revert AlreadyRegistered(navigator);
    if (amount < $.minStake) revert StakeBelowMinimum(amount, $.minStake);

    // Check max stake (% of VOT3 supply, enforced at deposit only)
    uint256 maxStake = _getMaxStake($);
    if (amount > maxStake) revert StakeExceedsMaximum(amount, maxStake);

    // Transfer B3TR from navigator to this contract
    IERC20($.b3trToken).transferFrom(navigator, address(this), amount);

    $.stakedAmount[navigator] = amount;
    $.totalStaked += amount;
    $.isRegistered[navigator] = true;
    $.metadataURI[navigator] = metadataURI_;

    emit NavigatorRegistered(navigator, amount, metadataURI_);
  }

  // ======================== Stake Management ======================== //

  /// @notice Add more B3TR to an existing navigator's stake
  /// @param navigator The navigator address
  /// @param amount The additional B3TR to stake
  function addStake(address navigator, uint256 amount) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (!$.isRegistered[navigator]) revert NotRegistered(navigator);
    if ($.isDeactivated[navigator]) revert NavigatorDeactivated(navigator);

    uint256 newTotal = $.stakedAmount[navigator] + amount;

    // Check max stake at deposit time
    uint256 maxStake = _getMaxStake($);
    if (newTotal > maxStake) revert StakeExceedsMaximum(newTotal, maxStake);

    IERC20($.b3trToken).transferFrom(navigator, address(this), amount);

    $.stakedAmount[navigator] = newTotal;
    $.totalStaked += amount;

    emit StakeAdded(navigator, amount, newTotal);
  }

  /// @notice Withdraw staked B3TR (only after exit is finalized or deactivation)
  /// @param navigator The navigator address
  /// @param amount The B3TR amount to withdraw
  function withdrawStake(address navigator, uint256 amount) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (!$.isRegistered[navigator]) revert NotRegistered(navigator);

    // Can only withdraw if exit is finalized or deactivated
    // Active navigators must exit first
    bool isExiting = $.exitAnnouncedRound[navigator] > 0;
    bool isDeactivated = $.isDeactivated[navigator];
    if (!isExiting && !isDeactivated) revert NavigatorStillActive(navigator);

    if (amount > $.stakedAmount[navigator]) revert InsufficientStake($.stakedAmount[navigator], amount);

    $.stakedAmount[navigator] -= amount;
    $.totalStaked -= amount;

    IERC20($.b3trToken).transfer(navigator, amount);

    emit StakeWithdrawn(navigator, amount, $.stakedAmount[navigator]);
  }

  // ======================== Capacity ======================== //

  /// @notice Check if a navigator has capacity for additional delegation
  /// @param navigator The navigator address
  /// @param additionalDelegation The VOT3 amount being delegated
  /// @return Whether the navigator has capacity
  function hasCapacity(address navigator, uint256 additionalDelegation) external view returns (bool) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    uint256 totalAfter = $.totalDelegatedToNavigator[navigator] + additionalDelegation;
    // Stake must be >= 10% of total delegated
    return $.stakedAmount[navigator] >= totalAfter / DELEGATION_RATIO;
  }

  /// @notice Get the maximum VOT3 that can be delegated to a navigator
  /// @param navigator The navigator address
  /// @return The maximum delegation capacity
  function getDelegationCapacity(address navigator) external view returns (uint256) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    return $.stakedAmount[navigator] * DELEGATION_RATIO;
  }

  /// @notice Get the remaining delegation capacity
  /// @param navigator The navigator address
  /// @return The remaining capacity (0 if over-capacity due to slashing)
  function getRemainingCapacity(address navigator) external view returns (uint256) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    uint256 maxCapacity = $.stakedAmount[navigator] * DELEGATION_RATIO;
    uint256 currentDelegated = $.totalDelegatedToNavigator[navigator];
    if (currentDelegated >= maxCapacity) return 0;
    return maxCapacity - currentDelegated;
  }

  // ======================== Getters ======================== //

  /// @notice Get the staked B3TR amount for a navigator
  function getStake(address navigator) external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().stakedAmount[navigator];
  }

  /// @notice Check if an address is a registered navigator
  function isNavigator(address account) external view returns (bool) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    return $.isRegistered[account] && !$.isDeactivated[account];
  }

  /// @notice Check if navigator can accept new delegations
  /// @dev Returns false if deactivated, below minimum stake, or in exit process
  function canAcceptDelegations(address navigator) external view returns (bool) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    if (!$.isRegistered[navigator]) return false;
    if ($.isDeactivated[navigator]) return false;
    if ($.exitAnnouncedRound[navigator] > 0) return false;
    // Below minimum stake (due to slashing) — can't accept new delegations
    if ($.stakedAmount[navigator] < $.minStake) return false;
    return true;
  }

  /// @notice Get the minimum stake required to register
  function getMinStake() external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().minStake;
  }

  /// @notice Get the current maximum stake allowed
  function getMaxStake() external view returns (uint256) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    return _getMaxStake($);
  }

  // ======================== Internal ======================== //

  /// @dev Calculate max stake based on VOT3 total supply and configured percentage
  function _getMaxStake(NavigatorStorageTypes.NavigatorStorage storage $) private view returns (uint256) {
    uint256 vot3Supply = IERC20($.vot3Token).totalSupply();
    return (vot3Supply * $.maxStakePercentage) / BASIS_POINTS;
  }
}
