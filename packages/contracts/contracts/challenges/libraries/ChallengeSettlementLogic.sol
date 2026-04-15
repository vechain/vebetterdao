// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IChallenges } from "../../interfaces/IChallenges.sol";
import { ChallengeCoreLogic } from "./ChallengeCoreLogic.sol";
import { ChallengeStorageTypes } from "./ChallengeStorageTypes.sol";
import { ChallengeTypes } from "./ChallengeTypes.sol";

/// @title ChallengeSettlementLogic Library
/// @notice Handles challenge finalization, payout claims, refund claims, and action aggregation.
/// @dev Settlement is computed from VeBetterPassport action counts collected over the challenge rounds and selected
/// apps, then mapped to one of the supported settlement modes.
library ChallengeSettlementLogic {
  /// @notice Emitted when a challenge settlement is finalized.
  event ChallengeFinalized(
    uint256 indexed challengeId,
    ChallengeTypes.SettlementMode settlementMode,
    uint256 bestScore,
    uint256 bestCount,
    uint256 qualifiedCount
  );

  /// @notice Emitted when an account claims a challenge payout.
  event ChallengePayoutClaimed(uint256 indexed challengeId, address indexed account, uint256 amount);

  /// @notice Emitted when an account claims a challenge refund.
  event ChallengeRefundClaimed(uint256 indexed challengeId, address indexed account, uint256 amount);

  /// @notice Finalizes a challenge after its end round and computes the settlement mode.
  /// @param challengeId Challenge identifier.
  function finalizeChallenge(uint256 challengeId) public {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);
    uint256 currentRound = $.xAllocationVoting.currentRoundId();

    if (currentRound <= challenge.endRound) {
      revert IChallenges.ChallengeNotEnded(challengeId, challenge.endRound, currentRound);
    }

    // Re-sync pending challenges at finalize time so invalid or cancelled states cannot bypass settlement checks.
    ChallengeTypes.ChallengeStatus status = ChallengeTypes.ChallengeStatus(ChallengeCoreLogic.syncChallenge(challengeId));
    if (status == ChallengeTypes.ChallengeStatus.Invalid || status == ChallengeTypes.ChallengeStatus.Cancelled) {
      revert IChallenges.ChallengeInvalidStatus(challengeId, status);
    }
    if (status == ChallengeTypes.ChallengeStatus.Finalized) {
      revert IChallenges.ChallengeAlreadyFinalized(challengeId);
    }

    for (uint256 i; i < challenge.participants.length; i++) {
      uint256 actions = _getParticipantActions(challenge, challenge.participants[i]);
      _updateSettlementState(challenge, actions);
    }

    _finalizeSettlement(challengeId, challenge);
  }

  /// @notice Claims the caller's payout from a finalized challenge.
  /// @param challengeId Challenge identifier.
  /// @return amount Amount transferred to the caller.
  function claimChallengePayout(uint256 challengeId) public returns (uint256 amount) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    if (challenge.status == ChallengeTypes.ChallengeStatus.Pending) {
      ChallengeCoreLogic.syncChallenge(challengeId);
    }

    if (challenge.status != ChallengeTypes.ChallengeStatus.Finalized) {
      revert IChallenges.ChallengeInvalidStatus(challengeId, challenge.status);
    }

    if ($.hasClaimed[challengeId][msg.sender]) revert IChallenges.AlreadyClaimed(challengeId, msg.sender);

    if (!_isEligibleForPayout(challengeId, challenge, msg.sender)) {
      revert IChallenges.NothingToClaim(challengeId, msg.sender);
    }

    uint256 recipientCount = _payoutRecipientCount(challenge);
    amount = _payoutAmount(challenge.totalPrize, recipientCount, challenge.payoutsClaimed);

    $.hasClaimed[challengeId][msg.sender] = true;
    challenge.payoutsClaimed++;

    if (!$.b3tr.transfer(msg.sender, amount)) revert IChallenges.TransferFailed();

    emit ChallengePayoutClaimed(challengeId, msg.sender, amount);
  }

  /// @notice Claims the caller's refund from a cancelled or invalid challenge.
  /// @param challengeId Challenge identifier.
  /// @return amount Amount transferred to the caller.
  function claimChallengeRefund(uint256 challengeId) public returns (uint256 amount) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    if (challenge.status == ChallengeTypes.ChallengeStatus.Pending) {
      ChallengeCoreLogic.syncChallenge(challengeId);
    }

    if (challenge.status != ChallengeTypes.ChallengeStatus.Cancelled && challenge.status != ChallengeTypes.ChallengeStatus.Invalid) {
      revert IChallenges.ChallengeInvalidStatus(challengeId, challenge.status);
    }

    if ($.hasRefunded[challengeId][msg.sender]) revert IChallenges.AlreadyRefunded(challengeId, msg.sender);

    amount = _refundAmount(challengeId, challenge, msg.sender);
    if (amount == 0) revert IChallenges.NothingToRefund(challengeId, msg.sender);

    $.hasRefunded[challengeId][msg.sender] = true;

    if (!$.b3tr.transfer(msg.sender, amount)) revert IChallenges.TransferFailed();

    emit ChallengeRefundClaimed(challengeId, msg.sender, amount);
  }

  /// @notice Returns the actions counted for a participant within the challenge scope.
  /// @param challengeId Challenge identifier.
  /// @param participant Participant address.
  /// @return Number of counted actions.
  function getParticipantActions(uint256 challengeId, address participant) public view returns (uint256) {
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);
    return _getParticipantActions(challenge, participant);
  }

  function _updateSettlementState(ChallengeTypes.Challenge storage challenge, uint256 actions) private {
    // Threshold modes are only meaningful for sponsored challenges. Stake challenges always resolve by top score.
    bool thresholdEnabled =
      challenge.kind == ChallengeTypes.ChallengeKind.Sponsored &&
      challenge.threshold > 0 &&
      challenge.thresholdMode != ChallengeTypes.ThresholdMode.None;

    if (!thresholdEnabled) {
      _updateBestScore(challenge, actions);
      return;
    }

    if (challenge.thresholdMode == ChallengeTypes.ThresholdMode.SplitAboveThreshold) {
      if (actions >= challenge.threshold) {
        challenge.qualifiedCount++;
      }
      return;
    }

    if (actions >= challenge.threshold) {
      _updateBestScore(challenge, actions);
    }
  }

  function _updateBestScore(ChallengeTypes.Challenge storage challenge, uint256 actions) private {
    if (challenge.bestCount == 0 || actions > challenge.bestScore) {
      challenge.bestScore = actions;
      challenge.bestCount = 1;
      return;
    }

    if (actions == challenge.bestScore) {
      challenge.bestCount++;
    }
  }

  function _finalizeSettlement(uint256 challengeId, ChallengeTypes.Challenge storage challenge) private {
    bool thresholdEnabled =
      challenge.kind == ChallengeTypes.ChallengeKind.Sponsored &&
      challenge.threshold > 0 &&
      challenge.thresholdMode != ChallengeTypes.ThresholdMode.None;

    // If no participant qualifies in a thresholded sponsored challenge, the sponsored pool goes back to the creator.
    if (!thresholdEnabled) {
      challenge.settlementMode = ChallengeTypes.SettlementMode.TopWinners;
    } else if (challenge.thresholdMode == ChallengeTypes.ThresholdMode.SplitAboveThreshold) {
      challenge.settlementMode = challenge.qualifiedCount == 0
        ? ChallengeTypes.SettlementMode.CreatorRefund
        : ChallengeTypes.SettlementMode.QualifiedSplit;
    } else {
      challenge.settlementMode = challenge.bestCount == 0
        ? ChallengeTypes.SettlementMode.CreatorRefund
        : ChallengeTypes.SettlementMode.TopWinners;
    }

    challenge.status = ChallengeTypes.ChallengeStatus.Finalized;

    emit ChallengeFinalized(
      challengeId,
      challenge.settlementMode,
      challenge.bestScore,
      challenge.bestCount,
      challenge.qualifiedCount
    );
  }

  function _isEligibleForPayout(
    uint256 challengeId,
    ChallengeTypes.Challenge storage challenge,
    address account
  ) private view returns (bool) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();

    if (challenge.settlementMode == ChallengeTypes.SettlementMode.CreatorRefund) {
      return account == challenge.creator;
    }

    if ($.participantStatus[challengeId][account] != ChallengeTypes.ParticipantStatus.Joined) {
      return false;
    }

    uint256 actions = _getParticipantActions(challenge, account);

    if (challenge.settlementMode == ChallengeTypes.SettlementMode.QualifiedSplit) {
      return actions >= challenge.threshold;
    }

    return actions == challenge.bestScore;
  }

  function _refundAmount(
    uint256 challengeId,
    ChallengeTypes.Challenge storage challenge,
    address account
  ) private view returns (uint256) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();

    if (challenge.kind == ChallengeTypes.ChallengeKind.Stake) {
      return $.participantStatus[challengeId][account] == ChallengeTypes.ParticipantStatus.Joined ? challenge.stakeAmount : 0;
    }

    return account == challenge.creator ? challenge.totalPrize : 0;
  }

  function _payoutRecipientCount(ChallengeTypes.Challenge storage challenge) private view returns (uint256) {
    if (challenge.settlementMode == ChallengeTypes.SettlementMode.CreatorRefund) {
      return 1;
    }

    if (challenge.settlementMode == ChallengeTypes.SettlementMode.QualifiedSplit) {
      return challenge.qualifiedCount;
    }

    return challenge.bestCount;
  }

  function _payoutAmount(
    uint256 totalPrize,
    uint256 recipientCount,
    uint256 payoutsClaimed
  ) private pure returns (uint256) {
    uint256 baseShare = totalPrize / recipientCount;

    // Leave any division remainder to the last claimant so the full prize is eventually distributed without dust.
    if (payoutsClaimed + 1 == recipientCount) {
      return totalPrize - (baseShare * (recipientCount - 1));
    }

    return baseShare;
  }

  function _getParticipantActions(
    ChallengeTypes.Challenge storage challenge,
    address participant
  ) private view returns (uint256 totalActions) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();

    // When `allApps` is enabled we can sum the per-round total once, instead of iterating app-by-app.
    if (challenge.allApps) {
      for (uint256 round = challenge.startRound; round <= challenge.endRound; round++) {
        totalActions += $.veBetterPassport.userRoundActionCount(participant, round);
      }

      return totalActions;
    }

    for (uint256 round = challenge.startRound; round <= challenge.endRound; round++) {
      for (uint256 i; i < challenge.appIds.length; i++) {
        totalActions += $.veBetterPassport.userRoundActionCountApp(participant, round, challenge.appIds[i]);
      }
    }
  }

  function _getChallenge(uint256 challengeId) private view returns (ChallengeTypes.Challenge storage challenge) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();

    if (challengeId == 0 || challengeId > $.challengeCount) revert IChallenges.ChallengeDoesNotExist(challengeId);

    challenge = $.challenges[challengeId];
  }
}
