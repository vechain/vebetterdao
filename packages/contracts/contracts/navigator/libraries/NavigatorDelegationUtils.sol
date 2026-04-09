// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { NavigatorStorageTypes } from "./NavigatorStorageTypes.sol";
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
library NavigatorDelegationUtils {
  using Checkpoints for Checkpoints.Trace208;
  // ======================== Events ======================== //

  /// @notice Emitted when a citizen delegates VOT3 to a navigator
  event DelegationCreated(address indexed citizen, address indexed navigator, uint256 amount);

  /// @notice Emitted when a citizen changes their delegation amount
  event DelegationUpdated(address indexed citizen, address indexed navigator, uint256 newAmount);

  /// @notice Emitted when a citizen fully undelegates from a navigator
  event DelegationRemoved(address indexed citizen, address indexed navigator);

  /// @notice Emitted when a citizen changes navigator (takes effect next round)
  event NavigatorChangeRequested(address indexed citizen, address indexed oldNavigator, address indexed newNavigator);

  // ======================== Errors ======================== //

  /// @notice Thrown when citizen is already delegated to a navigator
  error AlreadyDelegated(address citizen, address currentNavigator);

  /// @notice Thrown when citizen is not delegated to any navigator
  error NotDelegated(address citizen);

  /// @notice Thrown when trying to delegate to a non-navigator
  error NotANavigator(address account);

  /// @notice Thrown when navigator cannot accept new delegations
  error NavigatorCannotAcceptDelegations(address navigator);

  /// @notice Thrown when delegation would exceed navigator's capacity
  error ExceedsNavigatorCapacity(address navigator, uint256 requested, uint256 available);

  /// @notice Thrown when delegation amount is zero
  error ZeroDelegationAmount();

  /// @notice Thrown when trying to undelegate more than delegated
  error InsufficientDelegation(uint256 requested, uint256 available);

  /// @notice Thrown when navigator tries to delegate to themselves
  error SelfDelegationNotAllowed(address account);

  // ======================== Delegation ======================== //

  /// @notice Delegate VOT3 to a navigator
  /// @dev Citizen must not already be delegated. Navigator must be active and have capacity.
  /// The VOT3 lock is handled by calling VOT3.setDelegatedAmount() via NavigatorRegistry (privileged role).
  /// @param citizen The citizen address
  /// @param navigator The navigator to delegate to
  /// @param amount The VOT3 amount to delegate
  function delegate(address citizen, address navigator, uint256 amount) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (amount == 0) revert ZeroDelegationAmount();

    // Navigator cannot delegate to themselves
    if (citizen == navigator) revert SelfDelegationNotAllowed(citizen);

    address currentNavigator = _currentNavigator($, citizen);
    bool isIncrease = false;

    if (currentNavigator != address(0)) {
      if (_isNavigatorDead($, currentNavigator)) {
        // Auto-clear stale delegation — navigator exited or deactivated
        uint256 oldAmount = _currentDelegatedAmount($, citizen);
        _pushTotalDelegated($, currentNavigator, -int256(oldAmount));
        $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), 0);
        _removeDelegation($, citizen, currentNavigator);
        emit DelegationRemoved(citizen, currentNavigator);
      } else if (currentNavigator == navigator) {
        // Already delegated to the same navigator — increase delegation
        isIncrease = true;
      } else {
        // Delegated to a different active navigator
        revert AlreadyDelegated(citizen, currentNavigator);
      }
    }

    // Navigator must be registered and active
    if (!$.isRegistered[navigator] || $.isDeactivated[navigator]) revert NotANavigator(navigator);

    // Navigator must be able to accept delegations (not exiting, above min stake)
    if ($.exitAnnouncedRound[navigator] > 0 || $.stakedAmount[navigator] < $.minStake) {
      revert NavigatorCannotAcceptDelegations(navigator);
    }

    // Check capacity (stake >= 10% of total delegated)
    uint256 currentTotal = _currentTotalDelegated($, navigator);
    uint256 totalAfter = currentTotal + amount;
    if ($.stakedAmount[navigator] * 10 < totalAfter) {
      uint256 maxCapacity = $.stakedAmount[navigator] * 10;
      uint256 remaining = maxCapacity > currentTotal ? maxCapacity - currentTotal : 0;
      revert ExceedsNavigatorCapacity(navigator, amount, remaining);
    }

    if (isIncrease) {
      // Increase existing delegation
      uint256 currentAmount = _currentDelegatedAmount($, citizen);
      uint256 newAmount = currentAmount + amount;
      $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), SafeCast.toUint208(newAmount));
      _pushTotalDelegated($, navigator, int256(amount));
      emit DelegationUpdated(citizen, navigator, newAmount);
    } else {
      // New delegation
      $.citizenToNavigator[citizen].push(SafeCast.toUint48(block.number), uint208(uint160(navigator)));
      $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), SafeCast.toUint208(amount));
      _pushTotalDelegated($, navigator, int256(amount));
      emit DelegationCreated(citizen, navigator, amount);
    }
  }

  /// @notice Partially reduce delegation amount
  /// @dev Takes effect next round. Citizen remains delegated to the same navigator.
  /// @param citizen The citizen address
  /// @param reduceBy The VOT3 amount to reduce delegation by
  function reduceDelegation(address citizen, uint256 reduceBy) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    address currentNavigator = _currentNavigator($, citizen);
    if (currentNavigator == address(0)) revert NotDelegated(citizen);
    if (reduceBy == 0) revert ZeroDelegationAmount();

    uint256 current = _currentDelegatedAmount($, citizen);
    if (reduceBy > current) {
      revert InsufficientDelegation(reduceBy, current);
    }

    uint256 newAmount = current - reduceBy;

    $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), SafeCast.toUint208(newAmount));
    _pushTotalDelegated($, currentNavigator, -int256(reduceBy));

    // If reduced to 0, fully undelegate
    if (newAmount == 0) {
      _removeDelegation($, citizen, currentNavigator);
      emit DelegationRemoved(citizen, currentNavigator);
    } else {
      emit DelegationUpdated(citizen, currentNavigator, newAmount);
    }
  }

  /// @notice Fully undelegate from the current navigator
  /// @param citizen The citizen address
  function undelegate(address citizen) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    address currentNavigator = _currentNavigator($, citizen);
    if (currentNavigator == address(0)) revert NotDelegated(citizen);

    uint256 amount = _currentDelegatedAmount($, citizen);
    _pushTotalDelegated($, currentNavigator, -int256(amount));
    $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), 0);

    _removeDelegation($, citizen, currentNavigator);

    emit DelegationRemoved(citizen, currentNavigator);
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
    return uint256(
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

  /// @dev Clear a citizen's delegation checkpoint
  function _removeDelegation(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address citizen,
    address // navigator — kept for call-site clarity
  ) private {
    $.citizenToNavigator[citizen].push(SafeCast.toUint48(block.number), 0);
  }
}
