// SPDX-License-Identifier: MIT

//                                      #######
//                                 ################
//                               ####################
//                             ###########   #########
//                            #########      #########
//          #######          #########       #########
//          #########       #########      ##########
//           ##########     ########     ####################
//            ##########   #########  #########################
//              ################### ############################
//               #################  ##########          ########
//                 ##############      ###              ########
//                  ############                       #########
//                    ##########                     ##########
//                     ########                    ###########
//                       ###                    ############
//                                          ##############
//                                    #################
//                                   ##############
//                                   #########

pragma solidity 0.8.20;

import { Initializable } from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import { AccessControlUpgradeable } from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import { UUPSUpgradeable } from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { ReentrancyGuardUpgradeable } from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

import { IXAllocationVotingGovernor } from "../interfaces/IXAllocationVotingGovernor.sol";
import { INavigatorRegistry } from "../interfaces/INavigatorRegistry.sol";
import { IVOT3 } from "../interfaces/IVOT3.sol";

import { NavigatorStorageTypes } from "./libraries/NavigatorStorageTypes.sol";
import { NavigatorStakingUtils } from "./libraries/NavigatorStakingUtils.sol";
import { NavigatorDelegationUtils } from "./libraries/NavigatorDelegationUtils.sol";
import { NavigatorVotingUtils } from "./libraries/NavigatorVotingUtils.sol";
import { NavigatorFeeUtils } from "./libraries/NavigatorFeeUtils.sol";
import { NavigatorSlashingUtils } from "./libraries/NavigatorSlashingUtils.sol";
import { NavigatorLifecycleUtils } from "./libraries/NavigatorLifecycleUtils.sol";

/**
 * @title NavigatorRegistry
 * @notice Manages the Navigator delegation system for VeBetterDAO.
 * Navigators are professional voting delegates who stake B3TR to vote on behalf of citizens.
 *
 * @dev Architecture:
 * - Upgradeable via UUPS proxy pattern
 * - Logic split into 6 external libraries for contract size optimization
 * - Single ERC-7201 namespaced storage
 * - Role-based access control (GOVERNANCE_ROLE, UPGRADER_ROLE)
 *
 * Key features:
 * - Permissionless navigator registration with B3TR staking
 * - Citizens delegate specific VOT3 amounts to navigators
 * - Navigators set allocation preferences and governance decisions
 * - 20% fee on citizen rewards, locked for 4 rounds
 * - Automatic minor slashing for negligence, governance-driven major slashing
 * - Exit process with notice period
 */
contract NavigatorRegistry is Initializable, INavigatorRegistry, AccessControlUpgradeable, UUPSUpgradeable, ReentrancyGuardUpgradeable {
  bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  uint256 public constant BASIS_POINTS = 10000;

  // ======================== Modifiers ======================== //

  /// @dev Reverts if caller is not a registered, active navigator
  modifier onlyNavigator() {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    require($.isRegistered[_msgSender()] && !$.isDeactivated[_msgSender()], "NavigatorRegistry: not a navigator");
    _;
  }

  // ======================== Initialization ======================== //

  struct InitParams {
    address admin;
    address upgrader;
    address governance;
    address b3trToken;
    address vot3Token;
    address treasury;
    uint256 minStake;
    uint256 maxStakePercentage;
    uint256 feeLockPeriod;
    uint256 feePercentage;
    uint256 exitNoticePeriod;
    uint256 reportInterval;
    uint256 minorSlashPercentage;
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(InitParams calldata params) public initializer {
    require(params.admin != address(0), "NavigatorRegistry: admin is zero");
    require(params.b3trToken != address(0), "NavigatorRegistry: b3tr is zero");
    require(params.vot3Token != address(0), "NavigatorRegistry: vot3 is zero");
    require(params.treasury != address(0), "NavigatorRegistry: treasury is zero");

    __AccessControl_init();
    __UUPSUpgradeable_init();
    __ReentrancyGuard_init();

    _grantRole(DEFAULT_ADMIN_ROLE, params.admin);
    _grantRole(UPGRADER_ROLE, params.upgrader);
    _grantRole(GOVERNANCE_ROLE, params.governance);

    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    $.minStake = params.minStake;
    $.maxStakePercentage = params.maxStakePercentage;
    $.b3trToken = params.b3trToken;
    $.vot3Token = params.vot3Token;
    $.treasury = params.treasury;
    $.feeLockPeriod = params.feeLockPeriod;
    $.feePercentage = params.feePercentage;
    $.exitNoticePeriod = params.exitNoticePeriod;
    $.reportInterval = params.reportInterval;
    $.minorSlashPercentage = params.minorSlashPercentage;
  }

  // ======================== Navigator Registration & Staking ======================== //

  /// @notice Register as a navigator by staking B3TR (permissionless, must approve B3TR first)
  function register(uint256 amount, string calldata metadataURI) external nonReentrant {
    NavigatorStakingUtils.register(_msgSender(), amount, metadataURI);
  }

  /// @notice Add more B3TR to an existing navigator's stake
  function addStake(uint256 amount) external nonReentrant onlyNavigator {
    NavigatorStakingUtils.addStake(_msgSender(), amount);
  }

  /// @notice Withdraw staked B3TR (only after exit finalized or deactivation)
  function withdrawStake(uint256 amount) external nonReentrant {
    // No onlyNavigator — deactivated navigators also need to withdraw
    NavigatorStakingUtils.withdrawStake(_msgSender(), amount);
  }

  // ======================== Citizen Delegation ======================== //

  /// @notice Delegate VOT3 to a navigator
  function delegate(address navigator, uint256 amount) external nonReentrant {
    NavigatorDelegationUtils.delegate(_msgSender(), navigator, amount);
    // Lock the delegated VOT3 in citizen's wallet
    IVOT3(NavigatorStorageTypes.getNavigatorStorage().vot3Token).setNavigatorLockedAmount(_msgSender(), amount);
  }

  /// @notice Partially reduce delegation amount
  function reduceDelegation(uint256 reduceBy) external nonReentrant {
    NavigatorDelegationUtils.reduceDelegation(_msgSender(), reduceBy);
    // Update locked amount to reflect new delegation
    uint256 newAmount = NavigatorDelegationUtils.getDelegatedAmount(_msgSender());
    IVOT3(NavigatorStorageTypes.getNavigatorStorage().vot3Token).setNavigatorLockedAmount(_msgSender(), newAmount);
  }

  /// @notice Fully undelegate from the current navigator
  function undelegate() external nonReentrant {
    NavigatorDelegationUtils.undelegate(_msgSender());
    // Unlock all VOT3
    IVOT3(NavigatorStorageTypes.getNavigatorStorage().vot3Token).setNavigatorLockedAmount(_msgSender(), 0);
  }

  // ======================== Navigator Voting Decisions ======================== //

  /// @notice Set allocation voting preferences for a round (also navigator's own vote)
  function setAllocationPreferences(uint256 roundId, bytes32[] calldata appIds) external onlyNavigator {
    NavigatorVotingUtils.setAllocationPreferences(_msgSender(), roundId, appIds);
  }

  /// @notice Set governance proposal decision (1=Against, 2=For, 3=Abstain; also navigator's own vote)
  function setProposalDecision(uint256 proposalId, uint8 decision) external onlyNavigator {
    NavigatorVotingUtils.setProposalDecision(_msgSender(), proposalId, decision);
  }

  // ======================== Fee Management ======================== //

  /// @notice Deposit a navigator fee (called by VoterRewards during reward claim)
  /// @dev B3TR must already be transferred to this contract before calling.
  function depositNavigatorFee(address navigator, uint256 roundId, uint256 amount) external {
    NavigatorFeeUtils.depositFee(navigator, roundId, amount);
  }

  /// @notice Claim unlocked fees for a specific round
  function claimFee(uint256 roundId) external nonReentrant onlyNavigator {
    NavigatorFeeUtils.claimFee(_msgSender(), roundId, _getCurrentRound());
  }

  // ======================== Slashing Reports (anyone can call) ======================== //

  /// @notice Report navigator for missing allocation vote
  function reportMissedAllocationVote(address navigator, uint256 roundId) external {
    NavigatorSlashingUtils.reportMissedAllocationVote(navigator, roundId);
  }

  /// @notice Report navigator for missing governance proposal vote
  function reportMissedGovernanceVote(address navigator, uint256 proposalId) external {
    NavigatorSlashingUtils.reportMissedGovernanceVote(navigator, proposalId);
  }

  /// @notice Report navigator for stale allocation preferences (no update >= 3 rounds)
  function reportStalePreferences(address navigator, uint256 roundId) external {
    NavigatorSlashingUtils.reportStalePreferences(navigator, roundId);
  }

  /// @notice Report navigator for missing required report
  function reportMissedReport(address navigator, uint256 roundId) external {
    NavigatorSlashingUtils.reportMissedReport(navigator, roundId);
  }

  /// @notice Deactivate a navigator by governance (major infraction with slash)
  function deactivateNavigator(
    address navigator,
    uint256 slashPercentage,
    bool slashFees
  ) external onlyRole(GOVERNANCE_ROLE) {
    NavigatorSlashingUtils.majorSlash(navigator, slashPercentage, slashFees);
    NavigatorLifecycleUtils.deactivate(navigator);
  }

  // ======================== Lifecycle ======================== //

  /// @notice Announce intent to exit (starts notice period)
  function announceExit() external onlyNavigator {
    NavigatorLifecycleUtils.announceExit(_msgSender(), _getCurrentRound());
  }

  /// @notice Finalize exit after notice period
  function finalizeExit() external onlyNavigator {
    NavigatorLifecycleUtils.finalizeExit(_msgSender(), _getCurrentRound());
  }

  // ======================== Profile & Reports ======================== //

  /// @notice Update navigator metadata URI
  function setMetadataURI(string calldata uri) external onlyNavigator {
    NavigatorLifecycleUtils.setMetadataURI(_msgSender(), uri);
  }

  /// @notice Submit a periodic report
  function submitReport(string calldata reportURI) external onlyNavigator {
    NavigatorLifecycleUtils.submitReport(_msgSender(), _getCurrentRound(), reportURI);
  }

  // ======================== Governance Setters ======================== //

  function setMinStake(uint256 newMinStake) external onlyRole(GOVERNANCE_ROLE) {
    require(newMinStake > 0, "NavigatorRegistry: minStake must be > 0");
    NavigatorStorageTypes.getNavigatorStorage().minStake = newMinStake;
  }

  function setMaxStakePercentage(uint256 newPercentage) external onlyRole(GOVERNANCE_ROLE) {
    require(newPercentage > 0 && newPercentage <= BASIS_POINTS, "NavigatorRegistry: must be 1-10000");
    NavigatorStorageTypes.getNavigatorStorage().maxStakePercentage = newPercentage;
  }

  function setFeeLockPeriod(uint256 newPeriod) external onlyRole(GOVERNANCE_ROLE) {
    require(newPeriod > 0, "NavigatorRegistry: feeLockPeriod must be > 0");
    NavigatorStorageTypes.getNavigatorStorage().feeLockPeriod = newPeriod;
  }

  function setFeePercentage(uint256 newPercentage) external onlyRole(GOVERNANCE_ROLE) {
    require(newPercentage <= BASIS_POINTS, "NavigatorRegistry: feePercentage must be <= 10000");
    NavigatorStorageTypes.getNavigatorStorage().feePercentage = newPercentage;
  }

  function setExitNoticePeriod(uint256 newPeriod) external onlyRole(GOVERNANCE_ROLE) {
    require(newPeriod > 0, "NavigatorRegistry: exitNoticePeriod must be > 0");
    NavigatorStorageTypes.getNavigatorStorage().exitNoticePeriod = newPeriod;
  }

  function setReportInterval(uint256 newInterval) external onlyRole(GOVERNANCE_ROLE) {
    require(newInterval > 0, "NavigatorRegistry: reportInterval must be > 0");
    NavigatorStorageTypes.getNavigatorStorage().reportInterval = newInterval;
  }

  function setMinorSlashPercentage(uint256 newPercentage) external onlyRole(GOVERNANCE_ROLE) {
    require(newPercentage > 0 && newPercentage <= BASIS_POINTS, "NavigatorRegistry: must be 1-10000");
    NavigatorStorageTypes.getNavigatorStorage().minorSlashPercentage = newPercentage;
  }

  function setXAllocationVoting(address newAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(newAddress != address(0), "NavigatorRegistry: zero address");
    NavigatorStorageTypes.getNavigatorStorage().xAllocationVoting = newAddress;
  }

  function setRelayerRewardsPool(address newAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
    require(newAddress != address(0), "NavigatorRegistry: zero address");
    NavigatorStorageTypes.getNavigatorStorage().relayerRewardsPool = newAddress;
  }

  // ======================== View Functions ======================== //

  // -- Staking --
  function getStake(address navigator) external view returns (uint256) {
    return NavigatorStakingUtils.getStake(navigator);
  }

  function isNavigator(address account) external view returns (bool) {
    return NavigatorStakingUtils.isNavigator(account);
  }

  function canAcceptDelegations(address navigator) external view returns (bool) {
    return NavigatorStakingUtils.canAcceptDelegations(navigator);
  }

  function getDelegationCapacity(address navigator) external view returns (uint256) {
    return NavigatorStakingUtils.getDelegationCapacity(navigator);
  }

  function getRemainingCapacity(address navigator) external view returns (uint256) {
    return NavigatorStakingUtils.getRemainingCapacity(navigator);
  }

  function getMinStake() external view returns (uint256) {
    return NavigatorStakingUtils.getMinStake();
  }

  function getMaxStake() external view returns (uint256) {
    return NavigatorStakingUtils.getMaxStake();
  }

  // -- Delegation --
  function getNavigator(address citizen) external view returns (address) {
    return NavigatorDelegationUtils.getNavigator(citizen);
  }

  function getDelegatedAmount(address citizen) external view returns (uint256) {
    return NavigatorDelegationUtils.getDelegatedAmount(citizen);
  }

  function getTotalDelegated(address navigator) external view returns (uint256) {
    return NavigatorDelegationUtils.getTotalDelegated(navigator);
  }

  function getCitizens(address navigator) external view returns (address[] memory) {
    return NavigatorDelegationUtils.getCitizens(navigator);
  }

  function getCitizenCount(address navigator) external view returns (uint256) {
    return NavigatorDelegationUtils.getCitizenCount(navigator);
  }

  function isDelegated(address citizen) external view returns (bool) {
    return NavigatorDelegationUtils.isDelegated(citizen);
  }

  function getDelegatedAmountAtTimepoint(address citizen, uint256 timepoint) external view returns (uint256) {
    return NavigatorDelegationUtils.getDelegatedAmountAtTimepoint(citizen, timepoint);
  }

  // -- Voting --
  function getAllocationPreferences(address navigator, uint256 roundId) external view returns (bytes32[] memory) {
    return NavigatorVotingUtils.getAllocationPreferences(navigator, roundId);
  }

  function hasSetPreferences(address navigator, uint256 roundId) external view returns (bool) {
    return NavigatorVotingUtils.hasSetPreferences(navigator, roundId);
  }

  function getProposalDecision(address navigator, uint256 proposalId) external view returns (uint8) {
    return NavigatorVotingUtils.getProposalDecision(navigator, proposalId);
  }

  function hasSetDecision(address navigator, uint256 proposalId) external view returns (bool) {
    return NavigatorVotingUtils.hasSetDecision(navigator, proposalId);
  }

  // -- Fees --
  function getRoundFee(address navigator, uint256 roundId) external view returns (uint256) {
    return NavigatorFeeUtils.getRoundFee(navigator, roundId);
  }

  function getFeeLockPeriod() external view returns (uint256) {
    return NavigatorFeeUtils.getFeeLockPeriod();
  }

  function getFeePercentage() external view returns (uint256) {
    return NavigatorFeeUtils.getFeePercentage();
  }

  function isRoundFeeUnlocked(uint256 roundId) external view returns (bool) {
    return NavigatorFeeUtils.isRoundFeeUnlocked(roundId, _getCurrentRound());
  }

  // -- Slashing --
  function getTotalSlashed(address navigator) external view returns (uint256) {
    return NavigatorSlashingUtils.getTotalSlashed(navigator);
  }

  function getMinorSlashPercentage() external view returns (uint256) {
    return NavigatorSlashingUtils.getMinorSlashPercentage();
  }

  // -- Lifecycle --
  function isExiting(address navigator) external view returns (bool) {
    return NavigatorLifecycleUtils.isExiting(navigator);
  }

  function isExitReady(address navigator) external view returns (bool) {
    return NavigatorLifecycleUtils.isExitReady(navigator, _getCurrentRound());
  }

  function isDeactivated(address navigator) external view returns (bool) {
    return NavigatorLifecycleUtils.isDeactivated(navigator);
  }

  function getExitNoticePeriod() external view returns (uint256) {
    return NavigatorLifecycleUtils.getExitNoticePeriod();
  }

  function getReportInterval() external view returns (uint256) {
    return NavigatorLifecycleUtils.getReportInterval();
  }

  // -- Profile --
  function getMetadataURI(address navigator) external view returns (string memory) {
    return NavigatorLifecycleUtils.getMetadataURI(navigator);
  }

  function getLastReportRound(address navigator) external view returns (uint256) {
    return NavigatorLifecycleUtils.getLastReportRound(navigator);
  }

  function getLastReportURI(address navigator) external view returns (string memory) {
    return NavigatorLifecycleUtils.getLastReportURI(navigator);
  }

  // ======================== Version & Upgrade ======================== //

  function version() external pure returns (string memory) {
    return "1";
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  // ======================== Internal ======================== //

  /// @dev Get current round ID from XAllocationVoting (returns 0 if not set)
  function _getCurrentRound() internal view returns (uint256) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    if ($.xAllocationVoting == address(0)) return 0;
    return IXAllocationVotingGovernor($.xAllocationVoting).currentRoundId();
  }
}
