// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title IPersonhoodSettings
/// @notice Interface for the PersonhoodSettings contract.
interface IPersonhoodSettings {
  // ---------- Events ---------- //

  /// @notice Emitted when a specific check is toggled.
  /// @param checkName The name of the check being toggled.
  /// @param enabled True if the check is enabled, false if disabled.
  event CheckToggled(string indexed checkName, bool enabled);

  /// @notice Emitted when the minimum galaxy member level is set.
  /// @param minimumGalaxyMemberLevel The new minimum galaxy member level.
  event MinimumGalaxyMemberLevelSet(uint256 minimumGalaxyMemberLevel);

  // ---------- View Functions ---------- //

  /// @notice Returns if the whitelist check is enabled.
  /// @return True if enabled, false otherwise.
  function whitelistCheckEnabled() external view returns (bool);

  /// @notice Returns if the blacklist check is enabled.
  /// @return True if enabled, false otherwise.
  function blacklistCheckEnabled() external view returns (bool);

  /// @notice Returns if the signaling check is enabled.
  /// @return True if enabled, false otherwise.
  function signalingCheckEnabled() external view returns (bool);

  /// @notice Returns if the participation score check is enabled.
  /// @return True if enabled, false otherwise.
  function participationScoreCheckEnabled() external view returns (bool);

  /// @notice Returns if the node ownership check is enabled.
  /// @return True if enabled, false otherwise.
  function nodeOwnershipCheckEnabled() external view returns (bool);

  /// @notice Returns if the GM ownership check is enabled.
  /// @return True if enabled, false otherwise.

  function gmOwnershipCheckEnabled() external view returns (bool);

  // ---------- External Functions (Restricted) ---------- //

  /// @notice Toggles the whitelist check.
  function toggleWhitelistCheck() external;

  /// @notice Toggles the blacklist check.
  function toggleBlacklistCheck() external;

  /// @notice Toggles the signaling check.
  function toggleSignalingCheck() external;

  /// @notice Toggles the participation score check.
  function toggleParticipationScoreCheck() external;

  /// @notice Toggles the node ownership check.
  function toggleNodeOwnershipCheck() external;

  /// @notice Toggles the GM ownership check.
  function toggleGMOwnershipCheck() external;
}
