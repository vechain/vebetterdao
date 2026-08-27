// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { IX2EarnApps } from "../../interfaces/IX2EarnApps.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { XAllocationVotingDataTypes } from "./XAllocationVotingDataTypes.sol";
import { XAllocationVotingStorageTypes } from "./XAllocationVotingStorageTypes.sol";

/**
 * @title AutoVotingLogic
 * @notice Library that handles user preferences for automatic voting in allocation rounds
 * @dev This library is intended to be used by the XAllocationVoting contract
 */
library AutoVotingLogic {
  using Checkpoints for Checkpoints.Trace208;

  /**
   * @notice Emitted when a user toggles their autovoting status
   * @param account The address of the user
   * @param enabled Whether autovoting is enabled or disabled
   */
  event AutoVotingToggled(address indexed account, bool enabled);

  /**
   * @notice Emitted when a user updates their preferred apps for autovoting
   * @param account The address of the user
   * @param apps The list of app IDs the user prefers to vote for
   */
  event PreferredAppsUpdated(address indexed account, bytes32[] apps);

  // ---------- Setters ---------- //

  /**
   * @dev Toggles autovoting for an account
   * @param xAllocationVotingGovernorAddress The address of the XAllocationVotingGovernor contract
   * @param account The address to toggle autovoting for
   * @param clock The current timepoint
   * @notice
   * User Enabled: false ──────────────────────→ true
   * Total Count:  100   ──────────────────────→ 101
   * User Prefs:   [existing preferences kept]
   *
   * User Enabled: true ──────────────────────→ false
   * Total Count:  101   ──────────────────────→ 100
   * User Prefs:   [app1, app2] ────────────────→ [] (deleted)
   */
  function toggleAutoVoting(address xAllocationVotingGovernorAddress, address account, uint48 clock) external {
    XAllocationVotingStorageTypes.AutoVotingStorage storage autoVotingStorage = XAllocationVotingStorageTypes
      ._getAutoVotingStorage();
    bool currentStatus = autoVotingStorage._autoVotingEnabled[account].upperLookupRecent(clock) == 1;
    bool newStatus = !currentStatus;

    IXAllocationVotingGovernor xAllocationVotingGovernor = IXAllocationVotingGovernor(xAllocationVotingGovernorAddress);

    // If user is enabling autovoting (was disabled, now enabling), check eligibility
    if (!currentStatus) {
      xAllocationVotingGovernor.validatePersonhoodForCurrentRound(account);
      (, bool isValid) = _getAndValidateVotingPower(
        xAllocationVotingGovernor,
        account,
        xAllocationVotingGovernor.currentRoundSnapshot()
      );
      require(isValid, "AutoVotingLogic: at least 1 VOT3 is required");
      require(
        autoVotingStorage._userVotingPreferences[account].length > 0,
        "AutoVotingLogic: must select at least one app"
      );
    }

    // If user is disabling autovoting (was enabled, now disabling), clear preferences
    if (currentStatus) {
      delete autoVotingStorage._userVotingPreferences[account];
    }

    // Push new checkpoint with toggled status
    autoVotingStorage._autoVotingEnabled[account].push(
      clock,
      newStatus ? SafeCast.toUint208(1) : SafeCast.toUint208(0)
    );

    uint208 currentTotal = autoVotingStorage._totalAutoVotingUsers.upperLookupRecent(clock);
    uint208 newTotal = newStatus ? currentTotal + 1 : currentTotal - 1;
    autoVotingStorage._totalAutoVotingUsers.push(clock, newTotal);

    emit AutoVotingToggled(account, newStatus);
  }

  /**
   * @dev Gets effective voting power for an account and validates it meets the minimum threshold for auto-voting
   */
  function _getAndValidateVotingPower(
    IXAllocationVotingGovernor xAllocationVotingGovernor,
    address account,
    uint256 timepoint
  ) internal view returns (uint256, bool) {
    uint256 voterAvailableVotes = xAllocationVotingGovernor.getVotes(account, timepoint);
    bool isValid = voterAvailableVotes >= 1 ether;
    return (voterAvailableVotes, isValid);
  }

  /**
   * @dev Sets the voting preferences for an account
   * @param x2EarnAppsAddress The address of the X2EarnApps contract
   * @param account The address to set preferences for
   * @param apps The list of app IDs to vote for
   */
  function setUserVotingPreferences(address x2EarnAppsAddress, address account, bytes32[] memory apps) external {
    XAllocationVotingStorageTypes.AutoVotingStorage storage autoVotingStorage = XAllocationVotingStorageTypes
      ._getAutoVotingStorage();
    require(apps.length > 0, "AutoVotingLogic: no apps to vote for");
    require(apps.length <= 15, "AutoVotingLogic: must vote for less than 15 apps");

    IX2EarnApps x2EarnAppsContract = IX2EarnApps(x2EarnAppsAddress);

    // Iterate through the apps and percentages to calculate the total weight of votes cast by the voter
    for (uint256 i; i < apps.length; i++) {
      // app must be a valid app
      require(x2EarnAppsContract.appExists(apps[i]), "AutoVotingLogic: invalid app");

      // Check current app against ALL previous apps
      for (uint256 j; j < i; j++) {
        require(apps[i] != apps[j], "AutoVotingLogic: duplicate app");
      }
    }

    autoVotingStorage._userVotingPreferences[account] = apps;

    emit PreferredAppsUpdated(account, apps);
  }

  // ---------- Getters ---------- //

  /**
   * @dev Checks if autovoting is enabled for an account at the latest timepoint
   * @param account The address to check
   * @return Whether autovoting is enabled for the account at the latest timepoint
   */
  function isAutoVotingEnabled(address account) external view returns (bool) {
    XAllocationVotingStorageTypes.AutoVotingStorage storage autoVotingStorage = XAllocationVotingStorageTypes
      ._getAutoVotingStorage();
    return autoVotingStorage._autoVotingEnabled[account].latest() == 1;
  }

  /**
   * @dev Checks if autovoting is enabled for an account at a specific timepoint
   * @param account The address to check
   * @param timepoint The timepoint to check
   * @return Whether autovoting is enabled for the account at the specific timepoint
   */
  function isAutoVotingEnabledAtTimepoint(address account, uint48 timepoint) external view returns (bool) {
    XAllocationVotingStorageTypes.AutoVotingStorage storage autoVotingStorage = XAllocationVotingStorageTypes
      ._getAutoVotingStorage();
    return autoVotingStorage._autoVotingEnabled[account].upperLookupRecent(timepoint) == 1;
  }

  /**
   * @dev Gets the voting preferences for an account
   * @param account The address to get preferences for
   * @return The list of app IDs the account prefers to vote for
   */
  function getUserVotingPreferences(address account) external view returns (bytes32[] memory) {
    XAllocationVotingStorageTypes.AutoVotingStorage storage autoVotingStorage = XAllocationVotingStorageTypes
      ._getAutoVotingStorage();
    return autoVotingStorage._userVotingPreferences[account];
  }

  /**
   * @dev Gets the total number of users who enabled autovoting at a specific timepoint
   * @param timepoint The timepoint to check
   * @return The total number of users who enabled autovoting at the specific timepoint
   */
  function getTotalAutoVotingUsersAtTimepoint(uint48 timepoint) external view returns (uint208) {
    XAllocationVotingStorageTypes.AutoVotingStorage storage autoVotingStorage = XAllocationVotingStorageTypes
      ._getAutoVotingStorage();
    return autoVotingStorage._totalAutoVotingUsers.upperLookupRecent(timepoint);
  }

  /**
   * @dev Gets the total number of users who enabled autovoting at the current timepoint
   * @param clock The current timepoint
   * @return The total number of users who enabled autovoting at the current timepoint
   */
  function getTotalAutoVotingUsers(uint48 clock) external view returns (uint208) {
    XAllocationVotingStorageTypes.AutoVotingStorage storage autoVotingStorage = XAllocationVotingStorageTypes
      ._getAutoVotingStorage();
    return autoVotingStorage._totalAutoVotingUsers.upperLookupRecent(clock);
  }

  /**
   * @dev Prepares arrays for auto-voting by filtering eligible apps and calculating vote weights
   * @notice Returns empty arrays if voter has insufficient voting power
   * @notice Returns empty arrays if no eligible apps found
   *
   * @param xAllocationVotingGovernorAddress The address of the XAllocationVotingGovernor contract
   * @param voter The address of the voter
   * @param roundId The round ID to vote in
   * @param preferredApps Array of preferred app IDs
   *
   * @return finalAppIds Array of eligible app IDs
   * @return voteWeights Array of equal vote weights
   * @return votingPower The voting power of the voter
   */
  function prepareAutoVoteArrays(
    address xAllocationVotingGovernorAddress,
    address voter,
    uint256 roundId,
    bytes32[] memory preferredApps
  ) external view returns (bytes32[] memory finalAppIds, uint256[] memory voteWeights, uint256 votingPower) {
    IXAllocationVotingGovernor xAllocationVotingGovernor = IXAllocationVotingGovernor(xAllocationVotingGovernorAddress);

    (uint256 voterAvailableVotes, bool isValid) = _getAndValidateVotingPower(
      xAllocationVotingGovernor,
      voter,
      xAllocationVotingGovernor.roundSnapshot(roundId)
    );

    votingPower = voterAvailableVotes;

    // If voter has insufficient voting power, return empty arrays
    if (!isValid) {
      return (new bytes32[](0), new uint256[](0), votingPower);
    }

    // Count and collect eligible apps
    uint256 len = preferredApps.length;
    bytes32[] memory tempAppIds = new bytes32[](len);
    uint256 count;

    for (uint256 i; i < len; ++i) {
      if (xAllocationVotingGovernor.isEligibleForVote(preferredApps[i], roundId)) {
        tempAppIds[count++] = preferredApps[i];
      }
    }

    // If no eligible apps found, return empty arrays
    if (count == 0) {
      return (new bytes32[](0), new uint256[](0), votingPower);
    }

    // Create final arrays with exact size
    finalAppIds = new bytes32[](count);
    voteWeights = new uint256[](count);
    uint256 votePerApp = votingPower / count;
    uint256 remainingVotes = votingPower % count;

    for (uint256 i; i < count; ++i) {
      finalAppIds[i] = tempAppIds[i];
      voteWeights[i] = votePerApp;

      // Distribute remainder: give 1 extra wei to first N apps
      // Edge case: when user has 1 VOT3 and select 3 apps, this will give 1 extra wei to the first app
      if (i < remainingVotes) {
        voteWeights[i] += 1;
      }
    }

    return (finalAppIds, voteWeights, votingPower);
  }

  /**
   * @dev Filter a navigator's allocation preferences down to the apps that are actually
   *      eligible for the round, rescaling the retained percentages so they still consume
   *      the citizen's full voting power in the navigator's intended proportions.
   *
   * @notice setAllocationPreferences validates count, duplicates and that percentages sum to
   * BASIS_POINTS, but it cannot validate app eligibility for a round that may not have
   * started yet. Without this filter a single ineligible app makes countVote revert with
   * GovernorAppNotAvailableForVoting for EVERY citizen of that navigator — and because
   * hasSetPreferences is true, castNavigatorVote's skip branch is unreachable, so those
   * citizens can be neither voted for nor skipped. Their expected actions are then
   * unreachable for the whole round and the entire relayer reward pool locks permanently.
   *
   * Returning an empty array lets the caller take the normal skip path instead.
   *
   * @param xAllocationVotingGovernorAddress The address of the XAllocationVotingGovernor contract
   * @param roundId The round ID to vote in
   * @param appIds The navigator's preferred app IDs
   * @param percentages Allocation percentage per app, in basis points
   * @param votingPower The citizen's delegated voting power at the round snapshot
   *
   * @return finalAppIds Eligible app IDs, in the navigator's original order
   * @return voteWeights Absolute vote weights for those apps, summing to votingPower
   */
  function prepareNavigatorVoteArrays(
    address xAllocationVotingGovernorAddress,
    uint256 roundId,
    bytes32[] memory appIds,
    uint256[] memory percentages,
    uint256 votingPower
  ) external view returns (bytes32[] memory finalAppIds, uint256[] memory voteWeights) {
    IXAllocationVotingGovernor xAllocationVotingGovernor = IXAllocationVotingGovernor(xAllocationVotingGovernorAddress);

    uint256 len = appIds.length;
    bytes32[] memory tempAppIds = new bytes32[](len);
    uint256[] memory tempPercentages = new uint256[](len);
    uint256 count;
    uint256 retainedBasis;

    for (uint256 i; i < len; ++i) {
      if (xAllocationVotingGovernor.isEligibleForVote(appIds[i], roundId)) {
        tempAppIds[count] = appIds[i];
        tempPercentages[count] = percentages[i];
        retainedBasis += percentages[i];
        ++count;
      }
    }

    // No eligible apps — caller skips this citizen rather than reverting.
    if (count == 0 || retainedBasis == 0) {
      return (new bytes32[](0), new uint256[](0));
    }

    // Rescale against the retained total, not BASIS_POINTS. When every app is eligible
    // retainedBasis == BASIS_POINTS and the weights are identical to before this filter.
    finalAppIds = new bytes32[](count);
    voteWeights = new uint256[](count);
    uint256 allocated;
    for (uint256 i; i < count; ++i) {
      finalAppIds[i] = tempAppIds[i];
      voteWeights[i] = (votingPower * tempPercentages[i]) / retainedBasis;
      allocated += voteWeights[i];
    }

    // Integer division leaves dust; give it to the first app so the full power is used.
    if (allocated < votingPower) {
      voteWeights[0] += votingPower - allocated;
    }

    return (finalAppIds, voteWeights);
  }
}
