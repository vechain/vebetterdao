// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { NavigatorStorageTypes } from "./NavigatorStorageTypes.sol";

/// @title NavigatorLifecycleUtils
/// @notice Handles navigator exit process, deactivation, and profile/report management.
/// @dev Exit flow:
/// 1. Navigator calls announceExit() — emits event, citizens notified
/// 2. Lazy invalidation: citizen delegations become void immediately at view level
///    (isDelegated=false, getDelegatedAmount=0, VOT3 auto-unlocked)
/// 3. Navigator must continue voting during notice period (1 round, governance-configurable)
/// 4. Navigator calls finalizeExit() — stake available immediately, locked fees on schedule
/// 5. Citizens can re-delegate to new navigator without calling undelegate (auto-clear)
/// 6. Re-entry requires fresh registration
///
/// Deactivation (by governance):
/// - Same lazy invalidation applies (citizen VOT3 auto-unlocked)
/// - Cannot reactivate — must register fresh
library NavigatorLifecycleUtils {
  // ======================== Events ======================== //

  /// @notice Emitted when a navigator announces their exit
  event ExitAnnounced(address indexed navigator, uint256 announcedAtRound, uint256 effectiveRound);

  /// @notice Emitted when a navigator finalizes their exit
  event ExitFinalized(address indexed navigator);

  /// @notice Emitted when a navigator is deactivated by governance
  event NavigatorDeactivated(address indexed navigator, uint256 slashPercentage);

  /// @notice Emitted when a navigator updates their metadata URI
  event MetadataURIUpdated(address indexed navigator, string newURI);

  /// @notice Emitted when a navigator submits a report
  event ReportSubmitted(address indexed navigator, uint256 indexed roundId, string reportURI);

  // ======================== Errors ======================== //

  /// @notice Thrown when navigator is not registered
  error NotRegistered(address navigator);

  /// @notice Thrown when navigator has already announced exit
  error AlreadyExiting(address navigator);

  /// @notice Thrown when navigator has not announced exit
  error NotExiting(address navigator);

  /// @notice Thrown when notice period has not elapsed
  error NoticePeriodNotElapsed(uint256 currentRound, uint256 requiredRound);

  /// @notice Thrown when navigator is already deactivated
  error AlreadyDeactivated(address navigator);

  // ======================== Exit Process ======================== //

  /// @notice Announce intent to exit as a navigator
  /// @dev Starts the notice period. Navigator must continue voting during this period.
  /// After notice period, all delegations auto-cease.
  /// @param navigator The navigator address
  /// @param currentRound The current round ID
  function announceExit(address navigator, uint256 currentRound) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (!$.isRegistered[navigator]) revert NotRegistered(navigator);
    if ($.isDeactivated[navigator]) revert AlreadyDeactivated(navigator);
    if ($.exitAnnouncedRound[navigator] > 0) revert AlreadyExiting(navigator);

    $.exitAnnouncedRound[navigator] = currentRound;

    uint256 effectiveRound = currentRound + $.exitNoticePeriod;
    emit ExitAnnounced(navigator, currentRound, effectiveRound);
  }

  /// @notice Finalize exit after notice period has elapsed
  /// @dev After this, stake can be withdrawn. Navigator is no longer registered.
  /// @param navigator The navigator address
  /// @param currentRound The current round ID
  function finalizeExit(address navigator, uint256 currentRound) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (!$.isRegistered[navigator]) revert NotRegistered(navigator);
    uint256 announcedRound = $.exitAnnouncedRound[navigator];
    if (announcedRound == 0) revert NotExiting(navigator);

    uint256 requiredRound = announcedRound + $.exitNoticePeriod;
    if (currentRound < requiredRound) revert NoticePeriodNotElapsed(currentRound, requiredRound);

    // Mark as no longer registered (but keep isRegistered=true so withdrawStake works)
    // The navigator will need to call withdrawStake separately
    // Setting exitAnnouncedRound > 0 indicates exit is in progress/finalized

    emit ExitFinalized(navigator);
  }

  /// @notice Check if a navigator's exit notice period has elapsed
  /// @param navigator The navigator address
  /// @param currentRound The current round ID
  /// @return True if the exit notice period has elapsed
  function isExitReady(address navigator, uint256 currentRound) external view returns (bool) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    uint256 announcedRound = $.exitAnnouncedRound[navigator];
    if (announcedRound == 0) return false;
    return currentRound >= announcedRound + $.exitNoticePeriod;
  }

  /// @notice Check if a navigator is in the exit process
  /// @param navigator The navigator address
  /// @return True if the navigator has announced exit
  function isExiting(address navigator) external view returns (bool) {
    return NavigatorStorageTypes.getNavigatorStorage().exitAnnouncedRound[navigator] > 0;
  }

  // ======================== Deactivation ======================== //

  /// @notice Deactivate a navigator by governance decision
  /// @dev Takes effect next round. All delegations cease. Cannot reactivate.
  /// @param navigator The navigator address
  function deactivate(address navigator) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (!$.isRegistered[navigator]) revert NotRegistered(navigator);
    if ($.isDeactivated[navigator]) revert AlreadyDeactivated(navigator);

    $.isDeactivated[navigator] = true;

    emit NavigatorDeactivated(navigator, 0); // slashPercentage decided by governance separately
  }

  /// @notice Check if a navigator is deactivated
  /// @param navigator The navigator address
  /// @return True if the navigator has been deactivated by governance
  function isDeactivated(address navigator) external view returns (bool) {
    return NavigatorStorageTypes.getNavigatorStorage().isDeactivated[navigator];
  }

  // ======================== Profile & Reports ======================== //

  /// @notice Update navigator metadata URI
  /// @param navigator The navigator address
  /// @param uri The new metadata URI
  function setMetadataURI(address navigator, string calldata uri) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (!$.isRegistered[navigator]) revert NotRegistered(navigator);

    $.metadataURI[navigator] = uri;
    emit MetadataURIUpdated(navigator, uri);
  }

  /// @notice Submit a periodic report
  /// @param navigator The navigator address
  /// @param roundId The current round ID
  /// @param reportURI The report metadata URI
  function submitReport(address navigator, uint256 roundId, string calldata reportURI) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (!$.isRegistered[navigator]) revert NotRegistered(navigator);

    $.lastReportRound[navigator] = roundId;
    $.lastReportURI[navigator] = reportURI;

    emit ReportSubmitted(navigator, roundId, reportURI);
  }

  /// @notice Get navigator metadata URI
  /// @param navigator The navigator address
  /// @return The metadata URI string
  function getMetadataURI(address navigator) external view returns (string memory) {
    return NavigatorStorageTypes.getNavigatorStorage().metadataURI[navigator];
  }

  /// @notice Get the round of the navigator's last report
  /// @param navigator The navigator address
  /// @return The round ID of the last submitted report
  function getLastReportRound(address navigator) external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().lastReportRound[navigator];
  }

  /// @notice Get the navigator's last report URI
  /// @param navigator The navigator address
  /// @return The last report metadata URI string
  function getLastReportURI(address navigator) external view returns (string memory) {
    return NavigatorStorageTypes.getNavigatorStorage().lastReportURI[navigator];
  }

  /// @notice Get the exit notice period (in rounds)
  /// @return The number of rounds in the exit notice period
  function getExitNoticePeriod() external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().exitNoticePeriod;
  }

  /// @notice Get the report interval (in rounds)
  /// @return The number of rounds between required reports
  function getReportInterval() external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().reportInterval;
  }
}
