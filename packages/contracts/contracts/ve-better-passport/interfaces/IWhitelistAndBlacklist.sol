// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IWhitelistAndBlacklist {
  /// @notice Emitted when a user is whitelisted
  /// @param user - the user that is whitelisted
  /// @param whitelistedBy - the user that whitelisted the user
  event UserWhitelisted(address indexed user, address indexed whitelistedBy);

  /// @notice Emitted when a user is removed from the whitelist
  /// @param user - the user that is removed from the whitelist
  /// @param removedBy - the user that removed the user from the whitelist
  event RemovedUserFromWhitelist(address indexed user, address indexed removedBy);

  /// @notice Emitted when a user is blacklisted
  /// @param user - the user that is blacklisted
  /// @param blacklistedBy - the user that blacklisted the user
  event UserBlacklisted(address indexed user, address indexed blacklistedBy);

  /// @notice Emitted when a user is removed from the blacklist
  /// @param user - the user that is removed from the blacklist
  /// @param removedBy - the user that removed the user from the blacklist
  event RemovedUserFromBlacklist(address indexed user, address indexed removedBy);

  /// @notice Emitted when an unauthorized user tries to whitelist or blacklist
  /// @param user - the unauthorized user
  error WhitelistAndBlacklistUnauthorizedUser(address user);

  /// @notice Checks if a user is whitelisted
  /// @param user - the user to check
  function isWhitelisted(address user) external view returns (bool);

  /// @notice Adds a user to the whitelist
  /// @param user - the user to add
  function whitelist(address user) external;

  /// @notice Removes a user from the whitelist
  /// @param user - the user to remove
  function removeFromWhitelist(address user) external;

  /// @notice Checks if a user is blacklisted
  /// @param user - the user to check
  function isBlacklisted(address user) external view returns (bool);

  /// @notice Adds a user to the blacklist
  /// @param user - the user to add
  function blacklist(address user) external;

  /// @notice Removes a user from the blacklist
  /// @param user - the user to remove
  function removeFromBlacklist(address user) external;
}
