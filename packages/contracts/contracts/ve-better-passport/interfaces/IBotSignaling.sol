// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title IBotSignaling
/// @notice Interface for the Bot Signaling contract.
interface IBotSignaling {
  /// @notice Emitted when a user is whitelisted.
  /// @param user  The address of the user that was whitelisted.
  /// @param whitelister  The address of the user that whitelisted the user.
  event UserWhitelisted(address indexed user, address indexed whitelister);

  /// @notice Emitted when a user is removed from the whitelist.
  /// @param user  The address of the user that was removed from the whitelist.
  /// @param whitelister  The address of the user that removed the user from the whitelist.
  event RemovedUserFromWhitelist(address indexed user, address indexed whitelister);

  /// @notice Emitted when a user is signaled.
  /// @param user  The address of the user that was signaled.
  /// @param signaler  The address of the user that signaled the user.
  /// @param app  The app that the user was signaled for.
  event UserSignaled(address indexed user, address indexed signaler, bytes32 indexed app);

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

  /// @notice Whitelists a user.
  function whitelistUser(address user) external;

  /// @notice Removes a user from the whitelist.
  function removeWhitelistedUser(address user) external;

  /// @notice Signals a user.
  function signalUser(address user) external;

  /// @notice Assigns a signaler to an app.
  function isWhitelisted(address _user) external view returns (bool);

  /// @notice Returns the number of times a user has been signaled.
  function signaledCounter(address _user) external view returns (uint256);
}
