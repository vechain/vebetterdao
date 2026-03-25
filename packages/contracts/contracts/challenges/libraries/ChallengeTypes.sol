// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

library ChallengeTypes {
  enum ChallengeKind {
    Stake,
    Sponsored
  }

  enum ChallengeVisibility {
    Public,
    Private
  }

  enum ThresholdMode {
    None,
    SplitAboveThreshold,
    TopAboveThreshold
  }

  enum ChallengeStatus {
    Pending,
    Active,
    Finalizing,
    Finalized,
    Cancelled,
    Invalid
  }

  enum SettlementMode {
    None,
    TopWinners,
    QualifiedSplit,
    CreatorRefund
  }

  enum ParticipantStatus {
    None,
    Invited,
    Declined,
    Joined
  }

  struct CreateChallengeParams {
    ChallengeKind kind;
    ChallengeVisibility visibility;
    ThresholdMode thresholdMode;
    uint256 stakeAmount;
    uint256 startRound;
    uint256 endRound;
    uint256 threshold;
    bytes32[] appIds;
    address[] invitees;
  }

  struct InitializationData {
    address b3trAddress;
    address veBetterPassportAddress;
    address xAllocationVotingAddress;
    address x2EarnAppsAddress;
    uint256 maxChallengeDuration;
    uint256 maxSelectedApps;
  }

  struct InitializationRoleData {
    address admin;
    address upgrader;
    address contractsAddressManager;
    address settingsManager;
  }

  struct Challenge {
    ChallengeKind kind;
    ChallengeVisibility visibility;
    ThresholdMode thresholdMode;
    ChallengeStatus status;
    SettlementMode settlementMode;
    address creator;
    uint256 stakeAmount;
    uint256 startRound;
    uint256 endRound;
    uint256 threshold;
    bool allApps;
    uint256 totalPrize;
    uint256 nextFinalizeIndex;
    uint256 bestScore;
    uint256 bestCount;
    uint256 qualifiedCount;
    uint256 payoutsClaimed;
    address[] participants;
    address[] invited;
    address[] declined;
    bytes32[] appIds;
  }

  struct ChallengeView {
    uint256 challengeId;
    ChallengeKind kind;
    ChallengeVisibility visibility;
    ThresholdMode thresholdMode;
    ChallengeStatus status;
    SettlementMode settlementMode;
    address creator;
    uint256 stakeAmount;
    uint256 startRound;
    uint256 endRound;
    uint256 duration;
    uint256 threshold;
    bool allApps;
    uint256 totalPrize;
    uint256 participantCount;
    uint256 invitedCount;
    uint256 declinedCount;
    uint256 selectedAppsCount;
    uint256 nextFinalizeIndex;
    uint256 bestScore;
    uint256 bestCount;
    uint256 qualifiedCount;
    uint256 payoutsClaimed;
  }
}
