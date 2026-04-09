// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { NavigatorStorageTypes } from "./NavigatorStorageTypes.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";

/// @title NavigatorLifecycleUtils
/// @notice Handles navigator exit process, deactivation, and profile/report management.
/// @dev Exit flow:
/// 1. Navigator calls announceExit() — marked dead at current round's deadline
/// 2. Navigator remains alive for current round's snapshot lookups, dead from next round
/// 3. Citizen delegations become void at view level (isDelegated=false, getDelegatedAmount=0)
/// 4. Navigator can withdraw stake after exit
/// 5. Citizens can re-delegate to new navigator without calling undelegate (auto-clear)
/// 6. Re-registration not allowed — must use a new wallet
///
/// Deactivation (by governance):
/// - Same lazy invalidation applies (citizen VOT3 auto-unlocked)
/// - Cannot reactivate — must register fresh
library NavigatorLifecycleUtils {
  using Checkpoints for Checkpoints.Trace208;
  // ======================== Events ======================== //

  /// @notice Emitted when a navigator announces their exit
  event ExitAnnounced(address indexed navigator, uint256 announcedAtRound, uint256 effectiveDeadline);

  /// @notice Emitted when a navigator is deactivated by governance
  event NavigatorDeactivatedEvent(address indexed navigator, uint256 slashPercentage);

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

  /// @notice Thrown when navigator is already deactivated
  error AlreadyDeactivated(address navigator);

  // ======================== Exit Process ======================== //

  /// @notice Announce intent to exit as a navigator
  /// @dev Starts the notice period. The deactivation checkpoint is written at
  /// roundDeadline(currentRound + exitNoticePeriod), so the navigator remains alive
  /// and must keep voting for the notice period, then automatically becomes dead.
  /// @param navigator The navigator address
  function announceExit(address navigator) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (!$.isRegistered[navigator]) revert NotRegistered(navigator);
    if ($.isDeactivated[navigator]) revert AlreadyDeactivated(navigator);
    if ($.exitAnnouncedRound[navigator] > 0) revert AlreadyExiting(navigator);

    uint256 currentRound = _getCurrentRound($);
    $.exitAnnouncedRound[navigator] = currentRound;

    // Navigator stays alive through the notice period, dead after
    // Can't call roundDeadline for a future round that doesn't exist yet,
    // so calculate manually: currentRoundDeadline + (votingPeriod * exitNoticePeriod)
    uint256 currentDeadline = _getRoundDeadline($, currentRound);
    uint256 roundDuration = IXAllocationVotingGovernor($.xAllocationVoting).votingPeriod();
    uint256 effectiveDeadline = currentDeadline + (roundDuration * $.exitNoticePeriod);
    $.navigatorDeactivated[navigator].push(SafeCast.toUint48(effectiveDeadline), 1);

    emit ExitAnnounced(navigator, currentRound, effectiveDeadline);
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
    // Mark as dead at round deadline (only if not already pushed by announceExit)
    if ($.navigatorDeactivated[navigator].length() == 0 || $.navigatorDeactivated[navigator].latest() == 0) {
      uint256 currentRound = _getCurrentRound($);
      uint256 deadline = _getRoundDeadline($, currentRound);
      $.navigatorDeactivated[navigator].push(SafeCast.toUint48(deadline), 1);
    }

    emit NavigatorDeactivatedEvent(navigator, 0);
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
  /// @return The number of rounds navigator must remain active after announcing exit
  function getExitNoticePeriod() external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().exitNoticePeriod;
  }

  /// @notice Get the report interval (in rounds)
  /// @return The number of rounds between required reports
  function getReportInterval() external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().reportInterval;
  }

  // ======================== Internal ======================== //

  /// @dev Get current round ID from XAllocationVoting
  function _getCurrentRound(NavigatorStorageTypes.NavigatorStorage storage $) private view returns (uint256) {
    if ($.xAllocationVoting == address(0)) return 0;
    return IXAllocationVotingGovernor($.xAllocationVoting).currentRoundId();
  }

  /// @dev Get the deadline block of a round from XAllocationVoting
  function _getRoundDeadline(NavigatorStorageTypes.NavigatorStorage storage $, uint256 roundId) private view returns (uint256) {
    return IXAllocationVotingGovernor($.xAllocationVoting).roundDeadline(roundId);
  }
}
