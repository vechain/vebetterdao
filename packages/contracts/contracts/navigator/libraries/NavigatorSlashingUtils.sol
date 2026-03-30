// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { NavigatorStorageTypes } from "./NavigatorStorageTypes.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title NavigatorSlashingUtils
/// @notice Handles automatic minor slashing and governance-driven major slashing.
/// @dev Minor slashing: 10% of current remaining stake (compounding).
/// Anyone can call the report functions — contract verifies on-chain.
/// Slashed funds sent to treasury.
///
/// Four minor infraction triggers:
/// 1. Missed allocation vote (had citizens, didn't set preferences for a round)
/// 2. Missed governance proposal vote (had citizens, didn't set decision during voting period)
/// 3. Stale allocation preferences (no update >= 3 rounds)
/// 4. Missed report (must submit every reportInterval rounds)
library NavigatorSlashingUtils {
  uint256 private constant BASIS_POINTS = 10000;

  // ======================== Events ======================== //

  /// @notice Emitted when a navigator is slashed
  event NavigatorSlashed(
    address indexed navigator,
    uint256 amount,
    uint256 remainingStake,
    string reason
  );

  // ======================== Errors ======================== //

  /// @notice Thrown when navigator has already been slashed for this infraction
  error AlreadySlashed(address navigator, string reason);

  /// @notice Thrown when no infraction was found (report is invalid)
  error NoInfractionFound(address navigator, string reason);

  /// @notice Thrown when navigator has no stake to slash
  error NoStakeToSlash(address navigator);

  // ======================== Minor Slashing ======================== //

  /// @notice Report a navigator for missing allocation vote in a round
  /// @dev Anyone can call. Verifies: navigator had citizens AND didn't set preferences.
  /// @param navigator The navigator address
  /// @param roundId The round they missed
  function reportMissedAllocationVote(address navigator, uint256 roundId) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if ($.slashedForMissedAllocationVote[navigator][roundId]) {
      revert AlreadySlashed(navigator, "missedAllocationVote");
    }

    // Navigator must have citizens and NOT have set preferences
    bool hasCitizens = $.navigatorCitizens[navigator].length > 0;
    bool setPreferences = $.preferencesSet[navigator][roundId];

    if (!hasCitizens || setPreferences) {
      revert NoInfractionFound(navigator, "missedAllocationVote");
    }

    $.slashedForMissedAllocationVote[navigator][roundId] = true;
    _applyMinorSlash($, navigator, "missedAllocationVote");
  }

  /// @notice Report a navigator for missing a governance proposal vote
  /// @param navigator The navigator address
  /// @param proposalId The proposal they missed
  function reportMissedGovernanceVote(address navigator, uint256 proposalId) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if ($.slashedForMissedGovernanceVote[navigator][proposalId]) {
      revert AlreadySlashed(navigator, "missedGovernanceVote");
    }

    // Navigator must have citizens and NOT have set a decision
    bool hasCitizens = $.navigatorCitizens[navigator].length > 0;
    bool setDecision = $.proposalDecision[navigator][proposalId] != 0;

    if (!hasCitizens || setDecision) {
      revert NoInfractionFound(navigator, "missedGovernanceVote");
    }

    $.slashedForMissedGovernanceVote[navigator][proposalId] = true;
    _applyMinorSlash($, navigator, "missedGovernanceVote");
  }

  /// @notice Report a navigator for stale allocation preferences (no update >= 3 rounds)
  /// @param navigator The navigator address
  /// @param roundId The round to check staleness against
  function reportStalePreferences(address navigator, uint256 roundId) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if ($.slashedForStalePreferences[navigator][roundId]) {
      revert AlreadySlashed(navigator, "stalePreferences");
    }

    // Check that preferences haven't been set in the last 3 rounds
    // (roundId, roundId-1, roundId-2 must all be false)
    bool hasCitizens = $.navigatorCitizens[navigator].length > 0;
    bool stale = hasCitizens
      && !$.preferencesSet[navigator][roundId]
      && (roundId < 2 || !$.preferencesSet[navigator][roundId - 1])
      && (roundId < 3 || !$.preferencesSet[navigator][roundId - 2]);

    if (!stale) {
      revert NoInfractionFound(navigator, "stalePreferences");
    }

    $.slashedForStalePreferences[navigator][roundId] = true;
    _applyMinorSlash($, navigator, "stalePreferences");
  }

  /// @notice Report a navigator for missing a required report
  /// @param navigator The navigator address
  /// @param roundId The current round to check against
  function reportMissedReport(address navigator, uint256 roundId) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    if ($.slashedForMissedReport[navigator][roundId]) {
      revert AlreadySlashed(navigator, "missedReport");
    }

    // Navigator must have citizens
    bool hasCitizens = $.navigatorCitizens[navigator].length > 0;
    // Must have missed the report interval
    uint256 lastReport = $.lastReportRound[navigator];
    bool missedReport = hasCitizens && (roundId > lastReport + $.reportInterval);

    if (!missedReport) {
      revert NoInfractionFound(navigator, "missedReport");
    }

    $.slashedForMissedReport[navigator][roundId] = true;
    _applyMinorSlash($, navigator, "missedReport");
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

    require(slashPercentage <= BASIS_POINTS, "NavigatorSlashingUtils: slash > 100%");

    uint256 stakeSlash = ($.stakedAmount[navigator] * slashPercentage) / BASIS_POINTS;

    if (stakeSlash > 0) {
      $.stakedAmount[navigator] -= stakeSlash;
      $.totalStaked -= stakeSlash;
      $.totalSlashed[navigator] += stakeSlash;

      // Transfer slashed stake to treasury
      IERC20($.b3trToken).transfer($.treasury, stakeSlash);
    }

    // Note: fee slashing requires iterating over round fees — handled by the caller
    // (NavigatorRegistry) since it needs to know which rounds to clear

    emit NavigatorSlashed(navigator, stakeSlash, $.stakedAmount[navigator], "majorSlash");
  }

  // ======================== Getters ======================== //

  /// @notice Get the total amount slashed from a navigator over their lifetime
  function getTotalSlashed(address navigator) external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().totalSlashed[navigator];
  }

  /// @notice Get the minor slash percentage in basis points
  function getMinorSlashPercentage() external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().minorSlashPercentage;
  }

  // ======================== Internal ======================== //

  /// @dev Apply a minor slash (10% of current remaining stake) and send to treasury
  function _applyMinorSlash(
    NavigatorStorageTypes.NavigatorStorage storage $,
    address navigator,
    string memory reason
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

    emit NavigatorSlashed(navigator, slashAmount, $.stakedAmount[navigator], reason);
  }
}
