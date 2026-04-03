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

    address currentNav = $.citizenToNavigator[citizen];
    bool isIncrease = false;

    if (currentNav != address(0)) {
      if (_isNavigatorDead($, currentNav)) {
        // Auto-clear stale delegation — navigator exited or deactivated
        uint256 oldAmount = _currentDelegatedAmount($, citizen);
        $.totalDelegatedToNavigator[currentNav] -= oldAmount;
        $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), 0);
        _removeDelegation($, citizen, currentNav);
        emit DelegationRemoved(citizen, currentNav);
      } else if (currentNav == navigator) {
        // Already delegated to the same navigator — increase delegation
        isIncrease = true;
      } else {
        // Delegated to a different active navigator
        revert AlreadyDelegated(citizen, currentNav);
      }
    }

    // Navigator must be registered and active
    if (!$.isRegistered[navigator] || $.isDeactivated[navigator]) revert NotANavigator(navigator);

    // Navigator must be able to accept delegations (not exiting, above min stake)
    if ($.exitAnnouncedRound[navigator] > 0 || $.stakedAmount[navigator] < $.minStake) {
      revert NavigatorCannotAcceptDelegations(navigator);
    }

    // Check capacity (stake >= 10% of total delegated)
    uint256 totalAfter = $.totalDelegatedToNavigator[navigator] + amount;
    if ($.stakedAmount[navigator] * 10 < totalAfter) {
      uint256 maxCapacity = $.stakedAmount[navigator] * 10;
      uint256 remaining = maxCapacity > $.totalDelegatedToNavigator[navigator]
        ? maxCapacity - $.totalDelegatedToNavigator[navigator]
        : 0;
      revert ExceedsNavigatorCapacity(navigator, amount, remaining);
    }

    if (isIncrease) {
      // Increase existing delegation
      uint256 currentAmount = _currentDelegatedAmount($, citizen);
      uint256 newAmount = currentAmount + amount;
      $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), SafeCast.toUint208(newAmount));
      $.totalDelegatedToNavigator[navigator] += amount;
      emit DelegationUpdated(citizen, navigator, newAmount);
    } else {
      // New delegation
      $.citizenToNavigator[citizen] = navigator;
      $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), SafeCast.toUint208(amount));
      $.totalDelegatedToNavigator[navigator] += amount;
      $.navigatorCitizens[navigator].push(citizen);
      $.citizenIndex[navigator][citizen] = $.navigatorCitizens[navigator].length; // 1-indexed
      emit DelegationCreated(citizen, navigator, amount);
    }
  }

  /// @notice Partially reduce delegation amount
  /// @dev Takes effect next round. Citizen remains delegated to the same navigator.
  /// @param citizen The citizen address
  /// @param reduceBy The VOT3 amount to reduce delegation by
  function reduceDelegation(address citizen, uint256 reduceBy) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if ($.citizenToNavigator[citizen] == address(0)) revert NotDelegated(citizen);
    if (reduceBy == 0) revert ZeroDelegationAmount();

    uint256 current = _currentDelegatedAmount($, citizen);
    if (reduceBy > current) {
      revert InsufficientDelegation(reduceBy, current);
    }

    address navigator = $.citizenToNavigator[citizen];
    uint256 newAmount = current - reduceBy;

    $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), SafeCast.toUint208(newAmount));
    $.totalDelegatedToNavigator[navigator] -= reduceBy;

    // If reduced to 0, fully undelegate
    if (newAmount == 0) {
      _removeDelegation($, citizen, navigator);
      emit DelegationRemoved(citizen, navigator);
    } else {
      emit DelegationUpdated(citizen, navigator, newAmount);
    }
  }

  /// @notice Fully undelegate from the current navigator
  /// @param citizen The citizen address
  function undelegate(address citizen) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    address navigator = $.citizenToNavigator[citizen];
    if (navigator == address(0)) revert NotDelegated(citizen);

    uint256 amount = _currentDelegatedAmount($, citizen);
    $.totalDelegatedToNavigator[navigator] -= amount;
    $.delegatedAmount[citizen].push(SafeCast.toUint48(block.number), 0);

    _removeDelegation($, citizen, navigator);

    emit DelegationRemoved(citizen, navigator);
  }

  // ======================== Getters ======================== //

  /// @notice Get the navigator a citizen is delegated to (address(0) if delegation is void)
  /// @param citizen The citizen address
  /// @return The navigator address, or address(0) if not delegated or delegation is void
  function getNavigator(address citizen) external view returns (address) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    address nav = $.citizenToNavigator[citizen];
    if (nav == address(0)) return address(0);
    // Lazy invalidation: if navigator is exited or deactivated, delegation is void
    if (_isNavigatorDead($, nav)) return address(0);
    return nav;
  }

  /// @notice Get the current VOT3 amount a citizen has delegated (0 if delegation is void)
  /// @param citizen The citizen address
  /// @return The delegated VOT3 amount
  function getDelegatedAmount(address citizen) external view returns (uint256) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    address nav = $.citizenToNavigator[citizen];
    if (nav == address(0)) return 0;
    if (_isNavigatorDead($, nav)) return 0;
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

  /// @notice Get total VOT3 delegated to a navigator
  /// @param navigator The navigator address
  /// @return The total VOT3 delegated to the navigator
  function getTotalDelegated(address navigator) external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().totalDelegatedToNavigator[navigator];
  }

  /// @notice Get list of citizens delegating to a navigator
  /// @param navigator The navigator address
  /// @return Array of citizen addresses delegating to the navigator
  function getCitizens(address navigator) external view returns (address[] memory) {
    return NavigatorStorageTypes.getNavigatorStorage().navigatorCitizens[navigator];
  }

  /// @notice Get number of citizens delegating to a navigator
  /// @param navigator The navigator address
  /// @return The number of citizens delegating to the navigator
  function getCitizenCount(address navigator) external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().navigatorCitizens[navigator].length;
  }

  /// @notice Check if a citizen has an active delegation (false if navigator exited/deactivated)
  /// @param citizen The citizen address
  /// @return True if the citizen has an active delegation
  function isDelegated(address citizen) external view returns (bool) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    address nav = $.citizenToNavigator[citizen];
    if (nav == address(0)) return false;
    if (_isNavigatorDead($, nav)) return false;
    return true;
  }

  // ======================== Internal ======================== //

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
    return $.isDeactivated[navigator] || $.exitAnnouncedRound[navigator] > 0;
  }

  /// @dev Remove a citizen from navigator's citizen list and clear delegation mapping
  function _removeDelegation(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address citizen,
    address navigator
  ) private {
    // Remove from navigatorCitizens array using swap-and-pop
    uint256 index = $.citizenIndex[navigator][citizen];
    if (index > 0) {
      uint256 lastIndex = $.navigatorCitizens[navigator].length;
      if (index != lastIndex) {
        // Swap with last element
        address lastCitizen = $.navigatorCitizens[navigator][lastIndex - 1];
        $.navigatorCitizens[navigator][index - 1] = lastCitizen;
        $.citizenIndex[navigator][lastCitizen] = index;
      }
      $.navigatorCitizens[navigator].pop();
      delete $.citizenIndex[navigator][citizen];
    }

    // Clear citizen -> navigator mapping
    $.citizenToNavigator[citizen] = address(0);
  }
}
