// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IProofOfParticipation {
  /// @notice Emitted when a user registers an action
  /// @param user - the user that registered the action
  /// @param appId - the app id of the action
  /// @param round - the round of the action
  /// @param actionScore - the score of the action
  event RegisteredAction(address indexed user, bytes32 indexed appId, uint256 indexed round, uint256 actionScore);

  /// @notice Emitted when a user is not authorized to perform an action
  error ProofOfParticipationUnauthorizedUser(address user);
}
