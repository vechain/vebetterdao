// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IChallenges } from "../../interfaces/IChallenges.sol";
import { ChallengeCoreLogic } from "./ChallengeCoreLogic.sol";
import { ChallengeStorageTypes } from "./ChallengeStorageTypes.sol";
import { ChallengeTypes } from "./ChallengeTypes.sol";

library ChallengeSettlementLogic {
  event ChallengeFinalizationAdvanced(uint256 indexed challengeId, uint256 nextFinalizeIndex, uint256 processedCount);
  event ChallengeFinalized(
    uint256 indexed challengeId,
    ChallengeTypes.SettlementMode settlementMode,
    uint256 bestScore,
    uint256 bestCount,
    uint256 qualifiedCount
  );
  event ChallengePayoutClaimed(uint256 indexed challengeId, address indexed account, uint256 amount);
  event ChallengeRefundClaimed(uint256 indexed challengeId, address indexed account, uint256 amount);

  function finalizeChallengeBatch(
    uint256 challengeId,
    uint256 batchSize
  ) internal returns (uint256 nextFinalizeIndex, ChallengeTypes.ChallengeStatus status) {
    if (batchSize == 0) revert IChallenges.InvalidBatchSize(batchSize);

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);
    uint256 currentRound = $.xAllocationVoting.currentRoundId();

    if (currentRound <= challenge.endRound) {
      revert IChallenges.ChallengeNotEnded(challengeId, challenge.endRound, currentRound);
    }

    status = ChallengeCoreLogic.syncChallenge(challengeId);
    if (status == ChallengeTypes.ChallengeStatus.Invalid || status == ChallengeTypes.ChallengeStatus.Cancelled) {
      revert IChallenges.ChallengeInvalidStatus(challengeId, status);
    }
    if (status == ChallengeTypes.ChallengeStatus.Finalized) {
      revert IChallenges.ChallengeAlreadyFinalized(challengeId);
    }

    if (challenge.status == ChallengeTypes.ChallengeStatus.Active) {
      challenge.status = ChallengeTypes.ChallengeStatus.Finalizing;
    }

    uint256 startIndex = challenge.nextFinalizeIndex;
    uint256 endIndex = startIndex + batchSize;
    if (endIndex > challenge.participants.length) {
      endIndex = challenge.participants.length;
    }

    for (uint256 i = startIndex; i < endIndex; i++) {
      uint256 actions = _getParticipantActions(challenge, challenge.participants[i]);
      _updateSettlementState(challenge, actions);
    }

    challenge.nextFinalizeIndex = endIndex;
    nextFinalizeIndex = endIndex;

    if (endIndex == challenge.participants.length) {
      _finalizeSettlement(challengeId, challenge);
      status = challenge.status;
    } else {
      emit ChallengeFinalizationAdvanced(challengeId, endIndex, endIndex);
      status = ChallengeTypes.ChallengeStatus.Finalizing;
    }
  }

  function claimChallengePayout(uint256 challengeId) internal returns (uint256 amount) {
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

    require($.b3tr.transfer(msg.sender, amount), "Challenges: transfer failed");

    emit ChallengePayoutClaimed(challengeId, msg.sender, amount);
  }

  function claimChallengeRefund(uint256 challengeId) internal returns (uint256 amount) {
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

    require($.b3tr.transfer(msg.sender, amount), "Challenges: transfer failed");

    emit ChallengeRefundClaimed(challengeId, msg.sender, amount);
  }

  function getParticipantActions(uint256 challengeId, address participant) internal view returns (uint256) {
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);
    return _getParticipantActions(challenge, participant);
  }

  function _updateSettlementState(ChallengeTypes.Challenge storage challenge, uint256 actions) private {
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
