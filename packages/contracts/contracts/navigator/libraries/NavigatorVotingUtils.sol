// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { NavigatorStorageTypes } from "./NavigatorStorageTypes.sol";

/// @title NavigatorVotingUtils
/// @notice Handles navigator voting decisions for allocation rounds and governance proposals.
/// @dev Navigators set their preferences/decisions, which also counts as their own vote.
/// - Allocation: app preferences (bytes32[] of app IDs, equal weight distribution)
/// - Governance: per-proposal decision (Against=1, For=2, Abstain=3; 0=not set)
/// - Votes for citizens are BLOCKED until navigator sets their decision
library NavigatorVotingUtils {
  uint256 private constant BASIS_POINTS = 10000;
  // ======================== Events ======================== //

  /// @notice Emitted when a navigator sets allocation preferences for a round
  event AllocationPreferencesSet(address indexed navigator, uint256 indexed roundId, bytes32[] appIds);

  /// @notice Emitted when a navigator sets a governance proposal decision
  event ProposalDecisionSet(address indexed navigator, uint256 indexed proposalId, uint8 decision);

  // ======================== Errors ======================== //

  /// @notice Thrown when caller is not a registered navigator
  error NotANavigator(address account);

  /// @notice Thrown when preferences are empty
  error EmptyPreferences();

  /// @notice Thrown when too many apps in preferences (max 15)
  error TooManyApps(uint256 count);

  /// @notice Thrown when preferences already set for this round
  error PreferencesAlreadySet(address navigator, uint256 roundId);

  /// @notice Thrown when decision is invalid (must be 1=Against, 2=For, or 3=Abstain)
  error InvalidDecision(uint8 decision);

  /// @notice Thrown when decision already set for this proposal
  error DecisionAlreadySet(address navigator, uint256 proposalId);

  /// @notice Thrown when querying a decision that hasn't been set
  error DecisionNotSet(address navigator, uint256 proposalId);

  /// @notice Thrown when querying preferences that haven't been set
  error PreferencesNotSet(address navigator, uint256 roundId);

  // ======================== Allocation Preferences ======================== //

  /// @notice Set allocation voting preferences for a round
  /// @dev Navigator specifies app IDs and allocation percentages (basis points, must sum to 10000).
  /// The same ratio is applied to every citizen's delegated amount.
  /// @param navigator The navigator address
  /// @param roundId The allocation round ID
  /// @param appIds Array of app IDs to vote for (max 15, no duplicates)
  /// @param percentages Allocation percentage per app in basis points (must sum to 10000)
  function setAllocationPreferences(
    address navigator,
    uint256 roundId,
    bytes32[] calldata appIds,
    uint256[] calldata percentages
  ) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (!$.isRegistered[navigator] || $.isDeactivated[navigator]) revert NotANavigator(navigator);
    if (appIds.length == 0) revert EmptyPreferences();
    if (appIds.length > 15) revert TooManyApps(appIds.length);
    require(appIds.length == percentages.length, "NavigatorVotingUtils: length mismatch");
    if ($.preferencesSet[navigator][roundId]) revert PreferencesAlreadySet(navigator, roundId);

    // Validate: no duplicates, non-zero percentages, sum = 10000
    uint256 totalPct;
    for (uint256 i; i < appIds.length; i++) {
      require(percentages[i] > 0, "NavigatorVotingUtils: zero percentage");
      totalPct += percentages[i];
      for (uint256 j; j < i; j++) {
        require(appIds[i] != appIds[j], "NavigatorVotingUtils: duplicate app");
      }
    }
    require(totalPct == BASIS_POINTS, "NavigatorVotingUtils: percentages must sum to BASIS_POINTS");

    // Store preferences and percentages
    $.roundAppPreferences[navigator][roundId] = appIds;
    $.roundAppPercentages[navigator][roundId] = percentages;
    $.preferencesSet[navigator][roundId] = true;
    $.preferencesSetBlock[navigator][roundId] = block.number;

    emit AllocationPreferencesSet(navigator, roundId, appIds);
  }

  /// @notice Get allocation preferences for a navigator in a round
  function getAllocationPreferences(
    address navigator,
    uint256 roundId
  ) external view returns (bytes32[] memory appIds, uint256[] memory percentages) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    return ($.roundAppPreferences[navigator][roundId], $.roundAppPercentages[navigator][roundId]);
  }

  /// @notice Check if a navigator has set preferences for a round
  function hasSetPreferences(address navigator, uint256 roundId) external view returns (bool) {
    return NavigatorStorageTypes.getNavigatorStorage().preferencesSet[navigator][roundId];
  }

  /// @notice Get the block number when preferences were set (0 if not set)
  function getPreferencesSetBlock(address navigator, uint256 roundId) external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().preferencesSetBlock[navigator][roundId];
  }

  // ======================== Governance Decisions ======================== //

  /// @notice Set a governance proposal voting decision
  /// @dev This also serves as the navigator's own vote.
  /// Decision values: 1=Against, 2=For, 3=Abstain (0=not set, used as sentinel)
  /// @param navigator The navigator address
  /// @param proposalId The governance proposal ID
  /// @param decision The vote decision (1=Against, 2=For, 3=Abstain)
  function setProposalDecision(address navigator, uint256 proposalId, uint8 decision) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (!$.isRegistered[navigator] || $.isDeactivated[navigator]) revert NotANavigator(navigator);
    if (decision < 1 || decision > 3) revert InvalidDecision(decision);
    if ($.proposalDecision[navigator][proposalId] != 0) revert DecisionAlreadySet(navigator, proposalId);

    $.proposalDecision[navigator][proposalId] = decision;

    emit ProposalDecisionSet(navigator, proposalId, decision);
  }

  /// @notice Get a navigator's decision for a proposal
  /// @return decision The vote decision (1=Against, 2=For, 3=Abstain)
  function getProposalDecision(address navigator, uint256 proposalId) external view returns (uint8) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    uint8 decision = $.proposalDecision[navigator][proposalId];
    if (decision == 0) revert DecisionNotSet(navigator, proposalId);
    return decision;
  }

  /// @notice Check if a navigator has set a decision for a proposal
  function hasSetDecision(address navigator, uint256 proposalId) external view returns (bool) {
    return NavigatorStorageTypes.getNavigatorStorage().proposalDecision[navigator][proposalId] != 0;
  }

  /// @notice Convert stored decision (1-indexed) to the B3TRGovernor support value (0-indexed)
  /// @dev Stored: 1=Against, 2=For, 3=Abstain. Governor: 0=Against, 1=For, 2=Abstain.
  /// @param decision The stored decision value
  /// @return support The B3TRGovernor support value
  function decisionToSupport(uint8 decision) external pure returns (uint8 support) {
    require(decision >= 1 && decision <= 3, "NavigatorVotingUtils: invalid decision");
    return decision - 1;
  }
}
