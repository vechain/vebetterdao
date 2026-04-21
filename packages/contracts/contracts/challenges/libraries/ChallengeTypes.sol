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

  /// @notice Discriminates the two challenge mechanics.
  /// - `MaxActions`: capped participant pool, top scorer wins after completion.
  /// - `SplitWin`: uncapped participants, sponsored only, first-to-claim wins one of `numWinners` slots.
  enum ChallengeType {
    MaxActions,
    SplitWin
  }

  enum ChallengeStatus {
    Pending,
    Active,
    Completed,
    Cancelled,
    Invalid
  }

  enum SettlementMode {
    None,
    TopWinners,
    CreatorRefund,
    SplitWinCompleted
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
    ChallengeType challengeType;
    uint256 stakeAmount;
    uint256 startRound;
    uint256 endRound;
    uint256 threshold;
    uint256 numWinners;
    bytes32[] appIds;
    address[] invitees;
    string title;
    string description;
    string imageURI;
    string metadataURI;
  }

  struct InitializationData {
    address b3trAddress;
    address veBetterPassportAddress;
    address xAllocationVotingAddress;
    address x2EarnAppsAddress;
    uint256 maxChallengeDuration;
    uint256 maxSelectedApps;
    uint256 maxParticipants;
    uint256 minBetAmount;
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
    ChallengeType challengeType;
    ChallengeStatus status;
    SettlementMode settlementMode;
    address creator;
    uint256 stakeAmount;
    uint256 startRound;
    uint256 endRound;
    uint256 threshold;
    uint256 numWinners;
    uint256 winnersClaimed;
    uint256 prizePerWinner;
    bool allApps;
    uint256 totalPrize;
    uint256 bestScore;
    uint256 bestCount;
    uint256 payoutsClaimed;
    address[] participants;
    address[] invited;
    address[] declined;
    address[] winners;
    bytes32[] appIds;
    string title;
    string description;
    string imageURI;
    string metadataURI;
  }

  struct ChallengeView {
    uint256 challengeId;
    ChallengeKind kind;
    ChallengeVisibility visibility;
    ChallengeType challengeType;
    ChallengeStatus status;
    SettlementMode settlementMode;
    address creator;
    uint256 stakeAmount;
    uint256 startRound;
    uint256 endRound;
    uint256 duration;
    uint256 threshold;
    uint256 numWinners;
    uint256 winnersClaimed;
    uint256 prizePerWinner;
    bool allApps;
    uint256 totalPrize;
    uint256 participantCount;
    uint256 invitedCount;
    uint256 declinedCount;
    uint256 selectedAppsCount;
    uint256 winnersCount;
    uint256 bestScore;
    uint256 bestCount;
    uint256 payoutsClaimed;
    string title;
    string description;
    string imageURI;
    string metadataURI;
  }
}
