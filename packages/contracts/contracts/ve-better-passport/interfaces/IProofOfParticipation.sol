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

  /// @notice Function to get the cumulative score of a user using the quadratic formula
  /// @param user - the user to get the score for
  /// @param round - the round to get the score for
  function getQuadraticCumulativeScore(address user, uint256 round) external returns (uint256);
}
