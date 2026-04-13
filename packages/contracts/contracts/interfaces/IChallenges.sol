// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { ChallengeTypes } from "../challenges/libraries/ChallengeTypes.sol";

interface IChallenges {
  error ZeroAddress();
  error InvalidAmount();
  error BetAmountBelowMinimum(uint256 provided, uint256 minimum);
  error InvalidStartRound(uint256 startRound, uint256 currentRound);
  error InvalidEndRound(uint256 startRound, uint256 endRound);
  error InvalidThresholdConfiguration();
  error TitleTooLong(uint256 provided, uint256 maximum);
  error DescriptionTooLong(uint256 provided, uint256 maximum);
  error ImageURITooLong(uint256 provided, uint256 maximum);
  error MetadataURITooLong(uint256 provided, uint256 maximum);
  error MaxChallengeDurationExceeded(uint256 provided, uint256 maximum);
  error MaxSelectedAppsExceeded(uint256 provided, uint256 maximum);
  error MaxParticipantsExceeded(uint256 provided, uint256 maximum);
  error ChallengeDoesNotExist(uint256 challengeId);
  error ChallengeUnknownApp(bytes32 appId);
  error DuplicateApp(bytes32 appId);
  error ChallengeNotPending(uint256 challengeId);
  error ChallengeNotEnded(uint256 challengeId, uint256 endRound, uint256 currentRound);
  error ChallengeAlreadyFinalized(uint256 challengeId);
  error ChallengeInvalidStatus(uint256 challengeId, ChallengeTypes.ChallengeStatus status);
  error CreatorCannotJoin(uint256 challengeId);
  error CreatorCannotLeave(uint256 challengeId);
  error AlreadyParticipating(uint256 challengeId, address participant);
  error NotParticipating(uint256 challengeId, address participant);
  error NotInvited(uint256 challengeId, address participant);
  error NothingToClaim(uint256 challengeId, address account);
  error NothingToRefund(uint256 challengeId, address account);
  error AlreadyClaimed(uint256 challengeId, address account);
  error AlreadyRefunded(uint256 challengeId, address account);
  error AlreadyInvited(uint256 challengeId, address invitee);
  error TransferFailed();
  error InsufficientWithdrawableFunds(uint256 available, uint256 requested);
  error ChallengesUnauthorizedUser(address user);

  event B3TRAddressUpdated(address indexed oldAddress, address indexed newAddress);
  event VeBetterPassportAddressUpdated(address indexed oldAddress, address indexed newAddress);
  event XAllocationVotingAddressUpdated(address indexed oldAddress, address indexed newAddress);
  event X2EarnAppsAddressUpdated(address indexed oldAddress, address indexed newAddress);
  event MaxChallengeDurationUpdated(uint256 oldValue, uint256 newValue);
  event MaxSelectedAppsUpdated(uint256 oldValue, uint256 newValue);
  event MaxParticipantsUpdated(uint256 oldValue, uint256 newValue);
  event MinBetAmountUpdated(uint256 oldValue, uint256 newValue);
  event AdminWithdrawal(address indexed admin, address indexed recipient, uint256 amount);

  function initialize(
    ChallengeTypes.InitializationData calldata data,
    ChallengeTypes.InitializationRoleData calldata roles
  ) external;

  function version() external pure returns (string memory);

  function challengeCount() external view returns (uint256);

  function maxChallengeDuration() external view returns (uint256);

  function maxSelectedApps() external view returns (uint256);

  function maxParticipants() external view returns (uint256);

  function minBetAmount() external view returns (uint256);

  function getChallenge(uint256 challengeId) external view returns (ChallengeTypes.ChallengeView memory);

  function getChallengeStatus(uint256 challengeId) external view returns (ChallengeTypes.ChallengeStatus);

  function getChallengeParticipants(uint256 challengeId) external view returns (address[] memory);

  function getChallengeInvited(uint256 challengeId) external view returns (address[] memory);

  function getChallengeDeclined(uint256 challengeId) external view returns (address[] memory);

  function getChallengeSelectedApps(uint256 challengeId) external view returns (bytes32[] memory);

  function getParticipantStatus(
    uint256 challengeId,
    address account
  ) external view returns (ChallengeTypes.ParticipantStatus);

  function isInvitationEligible(uint256 challengeId, address account) external view returns (bool);

  function getParticipantActions(uint256 challengeId, address participant) external view returns (uint256);

  function createChallenge(ChallengeTypes.CreateChallengeParams calldata params) external returns (uint256);

  function addInvites(uint256 challengeId, address[] calldata invitees) external;

  function joinChallenge(uint256 challengeId) external;

  function leaveChallenge(uint256 challengeId) external;

  function declineChallenge(uint256 challengeId) external;

  function cancelChallenge(uint256 challengeId) external;

  function syncChallenge(uint256 challengeId) external returns (ChallengeTypes.ChallengeStatus);

  function finalizeChallenge(uint256 challengeId) external;

  function claimChallengePayout(uint256 challengeId) external returns (uint256);

  function claimChallengeRefund(uint256 challengeId) external returns (uint256);

  function withdraw(address to, uint256 amount) external;

  function setB3TRAddress(address newAddress) external;

  function setVeBetterPassportAddress(address newAddress) external;

  function setXAllocationVotingAddress(address newAddress) external;

  function setX2EarnAppsAddress(address newAddress) external;

  function setMaxChallengeDuration(uint256 newValue) external;

  function setMaxSelectedApps(uint256 newValue) external;

  function setMaxParticipants(uint256 newValue) external;

  function setMinBetAmount(uint256 newValue) external;
}
