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

  /// @notice Emitted when a user's signals are reset.
  /// @param user  The address of the user that had their signals reset.
  /// @param reason - The reason for resetting the signals.
  event UserSignalsReset(address indexed user, string reason);

  /// @notice Emitted when a user's signals are reset for an app.
  /// @param user  The address of the user that had their signals reset.
  /// @param app  The app that the user had their signals reset for.
  /// @param reason - The reason for resetting the signals.
  event UserSignalsResetForApp(address indexed user, bytes32 indexed app, string reason);

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

  /// @notice Assigns a signaler to an app.
  /// @dev Only the app admin can assign a signaler to an app.
  function assignSignalerToAppByAppAdmin(bytes32 _app, address _user) external;

  /// @notice Removes a signaler from an app.
  /// @dev Only the app admin can remove a signaler from an app.
  function removeSignalerFromAppByAppAdmin(address _user) external;

  /// @notice Signals a user with a reason.
  function signalUserWithReason(address user, string memory reason) external;

  /// @notice Returns the number of times a user has been signaled.
  function signaledCounter(address _user) external view returns (uint256);
}
