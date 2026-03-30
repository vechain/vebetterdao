// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { NavigatorStorageTypes } from "./NavigatorStorageTypes.sol";

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

    // Citizen must not already be delegated
    if ($.citizenToNavigator[citizen] != address(0)) {
      revert AlreadyDelegated(citizen, $.citizenToNavigator[citizen]);
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

    // Store delegation
    $.citizenToNavigator[citizen] = navigator;
    $.delegatedAmount[citizen] = amount;
    $.totalDelegatedToNavigator[navigator] += amount;

    // Add citizen to navigator's citizen list
    $.navigatorCitizens[navigator].push(citizen);
    $.citizenIndex[navigator][citizen] = $.navigatorCitizens[navigator].length; // 1-indexed

    emit DelegationCreated(citizen, navigator, amount);
  }

  /// @notice Partially reduce delegation amount
  /// @dev Takes effect next round. Citizen remains delegated to the same navigator.
  /// @param citizen The citizen address
  /// @param reduceBy The VOT3 amount to reduce delegation by
  function reduceDelegation(address citizen, uint256 reduceBy) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if ($.citizenToNavigator[citizen] == address(0)) revert NotDelegated(citizen);
    if (reduceBy == 0) revert ZeroDelegationAmount();
    if (reduceBy > $.delegatedAmount[citizen]) {
      revert InsufficientDelegation(reduceBy, $.delegatedAmount[citizen]);
    }

    address navigator = $.citizenToNavigator[citizen];

    $.delegatedAmount[citizen] -= reduceBy;
    $.totalDelegatedToNavigator[navigator] -= reduceBy;

    // If reduced to 0, fully undelegate
    if ($.delegatedAmount[citizen] == 0) {
      _removeDelegation($, citizen, navigator);
      emit DelegationRemoved(citizen, navigator);
    } else {
      emit DelegationUpdated(citizen, navigator, $.delegatedAmount[citizen]);
    }
  }

  /// @notice Fully undelegate from the current navigator
  /// @param citizen The citizen address
  function undelegate(address citizen) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    address navigator = $.citizenToNavigator[citizen];
    if (navigator == address(0)) revert NotDelegated(citizen);

    uint256 amount = $.delegatedAmount[citizen];
    $.totalDelegatedToNavigator[navigator] -= amount;
    $.delegatedAmount[citizen] = 0;

    _removeDelegation($, citizen, navigator);

    emit DelegationRemoved(citizen, navigator);
  }

  // ======================== Getters ======================== //

  /// @notice Get the navigator a citizen is delegated to
  function getNavigator(address citizen) external view returns (address) {
    return NavigatorStorageTypes.getNavigatorStorage().citizenToNavigator[citizen];
  }

  /// @notice Get the VOT3 amount a citizen has delegated
  function getDelegatedAmount(address citizen) external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().delegatedAmount[citizen];
  }

  /// @notice Get total VOT3 delegated to a navigator
  function getTotalDelegated(address navigator) external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().totalDelegatedToNavigator[navigator];
  }

  /// @notice Get list of citizens delegating to a navigator
  function getCitizens(address navigator) external view returns (address[] memory) {
    return NavigatorStorageTypes.getNavigatorStorage().navigatorCitizens[navigator];
  }

  /// @notice Get number of citizens delegating to a navigator
  function getCitizenCount(address navigator) external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().navigatorCitizens[navigator].length;
  }

  /// @notice Check if a citizen is delegated to any navigator
  function isDelegated(address citizen) external view returns (bool) {
    return NavigatorStorageTypes.getNavigatorStorage().citizenToNavigator[citizen] != address(0);
  }

  // ======================== Internal ======================== //

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
