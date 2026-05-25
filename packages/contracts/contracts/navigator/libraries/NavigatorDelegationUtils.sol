// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { NavigatorStorageTypes } from "./NavigatorStorageTypes.sol";
import { NavigatorLifecycleUtils } from "./NavigatorLifecycleUtils.sol";
import { INavigatorRegistry } from "../../interfaces/INavigatorRegistry.sol";
import { IVOT3 } from "../../interfaces/IVOT3.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

/// @title NavigatorDelegationUtils
/// @notice Handles citizen delegation to navigators.
/// @dev Citizens delegate a specific VOT3 amount to a navigator.
/// - VOT3 stays in citizen's wallet but delegated portion is locked (enforced by VOT3._update())
/// - One navigator per citizen
/// - Changes take effect at next round start (snapshot-based)
/// - Partial undelegation allowed
/// - No personhood check for delegated citizens
/// - Citizens cannot vote manually while delegated
/// - Auto-voting disabled when delegating
/// - Lazy invalidation: when a navigator exits or is deactivated, all delegations become void
///   immediately at the view level (isDelegated=false, getDelegatedAmount=0, undelegate/reduceDelegation
///   revert with NotDelegated). No DelegationRemoved events are emitted — indexers must treat
///   ExitAnnounced / NavigatorDeactivated events as implicit bulk removal of all citizen delegations.
library NavigatorDelegationUtils {
  using Checkpoints for Checkpoints.Trace208;

  /// @dev Matches governance minimum voting power (1 VOT3, 18 decimals)
  uint256 private constant MIN_DELEGATION = 1 ether;

  // ======================== Events ======================== //

  /// @notice Emitted when a citizen delegates VOT3 to a navigator for the first time
  event DelegationCreated(address indexed citizen, address indexed navigator, uint256 amount);

  /// @notice Emitted when a citizen increases their existing delegation
  event DelegationIncreased(address indexed citizen, address indexed navigator, uint256 addedAmount, uint256 newTotal);

  /// @notice Emitted when a citizen reduces their delegation (but doesn't fully remove)
  event DelegationDecreased(
    address indexed citizen,
    address indexed navigator,
    uint256 removedAmount,
    uint256 newTotal
  );

  /// @notice Emitted when a citizen explicitly undelegates from an active navigator
  /// @dev NOT emitted when a navigator exits or is deactivated. When a navigator dies, all its
  /// delegations become void implicitly — indexers must treat ExitAnnounced / NavigatorDeactivated
  /// as bulk removal of all citizen delegations for that navigator.
  event DelegationRemoved(address indexed citizen, address indexed navigator, uint256 amount);

  // ======================== Errors ======================== //

  /// @notice Thrown when citizen is already delegated to a navigator
  error AlreadyDelegated(address citizen, address currentNavigator);

  /// @notice Thrown when citizen is not delegated to any navigator
  error NotDelegated(address citizen);

  /// @notice Thrown when navigator cannot accept new delegations
  error NavigatorCannotAcceptDelegations(address navigator);

  /// @notice Thrown when delegation would exceed navigator's capacity
  error ExceedsNavigatorCapacity(address navigator, uint256 requested, uint256 available);

  /// @notice Thrown when delegation amount is zero
  error ZeroDelegationAmount();

  /// @notice Thrown when delegation amount is below the minimum (1 VOT3) or partial reduction would leave a sub-minimum positive balance
  error BelowMinimumDelegation(uint256 amount, uint256 minimum);

  /// @notice Thrown when trying to undelegate more than delegated
  error InsufficientDelegation(uint256 requested, uint256 available);

  /// @notice Thrown when navigator tries to delegate to themselves
  error SelfDelegationNotAllowed(address account);

  /// @notice Thrown when delegation would exceed the citizen's unlocked VOT3 balance
  error InsufficientUnlockedBalance(address citizen, uint256 requested, uint256 available);

  // ======================== Delegation ======================== //

  /// @notice Delegate VOT3 to a navigator (first-time only)
  /// @dev Citizen must not already be delegated. Navigator must be active and have capacity.
  /// If the citizen has a stale delegation (dead navigator), it is auto-cleared first.
  /// @param citizen The citizen address
  /// @param navigator The navigator to delegate to
  /// @param amount The VOT3 amount to delegate
  function delegate(address citizen, address navigator, uint256 amount) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (amount == 0) revert ZeroDelegationAmount();
    if (amount < MIN_DELEGATION) revert BelowMinimumDelegation(amount, MIN_DELEGATION);
    if (citizen == navigator) revert SelfDelegationNotAllowed(citizen);

    address currentNavigator = _currentNavigator($, citizen);
    if (currentNavigator != address(0)) {
      if (_isNavigatorDead($, currentNavigator)) {
        // Auto-clear stale checkpoint — delegation was conceptually removed when the navigator died.
        // No DelegationRemoved emitted here; indexers treat navigator deactivation as implicit bulk removal.
        uint256 oldAmount = _currentDelegatedAmount($, citizen);
        _pushTotalDelegated($, currentNavigator, -int256(oldAmount));
        $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), 0);
        _removeDelegation($, citizen, currentNavigator);
      } else {
        revert AlreadyDelegated(citizen, currentNavigator);
      }
    }

    // After any auto-clear, getDelegatedAmount returns 0, so unlockedBalance == balanceOf.
    // In a switch tx (undelegate clause then delegate clause), undelegate runs first, so
    // unlockedBalance also reads as full balanceOf here.
    _validateUnlockedBalance($, citizen, amount);
    _validateNavigatorCanAccept($, navigator, amount);

    $.citizenToNavigator[citizen].push(SafeCast.toUint48(block.number), uint208(uint160(navigator)));
    $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), SafeCast.toUint208(amount));
    _pushTotalDelegated($, navigator, int256(amount));
    _pushTotalDelegatedCitizens($, 1);
    $.navigatorCitizenCount[navigator]++;

    emit DelegationCreated(citizen, navigator, amount);
  }

  /// @notice Increase delegation to the current navigator
  /// @dev Citizen must already be delegated. Navigator must be active and have capacity for the additional amount.
  /// @param citizen The citizen address
  /// @param amount The additional VOT3 amount to delegate
  function increaseDelegation(address citizen, uint256 amount) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (amount == 0) revert ZeroDelegationAmount();

    address currentNavigator = _currentNavigator($, citizen);
    if (currentNavigator == address(0)) revert NotDelegated(citizen);
    if (_isNavigatorDead($, currentNavigator)) revert NotDelegated(citizen);

    _validateUnlockedBalance($, citizen, amount);
    _validateNavigatorCanAccept($, currentNavigator, amount);

    uint256 currentAmount = _currentDelegatedAmount($, citizen);
    uint256 newTotal = currentAmount + amount;
    $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), SafeCast.toUint208(newTotal));
    _pushTotalDelegated($, currentNavigator, int256(amount));

    emit DelegationIncreased(citizen, currentNavigator, amount, newTotal);
  }

  /// @notice Partially reduce delegation amount
  /// @dev Takes effect next round. Citizen remains delegated to the same navigator.
  /// @param citizen The citizen address
  /// @param reduceBy The VOT3 amount to reduce delegation by
  function reduceDelegation(address citizen, uint256 reduceBy) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    address currentNavigator = _currentNavigator($, citizen);
    if (currentNavigator == address(0)) revert NotDelegated(citizen);
    if (_isNavigatorDead($, currentNavigator)) revert NotDelegated(citizen);
    if (reduceBy == 0) revert ZeroDelegationAmount();

    uint256 current = _currentDelegatedAmount($, citizen);
    if (reduceBy > current) {
      revert InsufficientDelegation(reduceBy, current);
    }

    uint256 newAmount = current - reduceBy;
    if (newAmount != 0 && newAmount < MIN_DELEGATION) revert BelowMinimumDelegation(newAmount, MIN_DELEGATION);

    $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), SafeCast.toUint208(newAmount));
    _pushTotalDelegated($, currentNavigator, -int256(reduceBy));

    // If reduced to 0, fully undelegate
    if (newAmount == 0) {
      _removeDelegation($, citizen, currentNavigator);
      _pushTotalDelegatedCitizens($, -1);
      $.navigatorCitizenCount[currentNavigator]--;
      emit DelegationRemoved(citizen, currentNavigator, current);
    } else {
      emit DelegationDecreased(citizen, currentNavigator, reduceBy, newAmount);
    }
  }

  /// @notice Fully undelegate from the current navigator
  /// @param citizen The citizen address
  function undelegate(address citizen) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    address currentNavigator = _currentNavigator($, citizen);
    if (currentNavigator == address(0)) revert NotDelegated(citizen);
    if (_isNavigatorDead($, currentNavigator)) revert NotDelegated(citizen);

    uint256 amount = _currentDelegatedAmount($, citizen);
    _pushTotalDelegated($, currentNavigator, -int256(amount));
    $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), 0);

    _removeDelegation($, citizen, currentNavigator);
    _pushTotalDelegatedCitizens($, -1);
    $.navigatorCitizenCount[currentNavigator]--;

    emit DelegationRemoved(citizen, currentNavigator, amount);
  }

  // ======================== Migration ======================== //

  /// @notice Cap each citizen's delegation at their current VOT3 balance.
  /// @dev One-shot migration helper to fix over-delegation introduced by a missing balance check
  /// in earlier `delegate`/`increaseDelegation` calls. For each citizen with `delegated > balance`,
  /// rewrites the citizen's delegation checkpoint to `balance` and decrements the navigator's total
  /// by the same delta. Emits `DelegationDecreased` so indexers treat it as a normal user reduction.
  ///
  /// Citizens with no delegation, or whose navigator is dead (lazy-invalidated), are skipped.
  /// MIN_DELEGATION invariant is preserved automatically: the first valid `delegate()` required
  /// `amount >= 1 VOT3`, and the VOT3 transfer lock keeps `balanceOf >= delegated` for alive
  /// navigators, so the capped value is always >= 1 VOT3.
  /// @param citizens Addresses to evaluate and correct (idempotent — safe to re-run).
  function correctOverDelegations(address[] calldata citizens) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    for (uint256 i; i < citizens.length; i++) {
      _correctOverDelegation($, citizens[i]);
    }
  }

  function _correctOverDelegation(NavigatorStorageTypes.NavigatorStorage storage $, address citizen) private {
    address navigator = _currentNavigator($, citizen);
    if (navigator == address(0)) return;
    if (_isNavigatorDead($, navigator)) return;

    uint256 delegated = _currentDelegatedAmount($, citizen);
    uint256 balance = IVOT3($.vot3Token).balanceOf(citizen);
    if (delegated <= balance) return;

    uint256 reduction = delegated - balance;
    $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), SafeCast.toUint208(balance));
    _pushTotalDelegated($, navigator, -int256(reduction));
    emit DelegationDecreased(citizen, navigator, reduction, balance);
  }

  // ======================== Getters ======================== //

  /// @notice Get the navigator a citizen is delegated to (address(0) if delegation is void)
  /// @param citizen The citizen address
  /// @return The navigator address, or address(0) if not delegated or delegation is void
  function getNavigator(address citizen) external view returns (address) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    address navigator = _currentNavigator($, citizen);
    if (navigator == address(0)) return address(0);
    if (_isNavigatorDead($, navigator)) return address(0);
    return navigator;
  }

  /// @notice Get the raw navigator stored for a citizen, ignoring dead-navigator status
  /// @dev Useful for frontends to show delegation state even when navigator is dead/exiting.
  /// @param citizen The citizen address
  /// @return The raw navigator address from checkpoint, or address(0) if never delegated or undelegated
  function getRawNavigator(address citizen) external view returns (address) {
    return _currentNavigator(NavigatorStorageTypes.getNavigatorStorage(), citizen);
  }

  /// @notice Get the navigator a citizen was delegated to at a past block (checkpointed)
  /// @dev Returns address(0) if the navigator was dead (deactivated/exited) at the timepoint.
  /// @param citizen The citizen address
  /// @param timepoint The block number to query
  /// @return The navigator address at the given block (address(0) if not delegated or navigator was dead)
  function getNavigatorAtTimepoint(address citizen, uint256 timepoint) external view returns (address) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    if ($.citizenToNavigator[citizen].length() == 0) return address(0);
    uint208 raw = $.citizenToNavigator[citizen].upperLookupRecent(SafeCast.toUint48(timepoint));
    if (raw == 0) return address(0);
    address navigator = address(uint160(raw));
    if (_isDeactivatedAtTimepoint($, navigator, timepoint)) return address(0);
    return navigator;
  }

  /// @notice Get the raw navigator stored for a citizen at a past block (checkpointed)
  /// @dev Useful for frontends to show delegation state even when navigator is dead/exiting.
  /// @param citizen The citizen address
  /// @param timepoint The block number to query
  /// @return The raw navigator address from checkpoint, or address(0) if never delegated or undelegated
  function getRawNavigatorAtTimepoint(address citizen, uint256 timepoint) external view returns (address) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    if ($.citizenToNavigator[citizen].length() == 0) return address(0);
    uint208 raw = $.citizenToNavigator[citizen].upperLookupRecent(SafeCast.toUint48(timepoint));
    if (raw == 0) return address(0);
    return address(uint160(raw));
  }

  /// @notice Get the current VOT3 amount a citizen has delegated (0 if delegation is void)
  /// @param citizen The citizen address
  /// @return The delegated VOT3 amount
  function getDelegatedAmount(address citizen) external view returns (uint256) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    address navigator = _currentNavigator($, citizen);
    if (navigator == address(0)) return 0;
    if (_isNavigatorDead($, navigator)) return 0;
    return _currentDelegatedAmount($, citizen);
  }

  /// @notice Get the delegated amount at a past block (for snapshot-based voting power)
  /// @dev Does NOT apply lazy invalidation — historical data is preserved for reward calculation
  /// @param citizen The citizen address
  /// @param timepoint The block number to query
  /// @return The delegated VOT3 amount at the given block
  function getDelegatedAmountAtTimepoint(address citizen, uint256 timepoint) external view returns (uint256) {
    return
      uint256(
        NavigatorStorageTypes.getNavigatorStorage().delegatedAmount[citizen].upperLookupRecent(
          SafeCast.toUint48(timepoint)
        )
      );
  }

  /// @notice Get total VOT3 currently delegated to a navigator
  /// @param navigator The navigator address
  /// @return The total VOT3 delegated to the navigator
  function getTotalDelegated(address navigator) external view returns (uint256) {
    return _currentTotalDelegated(NavigatorStorageTypes.getNavigatorStorage(), navigator);
  }

  /// @notice Get total VOT3 delegated to a navigator at a past block
  /// @param navigator The navigator address
  /// @param timepoint The block number to query
  /// @return The total VOT3 delegated at that block
  function getTotalDelegatedAtTimepoint(address navigator, uint256 timepoint) external view returns (uint256) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    if ($.totalDelegatedToNavigator[navigator].length() == 0) return 0;
    return uint256($.totalDelegatedToNavigator[navigator].upperLookupRecent(SafeCast.toUint48(timepoint)));
  }

  /// @notice Get total number of delegated citizens at a past block
  /// @dev This is used by XAllocationVoting to get the total number of delegated citizens
  ///      at round start to enable auto-voting for them. Since the exit period for a navigator is 1 round it works fine
  ///      but if that changes we need to update the way we calculate the total number of delegated citizens.
  /// @dev When navigator announces exit, the number of citizens is zeroed out immediately, showing 0 citizens even if it
  ///      still has citizens to vote for in the round.
  /// @param timepoint The block number to query
  /// @return The total delegated citizens at that block
  function getTotalDelegatedCitizensAtTimepoint(uint48 timepoint) external view returns (uint208) {
    return NavigatorStorageTypes.getNavigatorStorage().totalDelegatedCitizens.upperLookupRecent(timepoint);
  }

  /// @notice Check if a citizen has an active delegation (false if navigator exited/deactivated)
  /// @param citizen The citizen address
  /// @return True if the citizen has an active delegation
  function isDelegated(address citizen) external view returns (bool) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    address navigator = _currentNavigator($, citizen);
    if (navigator == address(0)) return false;
    if (_isNavigatorDead($, navigator)) return false;
    return true;
  }

  /// @notice Check if a citizen was delegated to an alive navigator at a past block
  /// @param citizen The citizen address
  /// @param timepoint The block number to query
  /// @return True if the citizen had an alive navigator at the given block
  function isDelegatedAtTimepoint(address citizen, uint256 timepoint) external view returns (bool) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    if ($.citizenToNavigator[citizen].length() == 0) return false;
    uint208 raw = $.citizenToNavigator[citizen].upperLookupRecent(SafeCast.toUint48(timepoint));
    if (raw == 0) return false;
    return !_isDeactivatedAtTimepoint($, address(uint160(raw)), timepoint);
  }

  /// @notice Check if a navigator was deactivated (exited or governance-deactivated) at a given timepoint
  /// @dev Uses checkpointed navigatorDeactivated mapping.
  /// @param navigator The navigator address
  /// @param timepoint The block number to query
  /// @return True if the navigator was dead at the given timepoint
  function isDeactivatedAtTimepoint(address navigator, uint256 timepoint) external view returns (bool) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    if ($.navigatorDeactivated[navigator].length() == 0) return false;
    return $.navigatorDeactivated[navigator].upperLookupRecent(SafeCast.toUint48(timepoint)) != 0;
  }

  // ======================== Internal ======================== //

  /// @dev Check if a navigator was dead at a given timepoint using the deactivation checkpoint
  function _isDeactivatedAtTimepoint(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address navigator,
    uint256 timepoint
  ) private view returns (bool) {
    if ($.navigatorDeactivated[navigator].length() == 0) return false;
    return $.navigatorDeactivated[navigator].upperLookupRecent(SafeCast.toUint48(timepoint)) != 0;
  }

  /// @dev Read the current navigator address from checkpoint (latest value)
  function _currentNavigator(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address citizen
  ) private view returns (address) {
    if ($.citizenToNavigator[citizen].length() == 0) return address(0);
    return address(uint160($.citizenToNavigator[citizen].latest()));
  }

  /// @dev Read the latest checkpointed delegated amount for a citizen
  function _currentDelegatedAmount(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address citizen
  ) private view returns (uint256) {
    return uint256($.delegatedAmount[citizen].latest());
  }

  /// @dev Check if a navigator is "dead" (exited or deactivated) — delegation is void
  function _isNavigatorDead(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address navigator
  ) private view returns (bool) {
    if ($.navigatorDeactivated[navigator].length() == 0) return false;
    return $.navigatorDeactivated[navigator].latest() != 0;
  }

  /// @dev Read the latest total delegated to a navigator
  function _currentTotalDelegated(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address navigator
  ) private view returns (uint256) {
    if ($.totalDelegatedToNavigator[navigator].length() == 0) return 0;
    return uint256($.totalDelegatedToNavigator[navigator].latest());
  }

  /// @dev Push a delta (positive or negative) to the checkpointed totalDelegatedToNavigator
  function _pushTotalDelegated(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address navigator,
    int256 delta
  ) private {
    uint256 current = _currentTotalDelegated($, navigator);
    uint256 newValue = delta >= 0 ? current + uint256(delta) : current - uint256(-delta);
    $.totalDelegatedToNavigator[navigator].push(SafeCast.toUint48(block.number), SafeCast.toUint208(newValue));
  }

  /// @dev Push a delta (positive or negative) to the checkpointed totalDelegatedCitizens
  function _pushTotalDelegatedCitizens(NavigatorStorageTypes.NavigatorStorage storage $, int256 delta) private {
    uint256 current = _currentTotalDelegatedCitizens($);
    uint256 newValue = delta >= 0 ? current + uint256(delta) : current - uint256(-delta);
    $.totalDelegatedCitizens.push(SafeCast.toUint48(block.number), SafeCast.toUint208(newValue));
  }

  /// @dev Read the latest total delegated citizens
  function _currentTotalDelegatedCitizens(
    NavigatorStorageTypes.NavigatorStorage storage $
  ) private view returns (uint256) {
    if ($.totalDelegatedCitizens.length() == 0) return 0;
    return uint256($.totalDelegatedCitizens.latest());
  }

  /// @dev Validate that the citizen has enough unlocked VOT3 to delegate `amount` more.
  /// Reads VOT3.unlockedBalance(), which is balanceOf - currentDelegatedAmount.
  function _validateUnlockedBalance(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address citizen,
    uint256 amount
  ) private view {
    uint256 available = IVOT3($.vot3Token).unlockedBalance(citizen);
    if (amount > available) {
      revert InsufficientUnlockedBalance(citizen, amount, available);
    }
  }

  /// @dev Clear a citizen's delegation checkpoint
  /// @dev Validate that navigator can accept new delegation of the given amount
  function _validateNavigatorCanAccept(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address navigator,
    uint256 amount
  ) private view {
    if (NavigatorLifecycleUtils.getStatus(navigator) != uint8(INavigatorRegistry.NavigatorStatus.ACTIVE)) {
      revert NavigatorCannotAcceptDelegations(navigator);
    }
    uint256 stake = uint256($.stakedAmount[navigator].latest());
    if (stake < $.minStake) {
      revert NavigatorCannotAcceptDelegations(navigator);
    }
    uint256 currentTotal = _currentTotalDelegated($, navigator);
    uint256 totalAfter = currentTotal + amount;
    if (stake * 10 < totalAfter) {
      uint256 maxCapacity = stake * 10;
      uint256 remaining = maxCapacity > currentTotal ? maxCapacity - currentTotal : 0;
      revert ExceedsNavigatorCapacity(navigator, amount, remaining);
    }
  }

  function _removeDelegation(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address citizen,
    address // navigator — kept for call-site clarity
  ) private {
    $.citizenToNavigator[citizen].push(SafeCast.toUint48(block.number), 0);
  }
}
