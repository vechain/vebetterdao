// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IChallenges } from "../../interfaces/IChallenges.sol";
import { ChallengeCoreLogic } from "./ChallengeCoreLogic.sol";
import { ChallengeStorageTypes } from "./ChallengeStorageTypes.sol";
import { ChallengeTypes } from "./ChallengeTypes.sol";

/// @title ChallengeSettlementLogic Library
/// @notice Handles challenge completion (Max Actions), Split Win first-to-claim, refunds, and action aggregation.
/// @dev Two distinct settlement paths:
/// - Max Actions: requires explicit `completeChallenge` after `endRound`, top scorers split the pool.
/// - Split Win: no completion step. Joined participants race to `claimSplitWinPrize` while the challenge is active;
///   the first `numWinners` to reach `threshold` actions claim a fixed `prizePerWinner`. After `endRound` the creator
///   can reclaim any unclaimed slots via `claimCreatorSplitWinRefund`.
library ChallengeSettlementLogic {
  /// @notice Emitted when a challenge transitions to Completed status.
  /// @dev For Split Win the `bestScore` and `bestCount` fields are 0 and `settlementMode` is `SplitWinCompleted`.
  event ChallengeCompleted(
    uint256 indexed challengeId,
    ChallengeTypes.SettlementMode settlementMode,
    uint256 bestScore,
    uint256 bestCount
  );

  /// @notice Emitted when an account claims a payout from a completed Max Actions challenge.
  event ChallengePayoutClaimed(uint256 indexed challengeId, address indexed account, uint256 amount);

  /// @notice Emitted when an account claims a refund from a cancelled or invalid challenge.
  event ChallengeRefundClaimed(uint256 indexed challengeId, address indexed account, uint256 amount);

  /// @notice Emitted when a participant claims a Split Win slot.
  event SplitWinPrizeClaimed(
    uint256 indexed challengeId,
    address indexed winner,
    uint256 prize,
    uint256 actions,
    uint256 winnersClaimed
  );

  /// @notice Emitted when the creator reclaims unclaimed Split Win slots after the end round.
  event SplitWinCreatorRefunded(uint256 indexed challengeId, address indexed creator, uint256 amount);

  /// @notice Completes a Max Actions challenge after its end round and computes the settlement mode.
  /// @param challengeId Challenge identifier.
  function completeChallenge(uint256 challengeId) public {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    // Split Win challenges are first-to-claim and never complete via this path.
    if (challenge.challengeType == ChallengeTypes.ChallengeType.SplitWin) {
      revert IChallenges.SplitWinCannotComplete(challengeId);
    }

    uint256 currentRound = $.xAllocationVoting.currentRoundId();
    if (currentRound <= challenge.endRound) {
      revert IChallenges.ChallengeNotEnded(challengeId, challenge.endRound, currentRound);
    }

    // Re-sync pending challenges so invalid or cancelled states cannot bypass settlement checks.
    ChallengeTypes.ChallengeStatus status = ChallengeTypes.ChallengeStatus(ChallengeCoreLogic.syncChallenge(challengeId));
    if (status == ChallengeTypes.ChallengeStatus.Invalid || status == ChallengeTypes.ChallengeStatus.Cancelled) {
      revert IChallenges.ChallengeInvalidStatus(challengeId, status);
    }
    if (status == ChallengeTypes.ChallengeStatus.Completed) {
      revert IChallenges.ChallengeAlreadyCompleted(challengeId);
    }

    // Pass 1: compute bestScore/bestCount only over participants NOT flagged as sybils. We use the soft
    // VeBetterPassport check (blacklist + signaling threshold) instead of `isPerson` so honest veDelegate
    // delegators are not excluded from competing for the prize. Cache per-participant results so the second
    // pass does not re-run the (potentially expensive) action sum.
    uint256 participantsLen = challenge.participants.length;
    uint256[] memory cachedActions = new uint256[](participantsLen);
    bool[] memory eligibleCache = new bool[](participantsLen);
    for (uint256 i; i < participantsLen; i++) {
      address participant = challenge.participants[i];
      if (_isFlaggedSybil($, participant)) continue;
      eligibleCache[i] = true;
      uint256 actions = _getParticipantActions(challenge, participant);
      cachedActions[i] = actions;
      _updateBestScore(challenge, actions);
    }

    // Pass 2: snapshot the eligible-winner set AND the count used as the payout divisor. Both are frozen
    // at completion so neither the membership nor the share size can drift after the fact. Without the
    // explicit `eligibleWinnerCount`, `_payoutRecipientCount` would have to fall back to `bestCount` —
    // safe today only because the two are derived from the same filter, but a fragile coupling that
    // historically stranded a per-winner share when a live personhood re-check blocked a counted winner.
    if (challenge.bestCount > 0) {
      uint256 bestScore = challenge.bestScore;
      uint256 eligibleCount;
      for (uint256 i; i < participantsLen; i++) {
        if (eligibleCache[i] && cachedActions[i] == bestScore) {
          $.isEligibleWinner[challengeId][challenge.participants[i]] = true;
          eligibleCount++;
        }
      }
      $.eligibleWinnerCount[challengeId] = eligibleCount;
    }

    challenge.settlementMode = challenge.bestCount == 0
      ? ChallengeTypes.SettlementMode.CreatorRefund
      : ChallengeTypes.SettlementMode.TopWinners;
    challenge.status = ChallengeTypes.ChallengeStatus.Completed;

    emit ChallengeCompleted(challengeId, challenge.settlementMode, challenge.bestScore, challenge.bestCount);
  }

  /// @notice Claims the caller's payout from a completed Max Actions challenge.
  /// @param challengeId Challenge identifier.
  /// @return amount Amount transferred to the caller.
  function claimChallengePayout(uint256 challengeId) public returns (uint256 amount) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    // Split Win uses its own claim path.
    if (challenge.challengeType == ChallengeTypes.ChallengeType.SplitWin) {
      revert IChallenges.ChallengeInvalidStatus(challengeId, challenge.status);
    }

    if (challenge.status == ChallengeTypes.ChallengeStatus.Pending) {
      ChallengeCoreLogic.syncChallenge(challengeId);
    }

    if (challenge.status != ChallengeTypes.ChallengeStatus.Completed) {
      revert IChallenges.ChallengeInvalidStatus(challengeId, challenge.status);
    }

    if ($.hasClaimed[challengeId][msg.sender]) revert IChallenges.AlreadyClaimed(challengeId, msg.sender);

    // The TopWinners branch reads `isEligibleWinner`, a snapshot frozen at completeChallenge time.
    // It already encodes the personhood filter — no additional live `isPerson` check is needed (and adding
    // one would re-open the bug where a snapshot-excluded account could later regain personhood and steal a
    // slot that `bestCount` never accounted for).
    if (!_isEligibleForPayout(challengeId, challenge, msg.sender)) {
      revert IChallenges.NothingToClaim(challengeId, msg.sender);
    }

    uint256 recipientCount = _payoutRecipientCount(challengeId, challenge);
    amount = _payoutAmount(challenge.totalPrize, recipientCount, challenge.payoutsClaimed);

    $.hasClaimed[challengeId][msg.sender] = true;
    challenge.payoutsClaimed++;

    if (!$.b3tr.transfer(msg.sender, amount)) revert IChallenges.TransferFailed();

    emit ChallengePayoutClaimed(challengeId, msg.sender, amount);
  }

  /// @notice Claims a Split Win slot during the active window.
  /// @dev Reads passport actions live across `[startRound, min(currentRound, endRound)]`. First `numWinners` callers
  /// to meet the threshold get one fixed `prizePerWinner` payout each. Once all slots are filled the challenge flips
  /// to Completed.
  /// @param challengeId Challenge identifier.
  /// @return amount Amount transferred to the caller.
  function claimSplitWinPrize(uint256 challengeId) public returns (uint256 amount) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    if (challenge.challengeType != ChallengeTypes.ChallengeType.SplitWin) {
      revert IChallenges.NotASplitWinChallenge(challengeId);
    }

    if (challenge.status == ChallengeTypes.ChallengeStatus.Pending) {
      ChallengeCoreLogic.syncChallenge(challengeId);
    }

    if (challenge.status != ChallengeTypes.ChallengeStatus.Active) {
      revert IChallenges.ChallengeInvalidStatus(challengeId, challenge.status);
    }

    uint256 currentRound = $.xAllocationVoting.currentRoundId();
    if (currentRound < challenge.startRound) {
      revert IChallenges.ChallengeInvalidStatus(challengeId, challenge.status);
    }
    if (currentRound > challenge.endRound) {
      revert IChallenges.ChallengeEnded(challengeId, challenge.endRound, currentRound);
    }

    if ($.participantStatus[challengeId][msg.sender] != ChallengeTypes.ParticipantStatus.Joined) {
      revert IChallenges.NotParticipating(challengeId, msg.sender);
    }

    if ($.isSplitWinWinner[challengeId][msg.sender]) revert IChallenges.AlreadyClaimed(challengeId, msg.sender);

    if (challenge.winners.length >= challenge.numWinners) {
      revert IChallenges.SplitWinSlotsExhausted(challengeId);
    }

    // Block sybils/blacklisted accounts from grabbing Split Win slots.
    _requirePerson($, msg.sender);

    uint256 actions = _getParticipantActionsUpTo(challenge, msg.sender, currentRound);
    if (actions < challenge.threshold) {
      revert IChallenges.NotEligibleForSplitWin(challengeId, msg.sender, actions, challenge.threshold);
    }

    amount = challenge.prizePerWinner;
    challenge.winners.push(msg.sender);
    $.isSplitWinWinner[challengeId][msg.sender] = true;

    if (!$.b3tr.transfer(msg.sender, amount)) revert IChallenges.TransferFailed();

    emit SplitWinPrizeClaimed(challengeId, msg.sender, amount, actions, challenge.winners.length);

    // Auto-complete once every slot is taken so downstream consumers see a terminal state.
    if (challenge.winners.length == challenge.numWinners) {
      challenge.status = ChallengeTypes.ChallengeStatus.Completed;
      challenge.settlementMode = ChallengeTypes.SettlementMode.SplitWinCompleted;
      emit ChallengeCompleted(challengeId, challenge.settlementMode, 0, 0);
    }
  }

  /// @notice Reclaims unclaimed Split Win slots after the end round.
  /// @dev Only the creator can call. Pays `(numWinners - winnersClaimed) * prizePerWinner` plus any integer-division
  /// remainder retained at creation. Sets status to Completed if not already.
  /// @param challengeId Challenge identifier.
  /// @return amount Amount transferred to the creator.
  function claimCreatorSplitWinRefund(uint256 challengeId) public returns (uint256 amount) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    if (challenge.challengeType != ChallengeTypes.ChallengeType.SplitWin) {
      revert IChallenges.NotASplitWinChallenge(challengeId);
    }
    if (msg.sender != challenge.creator) revert IChallenges.ChallengesUnauthorizedUser(msg.sender);

    if (challenge.status == ChallengeTypes.ChallengeStatus.Pending) {
      ChallengeCoreLogic.syncChallenge(challengeId);
    }

    if (
      challenge.status != ChallengeTypes.ChallengeStatus.Active &&
      challenge.status != ChallengeTypes.ChallengeStatus.Completed
    ) {
      revert IChallenges.ChallengeInvalidStatus(challengeId, challenge.status);
    }

    uint256 currentRound = $.xAllocationVoting.currentRoundId();
    if (currentRound <= challenge.endRound) {
      revert IChallenges.ChallengeNotEnded(challengeId, challenge.endRound, currentRound);
    }

    if ($.hasRefunded[challengeId][msg.sender]) revert IChallenges.AlreadyRefunded(challengeId, msg.sender);

    // Total = unclaimed slots + integer-division remainder retained at creation.
    uint256 unclaimedSlots = challenge.numWinners - challenge.winners.length;
    if (unclaimedSlots == 0) revert IChallenges.NothingToRefund(challengeId, msg.sender);

    uint256 paidOut = challenge.prizePerWinner * challenge.winners.length;
    amount = challenge.totalPrize - paidOut;

    $.hasRefunded[challengeId][msg.sender] = true;

    if (challenge.status == ChallengeTypes.ChallengeStatus.Active) {
      challenge.status = ChallengeTypes.ChallengeStatus.Completed;
      challenge.settlementMode = ChallengeTypes.SettlementMode.SplitWinCompleted;
      emit ChallengeCompleted(challengeId, challenge.settlementMode, 0, 0);
    }

    if (!$.b3tr.transfer(msg.sender, amount)) revert IChallenges.TransferFailed();

    emit SplitWinCreatorRefunded(challengeId, msg.sender, amount);
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

  /// @dev Rejects only sybils explicitly flagged in VeBetterPassport (blacklist or over the signaling threshold).
  /// `isPerson` is intentionally NOT used: it returns false for users that delegated their passport via
  /// veDelegate, which would lock honest delegators out of joining/claiming.
  function _requirePerson(ChallengeStorageTypes.ChallengesStorage storage $, address account) private view {
    if (_isFlaggedSybil($, account)) {
      revert IChallenges.NotVerifiedPerson(account, _flagReason($, account));
    }
  }

  /// @dev Returns true when an account is flagged as a sybil by VeBetterPassport.
  /// Single source of truth so the completeChallenge skip predicate stays in lockstep with `_requirePerson`.
  function _isFlaggedSybil(ChallengeStorageTypes.ChallengesStorage storage $, address account) private view returns (bool) {
    if ($.veBetterPassport.isBlacklisted(account)) return true;
    uint256 threshold = $.veBetterPassport.signalingThreshold();
    return threshold != 0 && $.veBetterPassport.signaledCounter(account) >= threshold;
  }

  function _flagReason(ChallengeStorageTypes.ChallengesStorage storage $, address account) private view returns (string memory) {
    if ($.veBetterPassport.isBlacklisted(account)) return "User is blacklisted";
    return "User has been signaled too many times";
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

  function _isEligibleForPayout(
    uint256 challengeId,
    ChallengeTypes.Challenge storage challenge,
    address account
  ) private view returns (bool) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();

    if (challenge.settlementMode == ChallengeTypes.SettlementMode.CreatorRefund) {
      return account == challenge.creator;
    }

    // Read the snapshot taken at completeChallenge time. The actions == bestScore comparison and the
    // personhood filter were both applied then; re-evaluating either one live would let the claimable
    // set drift away from `bestCount` (see `completeChallenge` for the rationale).
    return $.isEligibleWinner[challengeId][account];
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

  function _payoutRecipientCount(
    uint256 challengeId,
    ChallengeTypes.Challenge storage challenge
  ) private view returns (uint256) {
    if (challenge.settlementMode == ChallengeTypes.SettlementMode.CreatorRefund) {
      return 1;
    }
    // Bind the divisor to the snapshot: anything else (including `bestCount`) re-opens the door to
    // diverging from the claimable membership and stranding a per-winner share in the contract.
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    return $.eligibleWinnerCount[challengeId];
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
    return _getParticipantActionsUpTo(challenge, participant, challenge.endRound);
  }

  /// @dev Sums passport actions for `participant` over `[startRound, min(upToRound, endRound)]`.
  /// `upToRound` lets Split Win read live progress mid-challenge while keeping completed/Max Actions reads on the
  /// full window.
  function _getParticipantActionsUpTo(
    ChallengeTypes.Challenge storage challenge,
    address participant,
    uint256 upToRound
  ) private view returns (uint256 totalActions) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    uint256 lastRound = upToRound > challenge.endRound ? challenge.endRound : upToRound;

    if (lastRound < challenge.startRound) return 0;

    if (challenge.allApps) {
      for (uint256 round = challenge.startRound; round <= lastRound; round++) {
        totalActions += $.veBetterPassport.userRoundActionCount(participant, round);
      }
      return totalActions;
    }

    for (uint256 round = challenge.startRound; round <= lastRound; round++) {
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
