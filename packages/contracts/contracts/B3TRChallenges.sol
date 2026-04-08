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

contract B3TRChallenges is IChallenges, AccessControlUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  bytes32 public constant CONTRACTS_ADDRESS_MANAGER_ROLE = keccak256("CONTRACTS_ADDRESS_MANAGER_ROLE");
  bytes32 public constant SETTINGS_MANAGER_ROLE = keccak256("SETTINGS_MANAGER_ROLE");

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

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
    if (data.maxChallengeDuration == 0 || data.maxSelectedApps == 0 || data.maxParticipants == 0) revert InvalidAmount();

    __AccessControl_init();
    __ReentrancyGuard_init();
    __UUPSUpgradeable_init();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    $.maxChallengeDuration = data.maxChallengeDuration;
    $.maxSelectedApps = data.maxSelectedApps;
    $.maxParticipants = data.maxParticipants;

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

  function version() external pure returns (string memory) {
    return "1";
  }

  function challengeCount() external view returns (uint256) {
    return ChallengeStorageTypes.getChallengesStorage().challengeCount;
  }

  function maxChallengeDuration() external view returns (uint256) {
    return ChallengeStorageTypes.getChallengesStorage().maxChallengeDuration;
  }

  function maxSelectedApps() external view returns (uint256) {
    return ChallengeStorageTypes.getChallengesStorage().maxSelectedApps;
  }

  function maxParticipants() external view returns (uint256) {
    return ChallengeStorageTypes.getChallengesStorage().maxParticipants;
  }

  function getChallenge(uint256 challengeId) external view returns (ChallengeTypes.ChallengeView memory) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);

    ChallengeTypes.Challenge storage challenge = $.challenges[challengeId];
    uint256 duration = challenge.endRound - challenge.startRound + 1;

    return ChallengeTypes.ChallengeView({
      challengeId: challengeId,
      kind: challenge.kind,
      visibility: challenge.visibility,
      thresholdMode: challenge.thresholdMode,
      status: ChallengeCoreLogic.getComputedStatus(challengeId),
      settlementMode: challenge.settlementMode,
      creator: challenge.creator,
      stakeAmount: challenge.stakeAmount,
      startRound: challenge.startRound,
      endRound: challenge.endRound,
      duration: duration,
      threshold: challenge.threshold,
      allApps: challenge.allApps,
      totalPrize: challenge.totalPrize,
      participantCount: challenge.participants.length,
      invitedCount: challenge.invited.length,
      declinedCount: challenge.declined.length,
      selectedAppsCount: challenge.appIds.length,
      bestScore: challenge.bestScore,
      bestCount: challenge.bestCount,
      qualifiedCount: challenge.qualifiedCount,
      payoutsClaimed: challenge.payoutsClaimed
    });
  }

  function getChallengeStatus(uint256 challengeId) external view returns (ChallengeTypes.ChallengeStatus) {
    return ChallengeCoreLogic.getComputedStatus(challengeId);
  }

  function getChallengeParticipants(uint256 challengeId) external view returns (address[] memory) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.challenges[challengeId].participants;
  }

  function getChallengeInvited(uint256 challengeId) external view returns (address[] memory) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.challenges[challengeId].invited;
  }

  function getChallengeDeclined(uint256 challengeId) external view returns (address[] memory) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.challenges[challengeId].declined;
  }

  function getChallengeSelectedApps(uint256 challengeId) external view returns (bytes32[] memory) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.challenges[challengeId].appIds;
  }

  function getParticipantStatus(
    uint256 challengeId,
    address account
  ) external view returns (ChallengeTypes.ParticipantStatus) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.participantStatus[challengeId][account];
  }

  function isInvitationEligible(uint256 challengeId, address account) external view returns (bool) {
    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    _ensureChallengeExists(challengeId, $.challengeCount);
    return $.invitationEligible[challengeId][account];
  }

  function getParticipantActions(uint256 challengeId, address participant) external view returns (uint256) {
    return ChallengeSettlementLogic.getParticipantActions(challengeId, participant);
  }

  function createChallenge(ChallengeTypes.CreateChallengeParams calldata params) external nonReentrant returns (uint256) {
    return ChallengeCoreLogic.createChallenge(params);
  }

  function addInvites(uint256 challengeId, address[] calldata invitees) external nonReentrant {
    ChallengeCoreLogic.addInvites(challengeId, invitees);
  }

  function joinChallenge(uint256 challengeId) external nonReentrant {
    ChallengeCoreLogic.joinChallenge(challengeId);
  }

  function leaveChallenge(uint256 challengeId) external nonReentrant {
    ChallengeCoreLogic.leaveChallenge(challengeId);
  }

  function declineChallenge(uint256 challengeId) external nonReentrant {
    ChallengeCoreLogic.declineChallenge(challengeId);
  }

  function cancelChallenge(uint256 challengeId) external nonReentrant {
    ChallengeCoreLogic.cancelChallenge(challengeId);
  }

  function syncChallenge(uint256 challengeId) external nonReentrant returns (ChallengeTypes.ChallengeStatus) {
    return ChallengeCoreLogic.syncChallenge(challengeId);
  }

  function finalizeChallenge(uint256 challengeId) external nonReentrant {
    ChallengeSettlementLogic.finalizeChallenge(challengeId);
  }

  function claimChallengePayout(uint256 challengeId) external nonReentrant returns (uint256) {
    return ChallengeSettlementLogic.claimChallengePayout(challengeId);
  }

  function claimChallengeRefund(uint256 challengeId) external nonReentrant returns (uint256) {
    return ChallengeSettlementLogic.claimChallengeRefund(challengeId);
  }

  /// @notice Withdraws B3TR from the contract.
  /// @dev Emergency admin function that can drain any B3TR held by the contract.
  /// @param to Recipient of the withdrawn B3TR.
  /// @param amount Amount of B3TR to withdraw.
  function withdraw(address to, uint256 amount) external nonReentrant onlyRoleOrAdmin(DEFAULT_ADMIN_ROLE) {
    if (to == address(0)) revert ZeroAddress();
    if (amount == 0) revert InvalidAmount();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    uint256 available = $.b3tr.balanceOf(address(this));
    if (amount > available) revert InsufficientWithdrawableFunds(available, amount);

    if (!$.b3tr.transfer(to, amount)) revert TransferFailed();

    emit AdminWithdrawal(msg.sender, to, amount);
  }

  function setB3TRAddress(address newAddress) external nonReentrant onlyRoleOrAdmin(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    _setB3TRAddress(newAddress);
  }

  function setVeBetterPassportAddress(address newAddress) external nonReentrant onlyRoleOrAdmin(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    _setVeBetterPassportAddress(newAddress);
  }

  function setXAllocationVotingAddress(address newAddress) external nonReentrant onlyRoleOrAdmin(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    _setXAllocationVotingAddress(newAddress);
  }

  function setX2EarnAppsAddress(address newAddress) external nonReentrant onlyRoleOrAdmin(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    _setX2EarnAppsAddress(newAddress);
  }

  function setMaxChallengeDuration(uint256 newValue) external nonReentrant onlyRoleOrAdmin(SETTINGS_MANAGER_ROLE) {
    if (newValue == 0) revert InvalidAmount();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    uint256 oldValue = $.maxChallengeDuration;
    $.maxChallengeDuration = newValue;

    emit MaxChallengeDurationUpdated(oldValue, newValue);
  }

  function setMaxSelectedApps(uint256 newValue) external nonReentrant onlyRoleOrAdmin(SETTINGS_MANAGER_ROLE) {
    if (newValue == 0) revert InvalidAmount();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    uint256 oldValue = $.maxSelectedApps;
    $.maxSelectedApps = newValue;

    emit MaxSelectedAppsUpdated(oldValue, newValue);
  }

  function setMaxParticipants(uint256 newValue) external nonReentrant onlyRoleOrAdmin(SETTINGS_MANAGER_ROLE) {
    if (newValue == 0) revert InvalidAmount();

    ChallengeStorageTypes.ChallengesStorage storage $ = ChallengeStorageTypes.getChallengesStorage();
    uint256 oldValue = $.maxParticipants;
    $.maxParticipants = newValue;

    emit MaxParticipantsUpdated(oldValue, newValue);
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
