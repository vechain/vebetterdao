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
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
 * Staking & Voting Power:
 * - Staked B3TR is converted to VOT3 under the hood (via VOT3.convertToVOT3) so it counts as
 *   the navigator's personal voting power. The contract self-delegates on VOT3 during initialization
 *   to enable ERC20Votes checkpointing. Per-navigator staked amounts are tracked with Checkpoints.Trace208
 *   for snapshot queries (getStakedAmountAtTimepoint). On withdraw/slash, VOT3 is converted back to B3TR.
 * - The staked VOT3 only counts for voting power — it cannot support proposals or be powered down.
 *
 * Key features:
 * - Permissionless navigator registration with B3TR staking (min 50K, max 1% of VOT3 supply)
 * - Citizens delegate specific VOT3 amounts with checkpointed snapshots
 * - Navigators set allocation preferences (custom % distribution) and governance decisions
 * - 20% fee on citizen rewards, locked for configurable rounds, claimable after lock period
 * - 5 automatic minor infraction types, slashed once per round + governance-driven major slashing with fee forfeiture
 * - Exit process with notice period and lazy invalidation (citizen VOT3 auto-unlocked)
 * - Self-delegation blocked, citizens cannot manually vote while delegated
 * - Stale delegations auto-cleared: citizens can re-delegate directly to new navigator
 *
 * Cross-contract integrations:
 * - VOT3: reads getDelegatedAmount() to enforce transfer lock; convertToVOT3/convertToB3TR for staking
 * - XAllocationVoting: castNavigatorVote() uses delegated amount at snapshot as voting power
 * - B3TRGovernor: castNavigatorVote() for governance proposals
 * - VoterRewards: deducts navigator fee at claim time, deposits to this contract
 */
contract NavigatorRegistry is
  Initializable,
  INavigatorRegistry,
  AccessControlUpgradeable,
  UUPSUpgradeable,
  ReentrancyGuardUpgradeable
{
  /// @notice Role hash for governance-only functions
  bytes32 public constant GOVERNANCE_ROLE = keccak256("GOVERNANCE_ROLE");
  /// @notice Role hash for upgrade authorization
  bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
  /// @notice Basis points denominator (10000 = 100%)
  uint256 public constant BASIS_POINTS = 10000;

  // ======================== Modifiers ======================== //

  /// @dev Reverts if caller is not a registered, active navigator
  modifier onlyNavigator() {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    if (!$.isRegistered[_msgSender()] || $.isDeactivated[_msgSender()]) revert NotRegistered(_msgSender());
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
    uint256 preferenceCutoffPeriod;
    address voterRewards;
    address xAllocationVoting;
    address relayerRewardsPool;
  }

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @notice Initialize the contract with roles, token addresses, and governance parameters
  /// @param params Struct containing all initialization parameters
  function initialize(InitParams calldata params) public initializer {
    if (params.admin == address(0)) revert ZeroAddress("admin");
    if (params.b3trToken == address(0)) revert ZeroAddress("b3trToken");
    if (params.vot3Token == address(0)) revert ZeroAddress("vot3Token");
    if (params.treasury == address(0)) revert ZeroAddress("treasury");
    if (params.xAllocationVoting == address(0)) revert ZeroAddress("xAllocationVoting");

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
    $.preferenceCutoffPeriod = params.preferenceCutoffPeriod;
    $.voterRewards = params.voterRewards;
    $.xAllocationVoting = params.xAllocationVoting;
    $.relayerRewardsPool = params.relayerRewardsPool;

    // Self-delegate on VOT3 so staked VOT3 has voting power in checkpoints
    IVOT3(params.vot3Token).delegate(address(this));
    // B3TR approval for VOT3 contract — needed because convertToVOT3() internally
    // calls b3tr.transferFrom(msg.sender=NavigatorRegistry, vot3, amount)
    IERC20(params.b3trToken).approve(params.vot3Token, type(uint256).max);
  }

  /// @notice Reinitializer for V2: fix citizens whose delegation exceeds their VOT3 balance.
  /// @dev Pre-V2, `delegate()` and `increaseDelegation()` lacked a balance check, so a citizen
  /// could end up with `getDelegatedAmount > balanceOf`. This caps each affected citizen's
  /// delegation at their current balance and decrements the navigator's total by the same delta,
  /// emitting `DelegationDecreased` so indexers reflect the correction as a normal reduce.
  /// @param affectedCitizens Citizens to evaluate. Idempotent and skips non-affected addresses,
  /// so over-inclusion is safe. Build the list off-chain by paging the indexer's
  /// `/api/v1/b3tr/navigators/citizens` endpoint and comparing on-chain
  /// `getDelegatedAmount(c)` against `vot3.balanceOf(c)`.
  function initializeV2(address[] calldata affectedCitizens) external reinitializer(2) {
    NavigatorDelegationUtils.correctOverDelegations(affectedCitizens);
  }

  // ======================== Version & Upgrade ======================== //

  /// @notice Get the current contract version
  /// @return The version string
  function version() external pure returns (string memory) {
    return "2";
  }

  /// @notice Authorize a contract upgrade. Only callable by UPGRADER_ROLE.
  /// @param newImplementation Address of the new implementation contract
  function _authorizeUpgrade(address newImplementation) internal override onlyRole(UPGRADER_ROLE) {}

  // ======================== Migration (admin-callable) ======================== //

  /// @notice Cap delegations at VOT3 balance for any citizen still over-delegated post-upgrade.
  /// @dev Same logic as `initializeV2` but callable by `DEFAULT_ADMIN_ROLE` after the reinitializer
  /// has run. Use if additional over-delegated citizens surface or batching is desired.
  /// @param citizens Addresses to evaluate.
  function correctOverDelegations(address[] calldata citizens) external onlyRole(DEFAULT_ADMIN_ROLE) {
    NavigatorDelegationUtils.correctOverDelegations(citizens);
  }

  // ======================== Navigator Registration & Staking ======================== //

  /// @notice Register as a navigator by staking B3TR (permissionless, must approve B3TR first)
  /// @param amount Amount of B3TR to stake
  /// @param metadataURI URI pointing to navigator metadata (e.g. IPFS)
  function register(uint256 amount, string calldata metadataURI) external nonReentrant {
    NavigatorStakingUtils.register(_msgSender(), amount, metadataURI);
  }

  /// @notice Add more B3TR to an existing navigator's stake
  /// @param amount Amount of B3TR to add
  function addStake(uint256 amount) external nonReentrant onlyNavigator {
    NavigatorStakingUtils.addStake(_msgSender(), amount);
  }

  /// @notice Reduce stake while active (must stay above min stake and maintain delegation capacity)
  /// @param amount Amount of B3TR to reduce
  function reduceStake(uint256 amount) external nonReentrant onlyNavigator {
    NavigatorStakingUtils.reduceStake(_msgSender(), amount);
  }

  /// @notice Withdraw staked B3TR (only after exit finalized or deactivation)
  /// @param amount Amount of B3TR to withdraw
  function withdrawStake(uint256 amount) external nonReentrant {
    // No onlyNavigator — deactivated navigators also need to withdraw
    NavigatorStakingUtils.withdrawStake(_msgSender(), amount);
  }

  // ======================== Citizen Delegation ======================== //

  /// @notice Delegate VOT3 to a navigator
  /// @param navigator Address of the navigator to delegate to
  /// @param amount Amount of VOT3 to delegate
  function delegate(address navigator, uint256 amount) external nonReentrant {
    NavigatorDelegationUtils.delegate(_msgSender(), navigator, amount);
    // Disable auto-voting if enabled (citizen votes through navigator now)
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    if ($.xAllocationVoting != address(0)) {
      IXAllocationVotingGovernor($.xAllocationVoting).disableAutoVotingFor(_msgSender());
    }
    // VOT3 transfer lock is enforced by VOT3._update() reading getDelegatedAmount() from this contract
  }

  /// @notice Increase delegation to the current navigator
  /// @param amount Additional VOT3 to delegate
  function increaseDelegation(uint256 amount) external nonReentrant {
    NavigatorDelegationUtils.increaseDelegation(_msgSender(), amount);
    // VOT3 lock auto-adjusts — VOT3._update() reads current delegation from this contract
  }

  /// @notice Partially reduce delegation amount
  /// @param reduceBy Amount of VOT3 to reduce from current delegation
  function reduceDelegation(uint256 reduceBy) external nonReentrant {
    NavigatorDelegationUtils.reduceDelegation(_msgSender(), reduceBy);
    // VOT3 lock auto-adjusts — VOT3._update() reads current delegation from this contract
  }

  /// @notice Fully undelegate from the current navigator
  function undelegate() external nonReentrant {
    NavigatorDelegationUtils.undelegate(_msgSender());
    // VOT3 lock auto-releases — delegation is now 0
  }

  // ======================== Navigator Voting Decisions ======================== //

  /// @notice Set allocation voting preferences for a round (also navigator's own vote)
  /// @param roundId The round to set preferences for
  /// @param appIds Array of XApp identifiers
  /// @param weights Array of vote weights corresponding to each app
  function setAllocationPreferences(
    uint256 roundId,
    bytes32[] calldata appIds,
    uint256[] calldata weights
  ) external onlyNavigator {
    NavigatorVotingUtils.setAllocationPreferences(_msgSender(), roundId, appIds, weights);
  }

  /// @notice Set governance proposal decision (1=Against, 2=For, 3=Abstain; also navigator's own vote)
  /// @param proposalId The governance proposal ID
  /// @param decision Vote decision (1=Against, 2=For, 3=Abstain)
  function setProposalDecision(uint256 proposalId, uint8 decision) external onlyNavigator {
    NavigatorVotingUtils.setProposalDecision(_msgSender(), proposalId, decision);
  }

  // ======================== Fee Management ======================== //

  /// @notice Deposit a navigator fee (called by VoterRewards during reward claim)
  /// @dev B3TR must already be transferred to this contract before calling.
  /// @param navigator Address of the navigator receiving the fee
  /// @param roundId The round the fee corresponds to
  /// @param amount Amount of B3TR deposited as fee
  function depositNavigatorFee(address navigator, uint256 roundId, uint256 amount) external {
    if (_msgSender() != NavigatorStorageTypes.getNavigatorStorage().voterRewards)
      revert UnauthorizedCaller(_msgSender());
    NavigatorFeeUtils.depositFee(navigator, roundId, amount);
  }

  /// @notice Claim unlocked fees for a specific round
  /// @param roundId The round to claim fees for
  function claimFee(uint256 roundId) external nonReentrant onlyNavigator {
    NavigatorFeeUtils.claimFee(_msgSender(), roundId, _getCurrentRound());
  }

  // ======================== Slashing Reports (anyone can call) ======================== //

  /// @notice Report navigator for minor infractions in a completed round
  /// @param navigator Address of the navigator to report
  /// @param roundId The completed round to report
  /// @param proposalIds Proposal IDs that were active in this round
  function reportRoundInfractions(address navigator, uint256 roundId, uint256[] calldata proposalIds) external {
    NavigatorSlashingUtils.reportRoundInfractions(navigator, roundId, proposalIds);
  }

  /// @notice Deactivate a navigator by governance (major infraction with slash)
  /// @param navigator Address of the navigator to deactivate
  /// @param slashPercentage Percentage of stake to slash (in basis points)
  /// @param slashFees Whether to also slash unclaimed fees
  function deactivateNavigator(
    address navigator,
    uint256 slashPercentage,
    bool slashFees
  ) external onlyRole(GOVERNANCE_ROLE) {
    NavigatorSlashingUtils.majorSlash(navigator, slashPercentage, slashFees);
    NavigatorLifecycleUtils.deactivate(navigator);
  }

  // ======================== Lifecycle ======================== //

  /// @notice Announce intent to exit. Navigator is marked dead at the current round's deadline.
  function announceExit() external onlyNavigator {
    NavigatorLifecycleUtils.announceExit(_msgSender());
  }

  // ======================== Profile & Reports ======================== //

  /// @notice Update navigator metadata URI
  /// @param uri New metadata URI
  function setMetadataURI(string calldata uri) external onlyNavigator {
    NavigatorLifecycleUtils.setMetadataURI(_msgSender(), uri);
  }

  /// @notice Submit a periodic report
  /// @param reportURI URI pointing to the report content
  function submitReport(string calldata reportURI) external onlyNavigator {
    NavigatorLifecycleUtils.submitReport(_msgSender(), _getCurrentRound(), reportURI);
  }

  // ======================== Governance Setters ======================== //

  /// @notice Update the minimum stake. Only callable by GOVERNANCE_ROLE.
  /// @param newMinStake New minimum B3TR stake required to register as navigator
  function setMinStake(uint256 newMinStake) external onlyRole(GOVERNANCE_ROLE) {
    if (newMinStake == 0) revert InvalidParameter("minStake must be > 0");
    NavigatorStorageTypes.getNavigatorStorage().minStake = newMinStake;
  }

  /// @notice Update the max stake percentage. Only callable by GOVERNANCE_ROLE.
  /// @param newPercentage New max stake percentage in basis points (1-10000)
  function setMaxStakePercentage(uint256 newPercentage) external onlyRole(GOVERNANCE_ROLE) {
    if (newPercentage == 0 || newPercentage > BASIS_POINTS) revert InvalidParameter("must be 1-10000");
    NavigatorStorageTypes.getNavigatorStorage().maxStakePercentage = newPercentage;
  }

  /// @notice Update the fee lock period. Only callable by GOVERNANCE_ROLE.
  /// @param newPeriod Number of rounds fees remain locked after deposit
  function setFeeLockPeriod(uint256 newPeriod) external onlyRole(GOVERNANCE_ROLE) {
    if (newPeriod == 0) revert InvalidParameter("feeLockPeriod must be > 0");
    NavigatorStorageTypes.getNavigatorStorage().feeLockPeriod = newPeriod;
  }

  /// @notice Update the fee percentage. Only callable by GOVERNANCE_ROLE.
  /// @param newPercentage New fee percentage in basis points (0-10000)
  function setFeePercentage(uint256 newPercentage) external onlyRole(GOVERNANCE_ROLE) {
    if (newPercentage > BASIS_POINTS) revert InvalidParameter("feePercentage must be <= 10000");
    NavigatorStorageTypes.getNavigatorStorage().feePercentage = newPercentage;
  }

  /// @notice Update the exit notice period. Only callable by GOVERNANCE_ROLE.
  /// @param newPeriod Number of rounds navigator must remain active after announcing exit
  function setExitNoticePeriod(uint256 newPeriod) external onlyRole(GOVERNANCE_ROLE) {
    NavigatorStorageTypes.getNavigatorStorage().exitNoticePeriod = newPeriod;
  }

  /// @notice Update the report interval. Only callable by GOVERNANCE_ROLE.
  /// @param newInterval Number of rounds between required navigator reports
  function setReportInterval(uint256 newInterval) external onlyRole(GOVERNANCE_ROLE) {
    if (newInterval == 0) revert InvalidParameter("reportInterval must be > 0");
    NavigatorStorageTypes.getNavigatorStorage().reportInterval = newInterval;
  }

  /// @notice Update the minor slash percentage. Only callable by GOVERNANCE_ROLE.
  /// @param newPercentage New minor slash percentage in basis points (1-10000)
  function setMinorSlashPercentage(uint256 newPercentage) external onlyRole(GOVERNANCE_ROLE) {
    if (newPercentage == 0 || newPercentage > BASIS_POINTS) revert InvalidParameter("must be 1-10000");
    NavigatorStorageTypes.getNavigatorStorage().minorSlashPercentage = newPercentage;
  }

  /// @notice Update the preference cutoff period. Only callable by GOVERNANCE_ROLE.
  /// @param newPeriod Number of blocks before round end after which preference changes are penalized
  function setPreferenceCutoffPeriod(uint256 newPeriod) external onlyRole(GOVERNANCE_ROLE) {
    if (newPeriod == 0) revert InvalidParameter("preferenceCutoffPeriod must be > 0");
    NavigatorStorageTypes.getNavigatorStorage().preferenceCutoffPeriod = newPeriod;
  }

  /// @notice Set the XAllocationVoting address. Only callable by DEFAULT_ADMIN_ROLE.
  /// @param newAddress Address of the XAllocationVoting contract
  function setXAllocationVoting(address newAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if (newAddress == address(0)) revert ZeroAddress("xAllocationVoting");
    NavigatorStorageTypes.getNavigatorStorage().xAllocationVoting = newAddress;
  }

  /// @notice Set the RelayerRewardsPool address. Only callable by DEFAULT_ADMIN_ROLE.
  /// @param newAddress Address of the RelayerRewardsPool contract
  function setRelayerRewardsPool(address newAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if (newAddress == address(0)) revert ZeroAddress("relayerRewardsPool");
    NavigatorStorageTypes.getNavigatorStorage().relayerRewardsPool = newAddress;
  }

  /// @notice Set the VoterRewards address. Only callable by DEFAULT_ADMIN_ROLE.
  /// @param newAddress Address of the VoterRewards contract
  function setVoterRewards(address newAddress) external onlyRole(DEFAULT_ADMIN_ROLE) {
    if (newAddress == address(0)) revert ZeroAddress("voterRewards");
    NavigatorStorageTypes.getNavigatorStorage().voterRewards = newAddress;
  }

  // ======================== View Functions ======================== //

  // -- Staking --
  /// @notice Get the staked B3TR amount for a navigator
  /// @param navigator Address of the navigator
  /// @return The staked B3TR amount
  function getStake(address navigator) external view returns (uint256) {
    return NavigatorStakingUtils.getStake(navigator);
  }

  /// @notice Get the current lifecycle status of a navigator
  /// @param account Address to check
  /// @return 0=NONE, 1=ACTIVE, 2=EXITING, 3=DEACTIVATED
  function getStatus(address account) external view returns (uint8) {
    return NavigatorLifecycleUtils.getStatus(account);
  }

  /// @notice Check if an account is a registered and active navigator
  /// @param account Address to check
  /// @return True if the account is a registered, non-deactivated navigator
  function isNavigator(address account) external view returns (bool) {
    return NavigatorStakingUtils.isNavigator(account);
  }

  /// @notice Check if a navigator can accept new delegations
  /// @param navigator Address of the navigator
  /// @return True if the navigator is active and has remaining capacity
  function canAcceptDelegations(address navigator) external view returns (bool) {
    return NavigatorStakingUtils.canAcceptDelegations(navigator);
  }

  /// @notice Get the total VOT3 delegation capacity based on the navigator's stake
  /// @param navigator Address of the navigator
  /// @return Maximum VOT3 that can be delegated to this navigator
  function getDelegationCapacity(address navigator) external view returns (uint256) {
    return NavigatorStakingUtils.getDelegationCapacity(navigator);
  }

  /// @notice Get the remaining VOT3 delegation capacity for a navigator
  /// @param navigator Address of the navigator
  /// @return Available VOT3 delegation capacity
  function getRemainingCapacity(address navigator) external view returns (uint256) {
    return NavigatorStakingUtils.getRemainingCapacity(navigator);
  }

  /// @notice Get the minimum B3TR stake required to register as a navigator
  /// @return The minimum stake amount
  function getMinStake() external view returns (uint256) {
    return NavigatorStakingUtils.getMinStake();
  }

  /// @notice Get the maximum B3TR stake allowed per navigator
  /// @return The maximum stake amount
  function getMaxStake() external view returns (uint256) {
    return NavigatorStakingUtils.getMaxStake();
  }

  /// @notice Get the staked amount for a navigator at a past block (checkpointed)
  /// @param navigator Address of the navigator
  /// @param timepoint Block number to query
  /// @return The staked amount at that block
  function getStakedAmountAtTimepoint(address navigator, uint256 timepoint) external view returns (uint256) {
    return NavigatorStakingUtils.getStakedAmountAtTimepoint(navigator, timepoint);
  }

  // -- Delegation --
  /// @notice Get the navigator a citizen has delegated to
  /// @param citizen Address of the citizen
  /// @return Address of the navigator (zero address if not delegated)
  function getNavigator(address citizen) external view returns (address) {
    return NavigatorDelegationUtils.getNavigator(citizen);
  }

  /// @inheritdoc INavigatorRegistry
  function getRawNavigator(address citizen) external view returns (address) {
    return NavigatorDelegationUtils.getRawNavigator(citizen);
  }

  /// @inheritdoc INavigatorRegistry
  function getRawNavigatorAtTimepoint(address citizen, uint256 timepoint) external view returns (address) {
    return NavigatorDelegationUtils.getRawNavigatorAtTimepoint(citizen, timepoint);
  }

  /// @notice Get the VOT3 amount a citizen has delegated
  /// @param citizen Address of the citizen
  /// @return The delegated VOT3 amount
  function getDelegatedAmount(address citizen) external view returns (uint256) {
    return NavigatorDelegationUtils.getDelegatedAmount(citizen);
  }

  /// @notice Get the total VOT3 delegated to a navigator from all citizens
  /// @param navigator Address of the navigator
  /// @return Total delegated VOT3 amount
  function getTotalDelegated(address navigator) external view returns (uint256) {
    return NavigatorDelegationUtils.getTotalDelegated(navigator);
  }

  /// @inheritdoc INavigatorRegistry
  function getTotalDelegatedAtTimepoint(address navigator, uint256 timepoint) external view returns (uint256) {
    return NavigatorDelegationUtils.getTotalDelegatedAtTimepoint(navigator, timepoint);
  }

  /// @inheritdoc INavigatorRegistry
  function getTotalDelegatedCitizensAtTimepoint(uint48 timepoint) external view returns (uint208) {
    return NavigatorDelegationUtils.getTotalDelegatedCitizensAtTimepoint(timepoint);
  }

  /// @notice Check if a citizen is currently delegating to any navigator
  /// @param citizen Address of the citizen
  /// @return True if the citizen has an active delegation
  function isDelegated(address citizen) external view returns (bool) {
    return NavigatorDelegationUtils.isDelegated(citizen);
  }

  /// @notice Get a citizen's delegated amount at a historical timepoint (block number)
  /// @param citizen Address of the citizen
  /// @param timepoint Block number to query
  /// @return The delegated VOT3 amount at that timepoint
  function getDelegatedAmountAtTimepoint(address citizen, uint256 timepoint) external view returns (uint256) {
    return NavigatorDelegationUtils.getDelegatedAmountAtTimepoint(citizen, timepoint);
  }

  /// @notice Get the navigator a citizen was delegated to at a historical timepoint
  /// @dev Does NOT apply dead-navigator invalidation — callers decide.
  /// @param citizen Address of the citizen
  /// @param timepoint Block number to query
  /// @return The navigator address at that timepoint (address(0) if not delegated)
  function getNavigatorAtTimepoint(address citizen, uint256 timepoint) external view returns (address) {
    return NavigatorDelegationUtils.getNavigatorAtTimepoint(citizen, timepoint);
  }

  /// @notice Check if a citizen was delegated at a historical timepoint
  /// @dev Does NOT apply dead-navigator invalidation — callers decide.
  /// @param citizen Address of the citizen
  /// @param timepoint Block number to query
  /// @return True if the citizen had a navigator at that timepoint
  function isDelegatedAtTimepoint(address citizen, uint256 timepoint) external view returns (bool) {
    return NavigatorDelegationUtils.isDelegatedAtTimepoint(citizen, timepoint);
  }

  // -- Voting --
  /// @notice Get a navigator's allocation preferences for a round
  /// @param navigator Address of the navigator
  /// @param roundId The round to query
  /// @return Tuple of (appIds array, weights array)
  function getAllocationPreferences(
    address navigator,
    uint256 roundId
  ) external view returns (bytes32[] memory, uint256[] memory) {
    return NavigatorVotingUtils.getAllocationPreferences(navigator, roundId);
  }

  /// @notice Check if a navigator has set allocation preferences for a round
  /// @param navigator Address of the navigator
  /// @param roundId The round to check
  /// @return True if preferences have been set
  function hasSetPreferences(address navigator, uint256 roundId) external view returns (bool) {
    return NavigatorVotingUtils.hasSetPreferences(navigator, roundId);
  }

  /// @notice Get the block number when a navigator set preferences for a round
  /// @param navigator Address of the navigator
  /// @param roundId The round to query
  /// @return Block number at which preferences were set (0 if not set)
  function getPreferencesSetBlock(address navigator, uint256 roundId) external view returns (uint256) {
    return NavigatorVotingUtils.getPreferencesSetBlock(navigator, roundId);
  }

  /// @notice Get a navigator's decision on a governance proposal
  /// @param navigator Address of the navigator
  /// @param proposalId The proposal to query
  /// @return Decision value (0=not set, 1=Against, 2=For, 3=Abstain)
  function getProposalDecision(address navigator, uint256 proposalId) external view returns (uint8) {
    return NavigatorVotingUtils.getProposalDecision(navigator, proposalId);
  }

  /// @notice Check if a navigator has set a decision on a governance proposal
  /// @param navigator Address of the navigator
  /// @param proposalId The proposal to check
  /// @return True if a decision has been set
  function hasSetDecision(address navigator, uint256 proposalId) external view returns (bool) {
    return NavigatorVotingUtils.hasSetDecision(navigator, proposalId);
  }

  // -- Fees --
  /// @notice Get the fee deposited for a navigator in a specific round
  /// @param navigator Address of the navigator
  /// @param roundId The round to query
  /// @return The fee amount in B3TR
  function getRoundFee(address navigator, uint256 roundId) external view returns (uint256) {
    return NavigatorFeeUtils.getRoundFee(navigator, roundId);
  }

  /// @notice Get the number of rounds fees remain locked after deposit
  /// @return The fee lock period in rounds
  function getFeeLockPeriod() external view returns (uint256) {
    return NavigatorFeeUtils.getFeeLockPeriod();
  }

  /// @notice Get the fee percentage taken from citizen rewards
  /// @return The fee percentage in basis points
  function getFeePercentage() external view returns (uint256) {
    return NavigatorFeeUtils.getFeePercentage();
  }

  /// @notice Check if fees for a given round are unlocked and claimable
  /// @param roundId The round to check
  /// @return True if the fee lock period has elapsed
  function isRoundFeeUnlocked(uint256 roundId) external view returns (bool) {
    return NavigatorFeeUtils.isRoundFeeUnlocked(roundId, _getCurrentRound());
  }

  // -- Slashing --
  /// @notice Get the total B3TR slashed from a navigator's stake
  /// @param navigator Address of the navigator
  /// @return Total slashed amount
  function getTotalSlashed(address navigator) external view returns (uint256) {
    return NavigatorSlashingUtils.getTotalSlashed(navigator);
  }

  /// @notice Get the minor slash percentage applied for negligence infractions
  /// @return The minor slash percentage in basis points
  function getMinorSlashPercentage() external view returns (uint256) {
    return NavigatorSlashingUtils.getMinorSlashPercentage();
  }

  /// @notice Check if a navigator was already slashed for a round
  /// @param navigator The navigator address
  /// @param roundId The round ID
  /// @return slashed True if slashed for that round
  /// @return infractionFlags Bitmask of infractions found when slashed
  function isSlashedForRound(address navigator, uint256 roundId) external view returns (bool slashed, uint256 infractionFlags) {
    return NavigatorSlashingUtils.isSlashedForRound(navigator, roundId);
  }

  /// @notice Get the preference cutoff period (blocks before round end)
  /// @return The cutoff period in blocks
  function getPreferenceCutoffPeriod() external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().preferenceCutoffPeriod;
  }

  // -- Lifecycle --
  /// @notice Check if a navigator has announced exit and is in the notice period
  /// @param navigator Address of the navigator
  /// @return True if the navigator is in the exit process
  function isExiting(address navigator) external view returns (bool) {
    return NavigatorLifecycleUtils.isExiting(navigator);
  }

  /// @notice Check if a navigator has been deactivated (by governance or exit)
  /// @param navigator Address of the navigator
  /// @return True if the navigator is deactivated
  function isDeactivated(address navigator) external view returns (bool) {
    return NavigatorLifecycleUtils.isDeactivated(navigator);
  }

  /// @notice Check if a navigator was deactivated at a given timepoint (checkpointed)
  /// @param navigator Address of the navigator
  /// @param timepoint Block number to query
  /// @return True if the navigator was dead at that timepoint
  function isDeactivatedAtTimepoint(address navigator, uint256 timepoint) external view returns (bool) {
    return NavigatorDelegationUtils.isDeactivatedAtTimepoint(navigator, timepoint);
  }

  /// @notice Get the round when a navigator announced exit (0 = not exiting)
  /// @param navigator Address of the navigator
  /// @return The exit-announced round ID (0 if not exiting)
  function exitAnnouncedRound(address navigator) external view returns (uint256) {
    return NavigatorStorageTypes.getNavigatorStorage().exitAnnouncedRound[navigator];
  }

  /// @notice Get the exit notice period in rounds
  /// @return The notice period
  function getExitNoticePeriod() external view returns (uint256) {
    return NavigatorLifecycleUtils.getExitNoticePeriod();
  }

  /// @notice Get the required report interval in rounds
  /// @return The report interval
  function getReportInterval() external view returns (uint256) {
    return NavigatorLifecycleUtils.getReportInterval();
  }

  // -- Profile --
  /// @notice Get a navigator's metadata URI
  /// @param navigator Address of the navigator
  /// @return The metadata URI string
  function getMetadataURI(address navigator) external view returns (string memory) {
    return NavigatorLifecycleUtils.getMetadataURI(navigator);
  }

  /// @notice Get the last round in which a navigator submitted a report
  /// @param navigator Address of the navigator
  /// @return The round ID of the last submitted report
  function getLastReportRound(address navigator) external view returns (uint256) {
    return NavigatorLifecycleUtils.getLastReportRound(navigator);
  }

  /// @notice Get the URI of a navigator's most recent report
  /// @param navigator Address of the navigator
  /// @return The report URI string
  function getLastReportURI(address navigator) external view returns (string memory) {
    return NavigatorLifecycleUtils.getLastReportURI(navigator);
  }

  // ======================== Internal ======================== //

  /// @dev Get current round ID from XAllocationVoting (returns 0 if not set)
  /// @return The current round ID, or 0 if xAllocationVoting is not configured
  function _getCurrentRound() internal view returns (uint256) {
    NavigatorStorageTypes.NavigatorStorage storage $ = NavigatorStorageTypes.getNavigatorStorage();
    if ($.xAllocationVoting == address(0)) return 0;
    return IXAllocationVotingGovernor($.xAllocationVoting).currentRoundId();
  }
}
