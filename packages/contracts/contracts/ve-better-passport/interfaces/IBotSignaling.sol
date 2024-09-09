// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title IBotSignaling
/// @notice Interface for the Bot Signaling contract.
interface IBotSignaling {
  /// @notice Emitted when a user is signaled.
  /// @param user  The address of the user that was signaled.
  /// @param signaler  The address of the user that signaled the user.
  /// @param app  The app that the user was signaled for.
  /// @param reason  The reason for signaling the user.
  event UserSignaled(address indexed user, address indexed signaler, bytes32 indexed app, string reason);

  /// @notice Emited when an address is associated with an app.
  /// @param signaler  The address of the signaler.
  /// @param app  The app that the signaler was associated with.
  event SignalerAssignedToApp(address indexed signaler, bytes32 indexed app);

  /// @notice Emitted when an address is removed from an app.
  /// @param signaler  The address of the signaler.
  /// @param app  The app that the signaler was removed from.
  event SignalerRemovedFromApp(address indexed signaler, bytes32 indexed app);

  /// @notice Emitted when a user is granted a role.
  /// @param user  The address of the user that was granted the role.
  error BotSignalingUnauthorizedUser(address user);

  /// @notice Signals a user.
  function signalUser(address user) external;

  /// @notice Signals a user with a reason.
  function signalUserWithReason(address user, string memory reason) external;

  /// @notice Returns the number of times a user has been signaled.
  function signaledCounter(address _user) external view returns (uint256);
}
