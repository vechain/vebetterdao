// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { XAllocationVotingStorageTypes } from "./XAllocationVotingStorageTypes.sol";
import { IVoterRewards } from "../../interfaces/IVoterRewards.sol";

/**
 * @title FreshnessUtils
 * @notice Library for computing and tracking vote freshness in XAllocationVoting.
 * @dev Freshness measures whether a voter actively changes their app selection between rounds.
 * A "fingerprint" of the voted apps is computed using XOR, which is order-independent and gas-efficient.
 * The fingerprint is compared against the stored value to determine if the vote is "fresh".
 *
 * Freshness tiers (in basis points, 10000 = 1x):
 * - Updated this round (roundsSinceChange == 0) → tier 1 (default x3)
 * - Updated last round (roundsSinceChange == 1) → tier 2 (default x2)
 * - No update >= 2 rounds (roundsSinceChange >= 2) → tier 3 (default x1)
 *
 * Reusable for Phase 2 (navigators inherit freshness from their navigator's preferences).
 */
library FreshnessUtils {
  /// @notice Emitted when a vote's freshness multiplier is applied
  /// @param voter The voter address
  /// @param roundId The round in which the vote was cast
  /// @param fingerprint The XOR fingerprint of the voted apps
  /// @param lastChangedRound The round when the voter's fingerprint last changed
  /// @param multiplier The freshness multiplier applied (basis points, 10000 = 1x)
  event FreshnessMultiplierApplied(
    address indexed voter,
    uint256 indexed roundId,
    bytes32 fingerprint,
    uint256 lastChangedRound,
    uint256 multiplier
  );

  /// @notice Compute a fingerprint of the voted apps using XOR
  /// @dev Order-independent: voting [A, B] and [B, A] produce the same fingerprint.
  /// Only detects app set changes — weight distribution changes are NOT detected.
  /// @param appIds Array of app IDs voted for
  /// @return fingerprint The XOR of all app IDs
  function computeFingerprint(bytes32[] memory appIds) internal pure returns (bytes32 fingerprint) {
    for (uint256 i; i < appIds.length; i++) {
      fingerprint ^= appIds[i];
    }
  }

  /// @notice Update fingerprint storage and return the freshness multiplier in basis points
  /// @dev Computes fingerprint, compares to stored value, updates storage, and looks up multiplier
  /// from VoterRewards checkpoints at the given timepoint.
  ///
  /// First-time voters (lastFingerprint == bytes32(0)) are treated as fresh (tier 1).
  ///
  /// @param voter The voter address
  /// @param roundId The current round ID
  /// @param appIds Array of app IDs voted for
  /// @param timepoint The round snapshot block for checkpoint lookup
  /// @param voterRewardsAddress The VoterRewards contract address for multiplier config lookup
  /// @return multiplier The freshness multiplier in basis points (10000 = 1x)
  function updateAndGetMultiplier(
    address voter,
    uint256 roundId,
    bytes32[] memory appIds,
    uint256 timepoint,
    address voterRewardsAddress
  ) external returns (uint256 multiplier) {
    // Update fingerprint storage and get rounds since last change
    uint256 roundsSinceChange = _updateFingerprint(voter, roundId, appIds);

    // Look up and select freshness tier
    multiplier = _selectTier(roundsSinceChange, timepoint, voterRewardsAddress);

    // Emit event with current state
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();
    emit FreshnessMultiplierApplied(voter, roundId, $._lastVoteFingerprint[voter], $._lastFingerprintChangedRound[voter], multiplier);
  }

  /// @dev Update fingerprint storage and return rounds since last change
  function _updateFingerprint(address voter, uint256 roundId, bytes32[] memory appIds) private returns (uint256) {
    XAllocationVotingStorageTypes.RoundVotesCountingStorage storage $ = XAllocationVotingStorageTypes
      ._getRoundVotesCountingStorage();

    bytes32 newFingerprint = computeFingerprint(appIds);
    bytes32 lastFingerprint = $._lastVoteFingerprint[voter];

    // First-time voter or fingerprint changed → update storage
    if (lastFingerprint == bytes32(0) || newFingerprint != lastFingerprint) {
      $._lastVoteFingerprint[voter] = newFingerprint;
      $._lastFingerprintChangedRound[voter] = roundId;
    }

    return roundId - $._lastFingerprintChangedRound[voter];
  }

  /// @dev Select the appropriate freshness tier based on rounds since change
  function _selectTier(uint256 roundsSinceChange, uint256 timepoint, address voterRewardsAddress) private view returns (uint256) {
    (uint256 tier1, uint256 tier2, uint256 tier3) = IVoterRewards(voterRewardsAddress).getFreshnessMultipliers(timepoint);

    if (roundsSinceChange == 0) return tier1;
    if (roundsSinceChange == 1) return tier2;
    return tier3;
  }
}
