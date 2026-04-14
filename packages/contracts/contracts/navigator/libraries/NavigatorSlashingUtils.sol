// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { NavigatorStorageTypes } from "./NavigatorStorageTypes.sol";
import { NavigatorDelegationUtils } from "./NavigatorDelegationUtils.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title NavigatorSlashingUtils
/// @notice Handles automatic minor slashing and governance-driven major slashing.
/// @dev Minor slashing: 10% of current remaining stake (compounding).
/// Anyone can call the report function — contract verifies on-chain.
/// Slashed funds sent to treasury.
///
/// Five minor infraction types:
/// 1. Missed allocation vote (had citizens, didn't set preferences for a round)
/// 2. Missed governance proposal vote (had citizens, didn't set decision during voting period)
/// 3. Stale allocation preferences (no update >= 3 rounds)
/// 4. Missed report (must submit every reportInterval rounds)
/// 5. Late preferences (set after preferenceCutoffPeriod before round deadline)
library NavigatorSlashingUtils {
  uint256 private constant BASIS_POINTS = 10000;
  uint256 public constant FLAG_MISSED_ALLOCATION = 1 << 0;
  uint256 public constant FLAG_LATE_PREFERENCES = 1 << 1;
  uint256 public constant FLAG_STALE_PREFERENCES = 1 << 2;
  uint256 public constant FLAG_MISSED_REPORT = 1 << 3;
  uint256 public constant FLAG_MISSED_GOVERNANCE = 1 << 4;

  // ======================== Events ======================== //

  /// @notice Emitted when a navigator is slashed for minor infractions in a round
  event NavigatorMinorSlashed(
    address indexed navigator,
    uint256 amount,
    uint256 remainingStake,
    uint256 roundId,
    uint256 infractionFlags
  );

  /// @notice Emitted when a navigator is slashed by governance (major infraction)
  event NavigatorSlashed(
    address indexed navigator,
    uint256 amount,
    uint256 remainingStake,
    string reason
  );

  // ======================== Errors ======================== //

  /// @notice Thrown when navigator has already been slashed for this round
  error AlreadySlashed(address navigator, uint256 roundId);

  /// @notice Thrown when no infraction was found for this round (report is invalid)
  error NoInfractionFound(address navigator, uint256 roundId);

  /// @notice Thrown when a report is attempted while the round is still active
  error RoundStillActive(uint256 roundId);

  /// @notice Thrown when navigator has no stake to slash
  error NoStakeToSlash(address navigator);

  /// @notice Thrown when slash percentage exceeds maximum
  error SlashExceedsMax(uint256 slashPercentage, uint256 max);

  // ======================== Minor Slashing ======================== //

  /// @notice Report a navigator for all minor infractions in a completed round
  /// @dev Applies at most one minor slash for the round, even if multiple infractions are found.
  /// @param navigator The navigator address
  /// @param roundId The completed round to check
  /// @param proposalIds Proposal IDs for this round to validate governance decisions
  function reportRoundInfractions(address navigator, uint256 roundId, uint256[] calldata proposalIds) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    IXAllocationVotingGovernor xAllocationVoting = IXAllocationVotingGovernor($.xAllocationVoting);

    if (xAllocationVoting.isActive(roundId)) {
      revert RoundStillActive(roundId);
    }

    if ($.slashedForRound[navigator][roundId]) {
      revert AlreadySlashed(navigator, roundId);
    }

    // Navigator must have had delegations at round snapshot
    uint256 snapshot = _getRoundSnapshot($, roundId);
    bool hadDelegations = NavigatorDelegationUtils.getTotalDelegatedAtTimepoint(navigator, snapshot) > 0;
    if (!hadDelegations) {
      revert NoInfractionFound(navigator, roundId);
    }

    uint256 infractionFlags = 0;
    uint256 roundDeadline = xAllocationVoting.roundDeadline(roundId);

    if (!$.preferencesSet[navigator][roundId]) {
      infractionFlags |= FLAG_MISSED_ALLOCATION;
    } else {
      uint256 setBlock = $.preferencesSetBlock[navigator][roundId];
      uint256 cutoff = roundDeadline > $.preferenceCutoffPeriod ? roundDeadline - $.preferenceCutoffPeriod : 0;
      if (setBlock > cutoff) {
        infractionFlags |= FLAG_LATE_PREFERENCES;
      }
    }

    bool stalePreferences = !$.preferencesSet[navigator][roundId]
      && (roundId < 2 || !$.preferencesSet[navigator][roundId - 1])
      && (roundId < 3 || !$.preferencesSet[navigator][roundId - 2]);
    if (stalePreferences) {
      infractionFlags |= FLAG_STALE_PREFERENCES;
    }

    uint256 lastReport = $.lastReportRound[navigator];
    // Example: interval=2, last report in round 8 → rounds 9 still OK; round 10+ without a new report is a miss (roundId >= 8+2).
    if (roundId >= lastReport + $.reportInterval) {
      infractionFlags |= FLAG_MISSED_REPORT;
    }

    for (uint256 i = 0; i < proposalIds.length; i++) {
      if ($.proposalDecision[navigator][proposalIds[i]] == 0) {
        infractionFlags |= FLAG_MISSED_GOVERNANCE;
        break;
      }
    }

    if (infractionFlags == 0) {
      revert NoInfractionFound(navigator, roundId);
    }

    $.slashedForRound[navigator][roundId] = true;
    $.roundInfractionFlags[navigator][roundId] = infractionFlags;
    _applyMinorSlash($, navigator, roundId, infractionFlags);
  }

  // ======================== Major Slashing ======================== //

  /// @notice Slash a navigator by governance decision (major infraction)
  /// @dev Can only be called by governance (GOVERNANCE_ROLE checked in main contract).
  /// Slashes a percentage of stake + all unclaimed locked fees.
  /// @param navigator The navigator address
  /// @param slashPercentage Percentage of stake to slash (basis points, max 10000 = 100%)
  /// @param slashFees Whether to also slash all unclaimed locked fees
  function majorSlash(
    address navigator,
    uint256 slashPercentage,
    bool slashFees
  ) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if (slashPercentage > BASIS_POINTS) revert SlashExceedsMax(slashPercentage, BASIS_POINTS);

    uint256 stakeSlash = ($.stakedAmount[navigator] * slashPercentage) / BASIS_POINTS;

    if (stakeSlash > 0) {
      $.stakedAmount[navigator] -= stakeSlash;
      $.totalStaked -= stakeSlash;
      $.totalSlashed[navigator] += stakeSlash;

      // Transfer slashed stake to treasury
      IERC20($.b3trToken).transfer($.treasury, stakeSlash);
    }

    // Forfeit all unclaimed locked fees — claimFee will revert for this navigator
    if (slashFees) {
      $.feesForfeited[navigator] = true;
    }

    emit NavigatorSlashed(navigator, stakeSlash, $.stakedAmount[navigator], "majorSlash");
  }

  // ======================== Getters ======================== //

  /// @notice Get the total amount slashed from a navigator over their lifetime
  /// @param navigator The navigator address
  /// @return The total B3TR amount slashed
  function getTotalSlashed(address navigator) external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().totalSlashed[navigator];
  }

  /// @notice Get the minor slash percentage in basis points
  /// @return The minor slash percentage in basis points (e.g., 1000 = 10%)
  function getMinorSlashPercentage() external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().minorSlashPercentage;
  }

  /// @notice Check if a navigator was already slashed for a specific infraction
  /// @param navigator The navigator address
  /// @param roundId The round ID
  /// @return slashed True if the navigator was slashed for this round
  /// @return infractionFlags Bitmask of infractions found when slashed
  function isSlashedForRound(address navigator, uint256 roundId) external view returns (bool slashed, uint256 infractionFlags) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    slashed = $.slashedForRound[navigator][roundId];
    infractionFlags = $.roundInfractionFlags[navigator][roundId];
  }

  // ======================== Internal ======================== //

  /// @dev Apply a minor slash (10% of current remaining stake) and send to treasury
  function _applyMinorSlash(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address navigator,
    uint256 roundId,
    uint256 infractionFlags
  ) private {
    uint256 currentStake = $.stakedAmount[navigator];
    if (currentStake == 0) revert NoStakeToSlash(navigator);

    uint256 slashAmount = (currentStake * $.minorSlashPercentage) / BASIS_POINTS;
    if (slashAmount == 0) slashAmount = 1; // Slash at least 1 wei

    $.stakedAmount[navigator] -= slashAmount;
    $.totalStaked -= slashAmount;
    $.totalSlashed[navigator] += slashAmount;

    // Transfer to treasury
    IERC20($.b3trToken).transfer($.treasury, slashAmount);

    emit NavigatorMinorSlashed(navigator, slashAmount, $.stakedAmount[navigator], roundId, infractionFlags);
  }

  /// @dev Get the snapshot block of a round from XAllocationVoting
  function _getRoundSnapshot(NavigatorStorageTypes.NavigatorStorage storage $, uint256 roundId) private view returns (uint256) {
    return IXAllocationVotingGovernor($.xAllocationVoting).roundSnapshot(roundId);
  }
}
