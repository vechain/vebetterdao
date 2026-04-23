// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IChallenges } from "./interfaces/IChallenges.sol";
import { IB3TR } from "./interfaces/IB3TR.sol";
import { IVeBetterPassport } from "./interfaces/IVeBetterPassport.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";
import { IX2EarnApps } from "./interfaces/IX2EarnApps.sol";
import { ChallengeCoreLogic } from "./challenges/libraries/ChallengeCoreLogic.sol";
import { ChallengeSettlementLogic } from "./challenges/libraries/ChallengeSettlementLogic.sol";
import { ChallengeStorageTypes } from "./challenges/libraries/ChallengeStorageTypes.sol";
import { ChallengeTypes } from "./challenges/libraries/ChallengeTypes.sol";

/// @title B3TRChallenges
/// @notice Upgradeable entrypoint for creating, joining, settling, and administering B3TR challenges.
/// @dev This contract owns storage, roles, and external access control while delegating challenge lifecycle and
/// settlement logic to dedicated libraries. NatSpec for the external API is inherited from `IChallenges`.
contract B3TRChallenges is IChallenges, AccessControlUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  bytes32 public constant CONTRACTS_ADDRESS_MANAGER_ROLE = keccak256("CONTRACTS_ADDRESS_MANAGER_ROLE");
  bytes32 public constant SETTINGS_MANAGER_ROLE = keccak256("SETTINGS_MANAGER_ROLE");

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @inheritdoc IChallenges
  function initialize(
    ChallengeTypes.InitializationData calldata data,
    ChallengeTypes.InitializationRoleData calldata roles
  ) external initializer {
    if (
      roles.admin == address(0) ||
      roles.upgrader == address(0) ||
      roles.contractsAddressManager == address(0) ||
      roles.settingsManager == address(0) ||
      data.b3trAddress == address(0) ||
      data.veBetterPassportAddress == address(0) ||
      data.xAllocationVotingAddress == address(0) ||
      data.x2EarnAppsAddress == address(0)
    ) {
      revert ZeroAddress();
    }
    if (
      data.maxChallengeDuration == 0 ||
      data.maxSelectedApps == 0 ||
      data.maxParticipants == 0 ||
      data.minBetAmount == 0
    ) revert InvalidAmount();

    __AccessControl_init();
    __ReentrancyGuard_init();
    __UUPSUpgradeable_init();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    $.maxChallengeDuration = data.maxChallengeDuration;
    $.maxSelectedApps = data.maxSelectedApps;
    $.maxParticipants = data.maxParticipants;
    _setMinBetAmount(data.minBetAmount);

    // Emit updates so event-driven indexers can capture initial settings without extra contract calls.
    emit MaxChallengeDurationUpdated(0, data.maxChallengeDuration);
    emit MaxSelectedAppsUpdated(0, data.maxSelectedApps);
    emit MaxParticipantsUpdated(0, data.maxParticipants);

    _initializeAddresses(
      data.b3trAddress,
      data.veBetterPassportAddress,
      data.xAllocationVotingAddress,
      data.x2EarnAppsAddress
    );
    _initializeRoles(roles.admin, roles.upgrader, roles.contractsAddressManager, roles.settingsManager);
  }

  modifier onlyRoleOrAdmin(bytes32 role) {
    if (!hasRole(role, msg.sender) && !hasRole(DEFAULT_ADMIN_ROLE, msg.sender)) {
      revert ChallengesUnauthorizedUser(msg.sender);
    }
    _;
  }

  function _authorizeUpgrade(address) internal override onlyRole(UPGRADER_ROLE) {}

  /// @inheritdoc IChallenges
  function version() external pure returns (string memory) {
    return "1";
  }

  /// @inheritdoc IChallenges
  function challengeCount() external view returns (uint256) {
    return ChallengeStorageTypes.getChallengesStorage().challengeCount;
  }

  /// @inheritdoc IChallenges
  function maxChallengeDuration() external view returns (uint256) {
    return ChallengeStorageTypes.getChallengesStorage().maxChallengeDuration;
  }

  /// @inheritdoc IChallenges
  function maxSelectedApps() external view returns (uint256) {
    return ChallengeStorageTypes.getChallengesStorage().maxSelectedApps;
  }

  /// @inheritdoc IChallenges
  function maxParticipants() external view returns (uint256) {
    return ChallengeStorageTypes.getChallengesStorage().maxParticipants;
  }

  /// @inheritdoc IChallenges
  function minBetAmount() external view returns (uint256) {
    return ChallengeStorageTypes.getChallengesStorage().minBetAmount;
  }

  /// @inheritdoc IChallenges
  function getChallenge(uint256 challengeId) external view returns (ChallengeTypes.ChallengeView memory) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);

    ChallengeTypes.Challenge storage challenge = $.challenges[challengeId];
    uint256 duration = challenge.endRound - challenge.startRound + 1;

    return ChallengeTypes.ChallengeView({
      challengeId: challengeId,
      kind: challenge.kind,
      visibility: challenge.visibility,
      challengeType: challenge.challengeType,
      status: ChallengeTypes.ChallengeStatus(ChallengeCoreLogic.getComputedStatus(challengeId)),
      settlementMode: challenge.settlementMode,
      creator: challenge.creator,
      stakeAmount: challenge.stakeAmount,
      startRound: challenge.startRound,
      endRound: challenge.endRound,
      duration: duration,
      threshold: challenge.threshold,
      numWinners: challenge.numWinners,
      winnersClaimed: challenge.winners.length,
      prizePerWinner: challenge.prizePerWinner,
      allApps: challenge.allApps,
      totalPrize: challenge.totalPrize,
      participantCount: challenge.participants.length,
      invitedCount: challenge.invited.length,
      declinedCount: challenge.declined.length,
      selectedAppsCount: challenge.appIds.length,
      winnersCount: challenge.winners.length,
      bestScore: challenge.bestScore,
      bestCount: challenge.bestCount,
      payoutsClaimed: challenge.payoutsClaimed,
      title: challenge.title,
      description: challenge.description,
      imageURI: challenge.imageURI,
      metadataURI: challenge.metadataURI
    });
  }

  /// @inheritdoc IChallenges
  function getChallengeStatus(uint256 challengeId) external view returns (ChallengeTypes.ChallengeStatus) {
    return ChallengeTypes.ChallengeStatus(ChallengeCoreLogic.getComputedStatus(challengeId));
  }

  /// @inheritdoc IChallenges
  function getChallengeParticipants(uint256 challengeId) external view returns (address[] memory) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.challenges[challengeId].participants;
  }

  /// @inheritdoc IChallenges
  function getChallengeInvited(uint256 challengeId) external view returns (address[] memory) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.challenges[challengeId].invited;
  }

  /// @inheritdoc IChallenges
  function getChallengeDeclined(uint256 challengeId) external view returns (address[] memory) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.challenges[challengeId].declined;
  }

  /// @inheritdoc IChallenges
  function getChallengeSelectedApps(uint256 challengeId) external view returns (bytes32[] memory) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.challenges[challengeId].appIds;
  }

  /// @inheritdoc IChallenges
  function getChallengeWinners(uint256 challengeId) external view returns (address[] memory) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.challenges[challengeId].winners;
  }

  /// @inheritdoc IChallenges
  function getParticipantStatus(
    uint256 challengeId,
    address account
  ) external view returns (ChallengeTypes.ParticipantStatus) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.participantStatus[challengeId][account];
  }

  /// @inheritdoc IChallenges
  function isInvitationEligible(uint256 challengeId, address account) external view returns (bool) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.invitationEligible[challengeId][account];
  }

  /// @inheritdoc IChallenges
  function isSplitWinWinner(uint256 challengeId, address account) external view returns (bool) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.isSplitWinWinner[challengeId][account];
  }

  /// @inheritdoc IChallenges
  function getParticipantActions(uint256 challengeId, address participant) external view returns (uint256) {
    return ChallengeSettlementLogic.getParticipantActions(challengeId, participant);
  }

  /// @inheritdoc IChallenges
  function createChallenge(ChallengeTypes.CreateChallengeParams calldata params) external nonReentrant returns (uint256) {
    return ChallengeCoreLogic.createChallenge(params);
  }

  /// @inheritdoc IChallenges
  function addInvites(uint256 challengeId, address[] calldata invitees) external nonReentrant {
    ChallengeCoreLogic.addInvites(challengeId, invitees);
  }

  /// @inheritdoc IChallenges
  function joinChallenge(uint256 challengeId) external nonReentrant {
    ChallengeCoreLogic.joinChallenge(challengeId);
  }

  /// @inheritdoc IChallenges
  function leaveChallenge(uint256 challengeId) external nonReentrant {
    ChallengeCoreLogic.leaveChallenge(challengeId);
  }

  /// @inheritdoc IChallenges
  function declineChallenge(uint256 challengeId) external nonReentrant {
    ChallengeCoreLogic.declineChallenge(challengeId);
  }

  /// @inheritdoc IChallenges
  function cancelChallenge(uint256 challengeId) external nonReentrant {
    ChallengeCoreLogic.cancelChallenge(challengeId);
  }

  /// @inheritdoc IChallenges
  function syncChallenge(uint256 challengeId) external nonReentrant returns (ChallengeTypes.ChallengeStatus) {
    return ChallengeTypes.ChallengeStatus(ChallengeCoreLogic.syncChallenge(challengeId));
  }

  /// @inheritdoc IChallenges
  function completeChallenge(uint256 challengeId) external nonReentrant {
    ChallengeSettlementLogic.completeChallenge(challengeId);
  }

  /// @inheritdoc IChallenges
  function claimChallengePayout(uint256 challengeId) external nonReentrant returns (uint256) {
    return ChallengeSettlementLogic.claimChallengePayout(challengeId);
  }

  /// @inheritdoc IChallenges
  function claimSplitWinPrize(uint256 challengeId) external nonReentrant returns (uint256) {
    return ChallengeSettlementLogic.claimSplitWinPrize(challengeId);
  }

  /// @inheritdoc IChallenges
  function claimCreatorSplitWinRefund(uint256 challengeId) external nonReentrant returns (uint256) {
    return ChallengeSettlementLogic.claimCreatorSplitWinRefund(challengeId);
  }

  /// @inheritdoc IChallenges
  function claimChallengeRefund(uint256 challengeId) external nonReentrant returns (uint256) {
    return ChallengeSettlementLogic.claimChallengeRefund(challengeId);
  }

  /// @inheritdoc IChallenges
  function withdraw(address to, uint256 amount) external nonReentrant onlyRoleOrAdmin(DEFAULT_ADMIN_ROLE) {
    if (to == address(0)) revert ZeroAddress();
    if (amount == 0) revert InvalidAmount();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    uint256 available = $.b3tr.balanceOf(address(this));
    if (amount > available) revert InsufficientWithdrawableFunds(available, amount);

    if (!$.b3tr.transfer(to, amount)) revert TransferFailed();

    emit AdminWithdrawal(msg.sender, to, amount);
  }

  /// @inheritdoc IChallenges
  function setB3TRAddress(address newAddress) external nonReentrant onlyRoleOrAdmin(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    _setB3TRAddress(newAddress);
  }

  /// @inheritdoc IChallenges
  function setVeBetterPassportAddress(address newAddress) external nonReentrant onlyRoleOrAdmin(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    _setVeBetterPassportAddress(newAddress);
  }

  /// @inheritdoc IChallenges
  function setXAllocationVotingAddress(address newAddress) external nonReentrant onlyRoleOrAdmin(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    _setXAllocationVotingAddress(newAddress);
  }

  /// @inheritdoc IChallenges
  function setX2EarnAppsAddress(address newAddress) external nonReentrant onlyRoleOrAdmin(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    _setX2EarnAppsAddress(newAddress);
  }

  /// @inheritdoc IChallenges
  function setMaxChallengeDuration(uint256 newValue) external nonReentrant onlyRoleOrAdmin(SETTINGS_MANAGER_ROLE) {
    if (newValue == 0) revert InvalidAmount();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    uint256 oldValue = $.maxChallengeDuration;
    $.maxChallengeDuration = newValue;

    emit MaxChallengeDurationUpdated(oldValue, newValue);
  }

  /// @inheritdoc IChallenges
  function setMaxSelectedApps(uint256 newValue) external nonReentrant onlyRoleOrAdmin(SETTINGS_MANAGER_ROLE) {
    if (newValue == 0) revert InvalidAmount();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    uint256 oldValue = $.maxSelectedApps;
    $.maxSelectedApps = newValue;

    emit MaxSelectedAppsUpdated(oldValue, newValue);
  }

  /// @inheritdoc IChallenges
  function setMaxParticipants(uint256 newValue) external nonReentrant onlyRoleOrAdmin(SETTINGS_MANAGER_ROLE) {
    if (newValue == 0) revert InvalidAmount();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    uint256 oldValue = $.maxParticipants;
    $.maxParticipants = newValue;

    emit MaxParticipantsUpdated(oldValue, newValue);
  }

  /// @inheritdoc IChallenges
  function setMinBetAmount(uint256 newValue) external nonReentrant onlyRoleOrAdmin(SETTINGS_MANAGER_ROLE) {
    _setMinBetAmount(newValue);
  }

  function _setB3TRAddress(address newAddress) private {
    if (newAddress == address(0)) revert ZeroAddress();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    address oldAddress = address($.b3tr);
    $.b3tr = IB3TR(newAddress);

    emit B3TRAddressUpdated(oldAddress, newAddress);
  }

  function _setVeBetterPassportAddress(address newAddress) private {
    if (newAddress == address(0)) revert ZeroAddress();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    address oldAddress = address($.veBetterPassport);
    $.veBetterPassport = IVeBetterPassport(newAddress);

    emit VeBetterPassportAddressUpdated(oldAddress, newAddress);
  }

  function _setXAllocationVotingAddress(address newAddress) private {
    if (newAddress == address(0)) revert ZeroAddress();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    address oldAddress = address($.xAllocationVoting);
    $.xAllocationVoting = IXAllocationVotingGovernor(newAddress);

    emit XAllocationVotingAddressUpdated(oldAddress, newAddress);
  }

  function _setX2EarnAppsAddress(address newAddress) private {
    if (newAddress == address(0)) revert ZeroAddress();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    address oldAddress = address($.x2EarnApps);
    $.x2EarnApps = IX2EarnApps(newAddress);

    emit X2EarnAppsAddressUpdated(oldAddress, newAddress);
  }

  function _setMinBetAmount(uint256 newValue) private {
    if (newValue == 0) revert InvalidAmount();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    uint256 oldValue = $.minBetAmount;
    $.minBetAmount = newValue;

    emit MinBetAmountUpdated(oldValue, newValue);
  }

  function _initializeAddresses(
    address b3trAddress,
    address veBetterPassportAddress,
    address xAllocationVotingAddress,
    address x2EarnAppsAddress
  ) private {
    _setB3TRAddress(b3trAddress);
    _setVeBetterPassportAddress(veBetterPassportAddress);
    _setXAllocationVotingAddress(xAllocationVotingAddress);
    _setX2EarnAppsAddress(x2EarnAppsAddress);
  }

  function _initializeRoles(
    address admin,
    address upgrader,
    address contractsAddressManager,
    address settingsManager
  ) private {
    _grantRole(DEFAULT_ADMIN_ROLE, admin);
    _grantRole(UPGRADER_ROLE, upgrader);
    _grantRole(CONTRACTS_ADDRESS_MANAGER_ROLE, contractsAddressManager);
    _grantRole(SETTINGS_MANAGER_ROLE, settingsManager);
  }

  function _ensureChallengeExists(uint256 challengeId, uint256 challengeCount_) private pure {
    if (challengeId == 0 || challengeId > challengeCount_) revert ChallengeDoesNotExist(challengeId);
  }
}
