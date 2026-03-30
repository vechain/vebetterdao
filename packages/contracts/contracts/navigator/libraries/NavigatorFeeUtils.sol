// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { NavigatorStorageTypes } from "./NavigatorStorageTypes.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title NavigatorFeeUtils
/// @notice Handles navigator fee collection, locking, and claiming.
/// @dev Fee = 20% of citizen rewards (basis points configurable).
/// Fees are locked per-round and become claimable after feeLockPeriod rounds.
/// Example: fee earned in round 5 with lockPeriod=4 → claimable from round 9.
library NavigatorFeeUtils {
  uint256 private constant BASIS_POINTS = 10000;

  // ======================== Events ======================== //

  /// @notice Emitted when fees are deposited for a navigator
  event FeeDeposited(address indexed navigator, uint256 indexed roundId, uint256 amount);

  /// @notice Emitted when a navigator claims their unlocked fees
  event FeeClaimed(address indexed navigator, uint256 indexed roundId, uint256 amount);

  // ======================== Errors ======================== //

  /// @notice Thrown when trying to claim fees that are still locked
  error FeesStillLocked(uint256 roundId, uint256 unlockRound, uint256 currentRound);

  /// @notice Thrown when there are no fees to claim for the round
  error NoFeesToClaim(address navigator, uint256 roundId);

  // ======================== Fee Collection ======================== //

  /// @notice Deposit a fee for a navigator in a specific round
  /// @dev Called by VoterRewards during reward claim. B3TR is transferred to this contract.
  /// @param navigator The navigator to receive the fee
  /// @param roundId The round the fee was earned in
  /// @param amount The B3TR fee amount
  function depositFee(address navigator, uint256 roundId, uint256 amount) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    $.roundFees[navigator][roundId] += amount;

    emit FeeDeposited(navigator, roundId, amount);
  }

  /// @notice Claim unlocked fees for a specific round
  /// @dev Fees are claimable after feeLockPeriod rounds have passed.
  /// @param navigator The navigator claiming fees
  /// @param roundId The round to claim fees for
  /// @param currentRound The current round ID (passed by caller)
  function claimFee(address navigator, uint256 roundId, uint256 currentRound) external {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();

    uint256 amount = $.roundFees[navigator][roundId];
    if (amount == 0) revert NoFeesToClaim(navigator, roundId);

    uint256 unlockRound = roundId + $.feeLockPeriod;
    if (currentRound < unlockRound) revert FeesStillLocked(roundId, unlockRound, currentRound);

    // Clear and transfer
    $.roundFees[navigator][roundId] = 0;
    IERC20($.b3trToken).transfer(navigator, amount);

    emit FeeClaimed(navigator, roundId, amount);
  }

  // ======================== Fee Calculation ======================== //

  /// @notice Calculate the navigator fee from a reward amount
  /// @param rewardAmount The total reward amount (before fee deduction)
  /// @return navigatorFee The fee amount for the navigator
  /// @return citizenReward The remaining reward for the citizen
  function calculateFee(uint256 rewardAmount) external view returns (uint256 navigatorFee, uint256 citizenReward) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    navigatorFee = (rewardAmount * $.feePercentage) / BASIS_POINTS;
    citizenReward = rewardAmount - navigatorFee;
  }

  // ======================== Getters ======================== //

  /// @notice Get the fee amount for a navigator in a specific round
  function getRoundFee(address navigator, uint256 roundId) external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().roundFees[navigator][roundId];
  }

  /// @notice Get the fee lock period (number of rounds)
  function getFeeLockPeriod() external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().feeLockPeriod;
  }

  /// @notice Get the fee percentage in basis points
  function getFeePercentage() external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().feePercentage;
  }

  /// @notice Check if fees for a round are unlocked
  /// @param roundId The round to check
  /// @param currentRound The current round ID
  function isRoundFeeUnlocked(uint256 roundId, uint256 currentRound) external view returns (bool) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    return currentRound >= roundId + $.feeLockPeriod;
  }
}
