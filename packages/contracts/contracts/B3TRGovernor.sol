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

pragma solidity ^0.8.20;

import "./governance/GovernorUpgradeable.sol";
import { GovernorProposalLogic } from "./governance/libraries/GovernorProposalLogic.sol";
import { GovernorStateLogic } from "./governance/libraries/GovernorStateLogic.sol";
import { GovernorVotesLogic } from "./governance/libraries/GovernorVotesLogic.sol";
import { GovernorQuorumLogic } from "./governance/libraries/GovernorQuorumLogic.sol";
import { GovernorDepositLogic } from "./governance/libraries/GovernorDepositLogic.sol";
import { GovernorStorageTypes } from "./governance/libraries/GovernorStorageTypes.sol";
import { GovernorClockLogic } from "./governance/libraries/GovernorClockLogic.sol";
import { GovernorFunctionRestrictionsLogic } from "./governance/libraries/GovernorFunctionRestrictionsLogic.sol";
import { GovernorGovernanceLogic } from "./governance/libraries/GovernorGovernanceLogic.sol";
import { GovernorConfigurator } from "./governance/libraries/GovernorConfigurator.sol";
import { GovernorTypes } from "./governance/libraries/GovernorTypes.sol";
import { GovernorStorage } from "./governance/GovernorStorage.sol";
import { IVoterRewards } from "./interfaces/IVoterRewards.sol";
import { IVOT3 } from "./interfaces/IVOT3.sol";
import { IB3TRGovernor } from "./interfaces/IB3TRGovernor.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";
import { TimelockControllerUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title B3TRGovernor
 * @notice This contract is the main governance contract for the VeBetterDAO ecosystem.
 * Anyone can create a proposal to both change the state of the contract, to execute a transaction
 * on the timelock or to ask for a vote from the community without performing any onchain action.
 * In order for the proposal to become active, the community needs to deposit a certain amount of VOT3 tokens.
 * This is used as a heath check for the proposal, and funds are returned to the depositors after vote is concluded.
 * Votes for proposals start periodically, based on the allocation rounds (see xAllocationVoting contract), and the round
 * in which the proposal should be active is specified by the proposer during the proposal creation.
 *
 * A mininimum amount of voting power is required in order to vote on a proposal.
 * The voting power is calculated through the quadratic vote formula based on the amount of VOT3 tokens held by the
 * voter at the block when the proposal becomes active.
 *
 * Once a proposal succeeds, it can be queued and executed. The execution is done through the timelock contract.
 *
 * The contract is upgradeable and uses the UUPS pattern.
 */
contract B3TRGovernor is
  Initializable,
  IB3TRGovernor,
  GovernorStorage,
  AccessControlUpgradeable,
  UUPSUpgradeable,
  PausableUpgradeable
{
  using GovernorProposalLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorStateLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorQuorumLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorVotesLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorDepositLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorClockLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorFunctionRestrictionsLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorGovernanceLogic for GovernorStorageTypes.GovernorStorage;
  using GovernorConfigurator for GovernorStorageTypes.GovernorStorage;

  /// @notice The role that can whitelist allowed functions in the propose function
  bytes32 public constant GOVERNOR_FUNCTIONS_SETTINGS_ROLE = keccak256("GOVERNOR_FUNCTIONS_SETTINGS_ROLE");
  /// @notice The role that can pause the contract
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  /// @notice The role that can set external contracts addresses
  bytes32 public constant CONTRACTS_ADDRESS_MANAGER_ROLE = keccak256("CONTRACTS_ADDRESS_MANAGER_ROLE");
  /// @notice The role that can execute a proposal
  bytes32 public constant PROPOSAL_EXECUTOR_ROLE = keccak256("PROPOSAL_EXECUTOR_ROLE");

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @dev Struct containing data to initialize the contract
   * @param vot3Token The address of the Vot3 token used for voting
   * @param timelock The address of the Timelock
   * @param xAllocationVoting The address of the xAllocationVoting
   * @param quorumPercentage quorum as a percentage of the total supply of VOT3 tokens
   * @param initialDepositThreshold The Deposit Threshold for a proposal to be active
   * @param initialMinVotingDelay The minimum amount of blocks a proposal needs to wait before it can start
   * @param initialVotingThreshold The minimum amount of voting power needed in order to vote
   * @param governorAdmin The address of the governor admin
   * @param pauser The address of the pauser
   * @param contractsAddressManager The address of the contracts address manager
   * @param proposalExecutor The address that should be set as executor and have the PROPOSAL_EXECUTOR_ROLE
   * @param voterRewards The address of the voter rewards contract
   * @param governorFunctionSettingsRoleAddress The address that should have the GOVERNOR_FUNCTIONS_SETTINGS_ROLE
   * @param isFunctionRestrictionEnabled If the function restriction is enabled
   */
  struct InitializationData {
    IVOT3 vot3Token;
    TimelockControllerUpgradeable timelock;
    IXAllocationVotingGovernor xAllocationVoting;
    IB3TR b3tr;
    uint256 quorumPercentage;
    uint256 initialDepositThreshold;
    uint256 initialMinVotingDelay;
    uint256 initialVotingThreshold;
    address governorAdmin;
    address pauser;
    address contractsAddressManager;
    address proposalExecutor;
    IVoterRewards voterRewards;
    address governorFunctionSettingsRoleAddress;
    bool isFunctionRestrictionEnabled;
  }

  /**
   * @dev Restricts a function so it can only be executed through governance proposals. For example, governance
   * parameter setters in {GovernorSettings} are protected using this modifier.
   *
   * The governance executing address may be different from the Governor's own address, for example it could be a
   * timelock. This can be customized by modules by overriding {_executor}. The executor is only able to invoke these
   * functions during the execution of the governor's {execute} function, and not under any other circumstances. Thus,
   * for example, additional timelock proposers are not able to change governance parameters without going through the
   * governance protocol (since v4.6).
   */
  modifier onlyGovernance() {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.checkGovernance(_msgSender(), _msgData(), address(this));
    _;
  }

  /// @notice modifier to check if the caller has the specified role or if the function is called through a governance proposal
  modifier onlyRoleOrGovernance(bytes32 role) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    if (!hasRole(role, _msgSender())) $.checkGovernance(_msgSender(), _msgData(), address(this));
    _;
  }

  /**
   * @dev Modifier to make a function callable only by a certain role. In
   * addition to checking the sender's role, `address(0)` 's role is also
   * considered. Granting a role to `address(0)` is equivalent to enabling
   * this role for everyone.
   */
  modifier onlyRoleOrOpenRole(bytes32 role) {
    if (!hasRole(role, address(0))) {
      _checkRole(role, _msgSender());
    }
    _;
  }

  /**
   * @dev Initializes the contract with the initial parameters
   */
  function initialize(InitializationData memory data) public initializer {
    __GovernorStorage_init(data, "B3TRGovernor");
    __AccessControl_init();
    __UUPSUpgradeable_init();
    __Pausable_init();

    _grantRole(DEFAULT_ADMIN_ROLE, data.governorAdmin);
    _grantRole(GOVERNOR_FUNCTIONS_SETTINGS_ROLE, data.governorFunctionSettingsRoleAddress);
    _grantRole(PAUSER_ROLE, data.pauser);
    _grantRole(CONTRACTS_ADDRESS_MANAGER_ROLE, data.contractsAddressManager);
    _grantRole(PROPOSAL_EXECUTOR_ROLE, data.proposalExecutor);
  }

  // ------------------ GETTERS ------------------ //

  /**
   * @dev Function to know if a proposal is executable or not.
   * If the proposal was creted without any targets, values, or calldatas, it is not executable.
   * to check if the proposal is executable.
   *
   * @param proposalId The id of the proposal
   */
  function proposalNeedsQueuing(uint256 proposalId) external view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.proposalNeedsQueuing(proposalId);
  }

  function state(uint256 proposalId) external view returns (GovernorTypes.ProposalState) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.state(proposalId);
  }

  /**
   * @dev Check if the proposal can start in the next round
   *
   * If we are in round 0 (so emissions did not start yet) there is an unknown amount of time between now
   * and the start of the first round: it could start in 1 hour or 1 week.
   * For this reason, the check we have in place to enforce a minimum delay period will fail.
   *
   * We can still create proposals that starts in round 2, because we know the voting period of first round.
   */
  function canProposalStartInNextRound() public view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.canProposalStartInNextRound();
  }

  /**
   * @dev See {IB3TRGovernor-proposalProposer}.
   */
  function proposalProposer(uint256 proposalId) public view virtual returns (address) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.proposalProposer(proposalId);
  }

  /**
   * @dev See {IB3TRGovernor-proposalEta}.
   */
  function proposalEta(uint256 proposalId) public view virtual returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.proposalEta(proposalId);
  }

  /**
   * @dev See {IB3TRGovernor-proposalStartRound}
   */
  function proposalStartRound(uint256 proposalId) public view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.proposalStartRound(proposalId);
  }

  /**
   * @dev See {IB3TRGovernor-proposalSnapshot}.
   *
   * We take for granted that the round starts the block after it ends. But it can happen that the round is not started yet for whatever reason.
   * Knowing this, if the proposal starts 4 rounds in the future we need to consider also those extra blocks used to start the rounds.
   */
  function proposalSnapshot(uint256 proposalId) external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.proposalSnapshot(proposalId);
  }

  /**
   * @dev See {IB3TRGovernor-proposalDeadline}.
   */
  function proposalDeadline(uint256 proposalId) external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.proposalDeadline(proposalId);
  }

  function depositThreshold() external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.depositThreshold();
  }

  /**
   * @dev See {Governor-depositThreshold}.
   */
  function depositThresholdPercentage() external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.getDepositThresholdPercentage();
  }

  /**
   * @dev See {Governor-votingThreshold}.
   */
  function votingThreshold() external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.getVotingThreshold();
  }

  /**
   * @dev See {IB3TRGovernor-getVotes}.
   */
  function getVotes(address account, uint256 timepoint) external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.getVotes(account, timepoint);
  }

  /**
   * @dev returns the quadratic voting power that `account` has.  See {IB3TRGovernor-getQuadraticVotingPower}.
   */
  function getQuadraticVotingPower(address account, uint256 timepoint) external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.getQuadraticVotingPower(account, timepoint);
  }

  /**
   * @dev Clock (as specified in EIP-6372) is set to match the token's clock. Fallback to block numbers if the token
   * does not implement EIP-6372.
   */
  function clock() external view returns (uint48) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.clock();
  }

  /**
   * @dev Machine-readable description of the clock as specified in EIP-6372.
   */
  // solhint-disable-next-line func-name-mixedcase
  function CLOCK_MODE() external view returns (string memory) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.CLOCK_MODE();
  }

  /**
   * @dev The token that voting power is sourced from.
   */
  function token() external view returns (IVOT3) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.vot3;
  }

  /**
   * @dev Returns the quorum for a timepoint, in terms of number of votes: `supply * numerator / denominator`.
   */
  function quorum(uint256 blockNumber) external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.quorum(blockNumber);
  }

  /**
   * @dev Returns the current quorum numerator. See {quorumDenominator}.
   */
  function quorumNumerator() external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.quorumNumerator();
  }

  /**
   * @dev Returns the quorum numerator at a specific timepoint using the GovernorQuorumFraction library.
   */
  function quorumNumerator(uint256 timepoint) external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.quorumNumerator(timepoint);
  }

  /**
   * @dev Returns the quorum denominator using the GovernorQuorumFraction library. Defaults to 100, but may be overridden.
   */
  function quorumDenominator() external view returns (uint256) {
    return GovernorQuorumLogic.quorumDenominator();
  }

  /// @notice Check if a function is restricted by the governor
  /// @param target - address of the contract
  /// @param functionSelector - function selector
  function isFunctionWhitelisted(address target, bytes4 functionSelector) external view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.isFunctionWhitelisted(target, functionSelector);
  }

  /**
   * @dev See {B3TRGovernor-minVotingDelay}.
   */
  function minVotingDelay() external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.getMinVotingDelay();
  }

  /**
   * @dev See {IB3TRGovernor-votingPeriod}.
   */
  function votingPeriod() external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.xAllocationVoting.votingPeriod();
  }

  /**
   * @dev Check if a user has voted at least one time.
   *
   * @param user The address of the user to check if has voted at least one time
   */
  function hasVotedOnce(address user) external view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.userVotedOnce(user);
  }

  /**
   * @dev returns if quorum was reached or not
   */
  function quorumReached(uint256 proposalId) external view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.quorumReached(proposalId);
  }

  /**
   * @dev returns the total votes for a proposal
   */
  function proposalTotalVotes(uint256 proposalId) external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.getProposalTotalVotes(proposalId);
  }

  /**
   * @dev Accessor to the internal vote counts, in terms of vote power.
   */
  function proposalVotes(
    uint256 proposalId
  ) external view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.getProposalVotes(proposalId);
  }

  // solhint-disable-next-line func-name-mixedcase
  function COUNTING_MODE() external pure returns (string memory) {
    return "support=bravo&quorum=for,abstain,against";
  }

  /**
   * @dev See {IB3TRGovernor-hasVoted}.
   */
  function hasVoted(uint256 proposalId, address account) external view override returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.hasVoted(proposalId, account);
  }

  /**
   * @dev Returns the amount of deposits made to a proposal.
   *
   * @param proposalId The id of the proposal.
   */
  function getProposalDeposits(uint256 proposalId) external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.getProposalDeposits(proposalId);
  }

  /**
   * @dev Returns true if the threshold of deposits required to reach a proposal has been reached.
   *
   * @param proposalId The id of the proposal.
   */
  function proposalDepositReached(uint256 proposalId) external view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.proposalDepositReached(proposalId);
  }

  /**
   * @dev Returns the deposit threshold for a proposal.
   * @param proposalId The id of the proposal.
   * @return uint256 The deposit threshold for the proposal.
   */
  function proposalDepositThreshold(uint256 proposalId) external view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.proposalDepositThreshold(proposalId);
  }

  /**
   * @dev Returns the amount of tokens a specific user has deposited to a proposal.
   *
   * @param proposalId The id of the proposal.
   * @param user The address of the user.
   */
  function getUserDeposit(uint256 proposalId, address user) public view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.getUserDeposit(proposalId, user);
  }

  // ------------------ SETTERS ------------------ //

  /**
   * @dev Pause the contract
   */
  function pause() public onlyRole(PAUSER_ROLE) {
    _pause();
  }

  /**
   * @dev Unpause the contract
   */
  function unpause() public onlyRole(PAUSER_ROLE) {
    _unpause();
  }

  /**
   * @dev See {IB3TRGovernor-propose}.
   *
   * Callable only when contract is not paused.
   */
  function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    uint256 startRoundId,
    uint256 depositAmount
  ) public whenNotPaused returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.propose(targets, values, calldatas, description, startRoundId, depositAmount);
  }

  /**
   * @dev See {IB3TRGovernor-queue}.
   */
  function queue(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) public override whenNotPaused returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.queue(address(this), targets, values, calldatas, descriptionHash);
  }

  /**
   * @dev See {IB3TRGovernor-execute}.
   */
  function execute(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) public payable override whenNotPaused onlyRoleOrOpenRole(PROPOSAL_EXECUTOR_ROLE) returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.execute(address(this), targets, values, calldatas, descriptionHash);
  }

  /**
   * @dev See {Governor-cancel}.
   */
  function cancel(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) public virtual override returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return
      $.cancelPendingProposal(
        _msgSender(),
        hasRole(DEFAULT_ADMIN_ROLE, _msgSender()),
        targets,
        values,
        calldatas,
        descriptionHash
      );
  }

  /**
   * @dev See {IB3TRGovernor-castVote}.
   */
  function castVote(uint256 proposalId, uint8 support) public returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.castVote(proposalId, _msgSender(), support, "");
  }

  /**
   * @dev See {IB3TRGovernor-castVoteWithReason}.
   */
  function castVoteWithReason(uint256 proposalId, uint8 support, string calldata reason) public returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    return $.castVote(proposalId, _msgSender(), support, reason);
  }

  function withdraw(uint256 proposalId, address depositer) external {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.withdraw(proposalId, depositer);
  }

  function deposit(uint256 amount, uint256 proposalId) external {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.deposit(amount, proposalId);
  }

  /**
   * @dev Changes the quorum numerator.
   *
   * Emits a {QuorumNumeratorUpdated} event.
   *
   * Requirements:
   *
   * - Must be called through a governance proposal.
   * - New numerator must be smaller or equal to the denominator.
   */
  function updateQuorumNumerator(uint256 newQuorumNumerator) external onlyGovernance {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.updateQuorumNumerator(newQuorumNumerator);
  }

  /// @notice method that allows to restrict functions that can be called by proposals for a single function selector
  /// @param target - address of the contract
  /// @param functionSelector - function selector
  /// @param isWhitelisted - bool indicating if function is whitelisted for proposals
  function setWhitelistFunction(
    address target,
    bytes4 functionSelector,
    bool isWhitelisted
  ) public onlyRoleOrGovernance(GOVERNOR_FUNCTIONS_SETTINGS_ROLE) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.setWhitelistFunction(target, functionSelector, isWhitelisted);
  }

  /// @notice method that allows to restrict functions that can be called by proposals for multiple function selectors at once
  /// @param target - address of the contract
  /// @param functionSelectors - array of function selectors
  /// @param isWhitelisted - bool indicating if function is whitelisted for proposals
  function setWhitelistFunctions(
    address target,
    bytes4[] memory functionSelectors,
    bool isWhitelisted
  ) public onlyRoleOrGovernance(GOVERNOR_FUNCTIONS_SETTINGS_ROLE) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.setWhitelistFunctions(target, functionSelectors, isWhitelisted);
  }

  /// @notice method that allows to toggle the function restriction on/off
  /// @param isEnabled - flag to enable/disable function restriction
  function setIsFunctionRestrictionEnabled(
    bool isEnabled
  ) public onlyRoleOrGovernance(GOVERNOR_FUNCTIONS_SETTINGS_ROLE) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.setIsFunctionRestrictionEnabled(isEnabled);
  }

  /**
   * @dev Update the deposit threshold. This operation can only be performed through a governance proposal.
   *
   * Emits a {DepositThresholdSet} event.
   */
  function setDepositThresholdPercentage(uint256 newDepositThreshold) public onlyGovernance {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.setDepositThresholdPercentage(newDepositThreshold);
  }

  /**
   * @dev Update the voting threshold. This operation can only be performed through a governance proposal.
   *
   * Emits a {VotingThresholdSet} event.
   */
  function setVotingThreshold(uint256 newVotingThreshold) public onlyGovernance {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.setVotingThreshold(newVotingThreshold);
  }

  /**
   * @dev Update the min voting delay before vote can start.
   * This operation can only be performed through a governance proposal.
   *
   * Emits a {MinVotingDelaySet} event.
   */
  function setMinVotingDelay(uint256 newMinVotingDelay) public onlyGovernance {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.setMinVotingDelay(newMinVotingDelay);
  }

  /**
   * @dev Set the voter rewards contract
   *
   * This function is only callable through goverance proposals or by the CONTRACTS_ADDRESS_MANAGER_ROLE
   *
   * @param _voterRewards The new voter rewards contract
   */
  function setVoterRewards(IVoterRewards _voterRewards) public onlyRoleOrGovernance(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.voterRewards = _voterRewards;
  }

  /**
   * @dev Set the xAllocationVoting contract
   *
   * This function is only callable through goverance proposals or by the CONTRACTS_ADDRESS_MANAGER_ROLE
   *
   * @param _xAllocationVoting The new xAllocationVoting contract
   */
  function setXAllocationVoting(
    IXAllocationVotingGovernor _xAllocationVoting
  ) public onlyRoleOrGovernance(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    $.xAllocationVoting = _xAllocationVoting;
  }

  // ------------------ Overrides ------------------ //

  function _authorizeUpgrade(address newImplementation) internal override onlyGovernance {}

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(IERC165, AccessControlUpgradeable) returns (bool) {
    return
      interfaceId == type(IB3TRGovernor).interfaceId ||
      interfaceId == type(IERC1155Receiver).interfaceId ||
      interfaceId == type(IERC165).interfaceId;
  }

  /**
   * @dev See {IB3TRGovernor-version}.
   */
  function version() public view virtual returns (string memory) {
    return "1";
  }

  /**
   * @dev See {IERC1155Receiver-onERC1155Received}.
   * Receiving tokens is disabled if the governance executor is other than the governor itself (eg. when using with a timelock).
   */
  function onERC1155Received(address, address, uint256, uint256, bytes memory) public virtual returns (bytes4) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    if ($.executor() != address(this)) {
      revert GovernorDisabledDeposit();
    }
    return this.onERC1155Received.selector;
  }

  /**
   * @dev See {IERC721Receiver-onERC721Received}.
   * Receiving tokens is disabled if the governance executor is other than the governor itself (eg. when using with a timelock).
   */
  function onERC721Received(address, address, uint256, bytes memory) public virtual returns (bytes4) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    if ($.executor() != address(this)) {
      revert GovernorDisabledDeposit();
    }
    return this.onERC721Received.selector;
  }

  /**
   * @dev See {IERC1155Receiver-onERC1155BatchReceived}.
   * Receiving tokens is disabled if the governance executor is other than the governor itself (eg. when using with a timelock).
   */
  function onERC1155BatchReceived(
    address,
    address,
    uint256[] memory,
    uint256[] memory,
    bytes memory
  ) public virtual returns (bytes4) {
    GovernorStorageTypes.GovernorStorage storage $ = getGovernorStorage();
    if ($.executor() != address(this)) {
      revert GovernorDisabledDeposit();
    }
    return this.onERC1155BatchReceived.selector;
  }
}
