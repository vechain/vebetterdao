// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title IProofOfParticipation
/// @notice Interface for the Proof of Participation contract.
interface IProofOfParticipation {
  /// @notice Emitted when a user registers an action
  /// @param user - the user that registered the action
  /// @param appId - the app id of the action
  /// @param round - the round of the action
  /// @param actionScore - the score of the action
  event RegisteredAction(address indexed user, bytes32 indexed appId, uint256 indexed round, uint256 actionScore);

  /// @notice Emitted when a user is not authorized to perform an action
  /// @param user - the user that is not authorized
  error ProofOfParticipationUnauthorizedUser(address user);

  /// @notice Register that a user performed an action
  /// @param user - the user that performed the action
  /// @param appId - the app id of the action
  function registerAction(address user, bytes32 appId) external;

  /// @notice Register that a user performed an action in a specific round
  /// @param user - the user that performed the action
  /// @param appId - the app id of the action
  /// @param round - the round of the action
  function registerActionForRound(address user, bytes32 appId, uint256 round) external;

  /// @notice Gets the cumulative score of a user based on exponential decay for a number of last rounds
  /// This function calculates the decayed score f(t) = a * (1 - r)^t
  /// @param user - the user address
  /// @param lastRound - the round to consider as a starting point for the cumulative score
  function getCumulativeScoreWithDecay(address user, uint256 lastRound) external returns (uint256);
}
