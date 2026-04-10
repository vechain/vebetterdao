// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IChallenges } from "../../interfaces/IChallenges.sol";
import { ChallengeStorageTypes } from "./ChallengeStorageTypes.sol";
import { ChallengeTypes } from "./ChallengeTypes.sol";

library ChallengeCoreLogic {
  event ChallengeCreated(uint256 indexed challengeId, address indexed creator, uint256 indexed endRound, uint256 startRound);
  event ChallengeInviteAdded(uint256 indexed challengeId, address indexed invitee);
  event ChallengeJoined(uint256 indexed challengeId, address indexed participant);
  event ChallengeLeft(uint256 indexed challengeId, address indexed participant);
  event ChallengeDeclined(uint256 indexed challengeId, address indexed participant);
  event ChallengeCancelled(uint256 indexed challengeId);
  event ChallengeActivated(uint256 indexed challengeId);
  event ChallengeInvalidated(uint256 indexed challengeId);

  function createChallenge(ChallengeTypes.CreateChallengeParams memory params) public returns (uint256 challengeId) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    uint256 currentRound = _currentRound($);

    if (params.stakeAmount == 0) revert IChallenges.InvalidAmount();
    if (params.stakeAmount < $.minBetAmount) {
      revert IChallenges.BetAmountBelowMinimum(params.stakeAmount, $.minBetAmount);
    }

    uint256 startRound = params.startRound == 0 ? currentRound + 1 : params.startRound;
    if (startRound <= currentRound) revert IChallenges.InvalidStartRound(startRound, currentRound);
    if (params.endRound < startRound) revert IChallenges.InvalidEndRound(startRound, params.endRound);

    uint256 duration = params.endRound - startRound + 1;
    if (duration > $.maxChallengeDuration) {
      revert IChallenges.MaxChallengeDurationExceeded(duration, $.maxChallengeDuration);
    }

    bool allApps = params.appIds.length == 0;
    if (!allApps) {
      if (params.appIds.length > $.maxSelectedApps) {
        revert IChallenges.MaxSelectedAppsExceeded(params.appIds.length, $.maxSelectedApps);
      }
      _validateApps(params.appIds);
    }

    _validateThresholdConfiguration(params);

    challengeId = ++$.challengeCount;
    ChallengeTypes.Challenge storage challenge = $.challenges[challengeId];

    challenge.kind = params.kind;
    challenge.visibility = params.visibility;
    challenge.thresholdMode = params.thresholdMode;
    challenge.status = ChallengeTypes.ChallengeStatus.Pending;
    challenge.settlementMode = ChallengeTypes.SettlementMode.None;
    challenge.creator = msg.sender;
    challenge.stakeAmount = params.stakeAmount;
    challenge.startRound = startRound;
    challenge.endRound = params.endRound;
    challenge.threshold = params.threshold;
    challenge.allApps = allApps;
    challenge.totalPrize = params.stakeAmount;

    for (uint256 i; i < params.appIds.length; i++) {
      challenge.appIds.push(params.appIds[i]);
    }

    if (!$.b3tr.transferFrom(msg.sender, address(this), params.stakeAmount)) revert IChallenges.TransferFailed();

    if (params.kind == ChallengeTypes.ChallengeKind.Stake) {
      _addParticipant(challengeId, msg.sender);
    }

    emit ChallengeCreated(challengeId, msg.sender, params.endRound, startRound);

    for (uint256 i; i < params.invitees.length; i++) {
      _addInvite(challengeId, params.invitees[i]);
    }
  }

  function addInvites(uint256 challengeId, address[] memory invitees) public {
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    _ensurePendingChallenge(challengeId, challenge);

    if (msg.sender != challenge.creator) revert IChallenges.ChallengesUnauthorizedUser(msg.sender);

    for (uint256 i; i < invitees.length; i++) {
      _addInvite(challengeId, invitees[i]);
    }
  }

  function joinChallenge(uint256 challengeId) public {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    _ensurePendingChallenge(challengeId, challenge);

    if (msg.sender == challenge.creator) revert IChallenges.CreatorCannotJoin(challengeId);

    if (challenge.visibility == ChallengeTypes.ChallengeVisibility.Private && !$.invitationEligible[challengeId][msg.sender]) {
      revert IChallenges.NotInvited(challengeId, msg.sender);
    }

    if ($.participantStatus[challengeId][msg.sender] == ChallengeTypes.ParticipantStatus.Joined) {
      revert IChallenges.AlreadyParticipating(challengeId, msg.sender);
    }

    if (challenge.participants.length >= $.maxParticipants) {
      revert IChallenges.MaxParticipantsExceeded(challenge.participants.length + 1, $.maxParticipants);
    }

    if (challenge.kind == ChallengeTypes.ChallengeKind.Stake) {
      challenge.totalPrize += challenge.stakeAmount;
      if (!$.b3tr.transferFrom(msg.sender, address(this), challenge.stakeAmount)) revert IChallenges.TransferFailed();
    }

    _removeFromInvitedIfPresent(challengeId, msg.sender);
    _removeFromDeclinedIfPresent(challengeId, msg.sender);
    _addParticipant(challengeId, msg.sender);

    emit ChallengeJoined(challengeId, msg.sender);
  }

  function leaveChallenge(uint256 challengeId) public {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    _ensurePendingChallenge(challengeId, challenge);

    if (msg.sender == challenge.creator) revert IChallenges.CreatorCannotLeave(challengeId);
    if ($.participantStatus[challengeId][msg.sender] != ChallengeTypes.ParticipantStatus.Joined) {
      revert IChallenges.NotParticipating(challengeId, msg.sender);
    }

    _removeParticipant(challengeId, msg.sender);

    if (challenge.kind == ChallengeTypes.ChallengeKind.Stake) {
      challenge.totalPrize -= challenge.stakeAmount;
      if (!$.b3tr.transfer(msg.sender, challenge.stakeAmount)) revert IChallenges.TransferFailed();
    }

    if ($.invitationEligible[challengeId][msg.sender]) {
      _addInvited(challengeId, msg.sender);
    } else {
      $.participantStatus[challengeId][msg.sender] = ChallengeTypes.ParticipantStatus.None;
    }

    emit ChallengeLeft(challengeId, msg.sender);
  }

  function declineChallenge(uint256 challengeId) public {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    _ensurePendingChallenge(challengeId, challenge);

    if (msg.sender == challenge.creator) revert IChallenges.ChallengesUnauthorizedUser(msg.sender);
    if (!$.invitationEligible[challengeId][msg.sender]) revert IChallenges.NotInvited(challengeId, msg.sender);

    if ($.participantStatus[challengeId][msg.sender] == ChallengeTypes.ParticipantStatus.Joined) {
      _removeParticipant(challengeId, msg.sender);

      if (challenge.kind == ChallengeTypes.ChallengeKind.Stake) {
        challenge.totalPrize -= challenge.stakeAmount;
        if (!$.b3tr.transfer(msg.sender, challenge.stakeAmount)) revert IChallenges.TransferFailed();
      }
    }

    _removeFromInvitedIfPresent(challengeId, msg.sender);
    _removeFromDeclinedIfPresent(challengeId, msg.sender);
    _addDeclined(challengeId, msg.sender);

    emit ChallengeDeclined(challengeId, msg.sender);
  }

  function cancelChallenge(uint256 challengeId) public {
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    _ensurePendingChallenge(challengeId, challenge);

    if (msg.sender != challenge.creator) revert IChallenges.ChallengesUnauthorizedUser(msg.sender);

    challenge.status = ChallengeTypes.ChallengeStatus.Cancelled;

    emit ChallengeCancelled(challengeId);
  }

  function syncChallenge(uint256 challengeId) public returns (uint8) {
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    if (challenge.status != ChallengeTypes.ChallengeStatus.Pending) {
      return uint8(challenge.status);
    }

    ChallengeTypes.ChallengeStatus computed = ChallengeTypes.ChallengeStatus(getComputedStatus(challengeId));
    if (computed == ChallengeTypes.ChallengeStatus.Pending) {
      return uint8(computed);
    }

    challenge.status = computed;

    if (computed == ChallengeTypes.ChallengeStatus.Active) {
      emit ChallengeActivated(challengeId);
    } else {
      emit ChallengeInvalidated(challengeId);
    }

    return uint8(computed);
  }

  function getComputedStatus(uint256 challengeId) public view returns (uint8) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = _getChallenge(challengeId);

    if (challenge.status != ChallengeTypes.ChallengeStatus.Pending) {
      return uint8(challenge.status);
    }

    if (_currentRound($) < challenge.startRound) {
      return uint8(ChallengeTypes.ChallengeStatus.Pending);
    }

    return uint8(_isChallengeValid(challenge) ? ChallengeTypes.ChallengeStatus.Active : ChallengeTypes.ChallengeStatus.Invalid);
  }

  function _validateThresholdConfiguration(ChallengeTypes.CreateChallengeParams memory params) private pure {
    if (params.kind == ChallengeTypes.ChallengeKind.Stake) {
      if (params.threshold != 0 || params.thresholdMode != ChallengeTypes.ThresholdMode.None) {
        revert IChallenges.InvalidThresholdConfiguration();
      }
      return;
    }

    if (params.threshold == 0 && params.thresholdMode != ChallengeTypes.ThresholdMode.None) {
      revert IChallenges.InvalidThresholdConfiguration();
    }

    if (params.threshold > 0 && params.thresholdMode == ChallengeTypes.ThresholdMode.None) {
      revert IChallenges.InvalidThresholdConfiguration();
    }
  }

  function _validateApps(bytes32[] memory appIds) private view {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();

    for (uint256 i; i < appIds.length; i++) {
      if (!$.x2EarnApps.appExists(appIds[i])) revert IChallenges.ChallengeUnknownApp(appIds[i]);

      for (uint256 j; j < i; j++) {
        if (appIds[j] == appIds[i]) revert IChallenges.DuplicateApp(appIds[i]);
      }
    }
  }

  function _ensurePendingChallenge(uint256 challengeId, ChallengeTypes.Challenge storage challenge) private view {
    if (challenge.status != ChallengeTypes.ChallengeStatus.Pending) {
      revert IChallenges.ChallengeNotPending(challengeId);
    }

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    if (_currentRound($) >= challenge.startRound) {
      revert IChallenges.ChallengeNotPending(challengeId);
    }
  }

  function _addInvite(uint256 challengeId, address invitee) private {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();

    if (invitee == address(0)) revert IChallenges.ZeroAddress();

    ChallengeTypes.Challenge storage challenge = $.challenges[challengeId];
    if (invitee == challenge.creator) {
      return;
    }

    if ($.participantStatus[challengeId][invitee] == ChallengeTypes.ParticipantStatus.Joined) {
      return;
    }

    if ($.participantStatus[challengeId][invitee] == ChallengeTypes.ParticipantStatus.Invited) {
      revert IChallenges.AlreadyInvited(challengeId, invitee);
    }

    if (!$.invitationEligible[challengeId][invitee]) {
      $.invitationEligible[challengeId][invitee] = true;
    }

    _removeFromDeclinedIfPresent(challengeId, invitee);
    _addInvited(challengeId, invitee);
    emit ChallengeInviteAdded(challengeId, invitee);
  }

  function _addParticipant(uint256 challengeId, address participant) private {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = $.challenges[challengeId];

    if ($.participantIndexPlusOne[challengeId][participant] != 0) {
      revert IChallenges.AlreadyParticipating(challengeId, participant);
    }

    challenge.participants.push(participant);
    $.participantIndexPlusOne[challengeId][participant] = challenge.participants.length;
    $.participantStatus[challengeId][participant] = ChallengeTypes.ParticipantStatus.Joined;
  }

  function _removeParticipant(uint256 challengeId, address participant) private {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = $.challenges[challengeId];
    uint256 indexPlusOne = $.participantIndexPlusOne[challengeId][participant];

    if (indexPlusOne == 0) revert IChallenges.NotParticipating(challengeId, participant);

    uint256 index = indexPlusOne - 1;
    uint256 lastIndex = challenge.participants.length - 1;

    if (index != lastIndex) {
      address swapped = challenge.participants[lastIndex];
      challenge.participants[index] = swapped;
      $.participantIndexPlusOne[challengeId][swapped] = index + 1;
    }

    challenge.participants.pop();
    delete $.participantIndexPlusOne[challengeId][participant];
  }

  function _addInvited(uint256 challengeId, address invitee) private {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = $.challenges[challengeId];

    if ($.invitedIndexPlusOne[challengeId][invitee] != 0) {
      $.participantStatus[challengeId][invitee] = ChallengeTypes.ParticipantStatus.Invited;
      return;
    }

    challenge.invited.push(invitee);
    $.invitedIndexPlusOne[challengeId][invitee] = challenge.invited.length;
    $.participantStatus[challengeId][invitee] = ChallengeTypes.ParticipantStatus.Invited;
  }

  function _addDeclined(uint256 challengeId, address invitee) private {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = $.challenges[challengeId];

    if ($.declinedIndexPlusOne[challengeId][invitee] != 0) {
      $.participantStatus[challengeId][invitee] = ChallengeTypes.ParticipantStatus.Declined;
      return;
    }

    challenge.declined.push(invitee);
    $.declinedIndexPlusOne[challengeId][invitee] = challenge.declined.length;
    $.participantStatus[challengeId][invitee] = ChallengeTypes.ParticipantStatus.Declined;
  }

  function _removeFromInvitedIfPresent(uint256 challengeId, address invitee) private {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = $.challenges[challengeId];
    uint256 indexPlusOne = $.invitedIndexPlusOne[challengeId][invitee];

    if (indexPlusOne == 0) {
      return;
    }

    uint256 index = indexPlusOne - 1;
    uint256 lastIndex = challenge.invited.length - 1;

    if (index != lastIndex) {
      address swapped = challenge.invited[lastIndex];
      challenge.invited[index] = swapped;
      $.invitedIndexPlusOne[challengeId][swapped] = index + 1;
    }

    challenge.invited.pop();
    delete $.invitedIndexPlusOne[challengeId][invitee];
  }

  function _removeFromDeclinedIfPresent(uint256 challengeId, address invitee) private {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    ChallengeTypes.Challenge storage challenge = $.challenges[challengeId];
    uint256 indexPlusOne = $.declinedIndexPlusOne[challengeId][invitee];

    if (indexPlusOne == 0) {
      return;
    }

    uint256 index = indexPlusOne - 1;
    uint256 lastIndex = challenge.declined.length - 1;

    if (index != lastIndex) {
      address swapped = challenge.declined[lastIndex];
      challenge.declined[index] = swapped;
      $.declinedIndexPlusOne[challengeId][swapped] = index + 1;
    }

    challenge.declined.pop();
    delete $.declinedIndexPlusOne[challengeId][invitee];
  }

  function _isChallengeValid(ChallengeTypes.Challenge storage challenge) private view returns (bool) {
    uint256 minimumParticipants = challenge.kind == ChallengeTypes.ChallengeKind.Stake ? 2 : 1;
    return challenge.participants.length >= minimumParticipants;
  }

  function _currentRound(ChallengeStorageTypes.ChallengesStorage storage $) private view returns (uint256) {
    return $.xAllocationVoting.currentRoundId();
  }

  function _getChallenge(uint256 challengeId) private view returns (ChallengeTypes.Challenge storage challenge) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();

    if (challengeId == 0 || challengeId > $.challengeCount) revert IChallenges.ChallengeDoesNotExist(challengeId);

    challenge = $.challenges[challengeId];
  }
}
