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
import "./governance/modules/GovernorSettingsUpgradeable.sol";
import "./governance/modules/GovernorVotesUpgradeable.sol";
import "./governance/modules/GovernorVotesQuorumFractionUpgradeable.sol";
import "./governance/modules/GovernorTimelockControlUpgradeable.sol";
import "./governance/modules/GovernorCountingSimpleUpgradeable.sol";
import "./governance/modules/GovernorDepositUpgradeable.sol";
import "./governance/modules/GovernorFunctionsSettingsUpgradeable.sol";
import "./governance/modules/GovernorExternalContractsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IVoterRewards } from "./interfaces/IVoterRewards.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";
import { Math } from "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";

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
 * Once a proposal succeeds, it can be executed by the timelock contract.
 *
 * The contract is upgradeable and uses the UUPS pattern.
 */
contract B3TRGovernor is
  Initializable,
  AccessControlUpgradeable,
  GovernorUpgradeable,
  GovernorSettingsUpgradeable,
  GovernorCountingSimpleUpgradeable,
  GovernorVotesUpgradeable,
  GovernorVotesQuorumFractionUpgradeable,
  GovernorTimelockControlUpgradeable,
  GovernorDepositUpgradeable,
  GovernorFunctionsSettingsUpgradeable,
  GovernorExternalContractsUpgradeable,
  UUPSUpgradeable,
  PausableUpgradeable
{
  /// @notice The role that can whitelist allowed functions in the propose function
  bytes32 public constant GOVERNOR_FUNCTIONS_SETTINGS_ROLE = keccak256("GOVERNOR_FUNCTIONS_SETTINGS_ROLE");
  /// @notice The role that can pause the contract
  bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
  /// @notice The role that can set external contracts addresses
  bytes32 public constant CONTRACTS_ADDRESS_MANAGER_ROLE = keccak256("CONTRACTS_ADDRESS_MANAGER_ROLE");

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
   * @param voterRewards The address of the voter rewards contract
   * @param governorFunctionSettingsRoleAddress The address that should have the GOVERNOR_FUNCTIONS_SETTINGS_ROLE
   * @param isFunctionRestrictionEnabled If the function restriction is enabled
   */
  struct InitializationData {
    IVotes vot3Token;
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
    IVoterRewards voterRewards;
    address governorFunctionSettingsRoleAddress;
    bool isFunctionRestrictionEnabled;
  }

  /// @notice modifier to check if the caller has the specified role or if the function is called through a governance proposal
  modifier onlyRoleOrGovernance(bytes32 role) {
    if (!hasRole(role, _msgSender())) _checkGovernance();
    _;
  }

  /**
   * @dev Initializes the contract with the initial parameters
   */
  function initialize(InitializationData memory data) public initializer {
    __Governor_init("B3TRGovernor");
    __GovernorSettings_init(data.initialDepositThreshold, data.initialMinVotingDelay, data.initialVotingThreshold);
    __GovernorCountingSimple_init();
    __GovernorVotes_init(data.vot3Token);
    __GovernorVotesQuorumFraction_init(data.quorumPercentage);
    __GovernorTimelockControl_init(data.timelock);
    __GovernorDeposit_init(address(data.vot3Token));
    __GovernorFunctionsSettings_init(data.isFunctionRestrictionEnabled);
    __ExternalContracts_init(data.voterRewards, data.xAllocationVoting, data.b3tr);
    __AccessControl_init();
    __UUPSUpgradeable_init();
    __Pausable_init();

    _grantRole(DEFAULT_ADMIN_ROLE, data.governorAdmin);
    _grantRole(GOVERNOR_FUNCTIONS_SETTINGS_ROLE, data.governorFunctionSettingsRoleAddress);
    _grantRole(PAUSER_ROLE, data.pauser);
    _grantRole(CONTRACTS_ADDRESS_MANAGER_ROLE, data.contractsAddressManager);
  }

  // ------------------ GETTERS ------------------ //

  /**
   * @dev Function to know if a proposal is executable or not.
   * If the proposal was creted without any targets, values, or calldatas, it is not executable.
   * If the propsoal has targets then call GovernorUpgradeable and GovernorTimelockControlUpgradeable
   * to check if the proposal is executable.
   *
   * @param proposalId The id of the proposal
   */
  function proposalNeedsQueuing(
    uint256 proposalId
  ) public view override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (bool) {
    GovernorStorage storage $ = _getGovernorStorage();
    ProposalCore storage proposal = $._proposals[proposalId];
    if (proposal.roundIdVoteStart == 0) {
      return false;
    }

    if (proposal.isExecutable) {
      // Call GovernorUpgradeable and GovernorTimelockControlUpgradeable to check if the proposal is executable
      return super.proposalNeedsQueuing(proposalId);
    } else {
      return false;
    }
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

  // ------------------ Overrides ------------------ //

  function _authorizeUpgrade(address newImplementation) internal override onlyGovernance {}

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
  ) public override whenNotPaused returns (uint256) {
    return super.propose(targets, values, calldatas, description, startRoundId, depositAmount);
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
    return super.queue(targets, values, calldatas, descriptionHash);
  }

  /**
   * @dev See {IB3TRGovernor-execute}.
   */
  function execute(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) public payable override whenNotPaused returns (uint256) {
    return super.execute(targets, values, calldatas, descriptionHash);
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
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

    if (_msgSender() != proposalProposer(proposalId) && !hasRole(DEFAULT_ADMIN_ROLE, _msgSender())) {
      revert UnauthorizedAccess(_msgSender());
    }

    require(state(proposalId) == ProposalState.Pending, "Governor: proposal not pending");

    return _cancel(targets, values, calldatas, descriptionHash);
  }

  /**
   * @dev Set the voter rewards contract
   *
   * This function is only callable through goverance proposals or by the CONTRACTS_ADDRESS_MANAGER_ROLE
   *
   * @param _voterRewards The new voter rewards contract
   */
  function setVoterRewards(
    IVoterRewards _voterRewards
  ) public override onlyRoleOrGovernance(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    super.setVoterRewards(_voterRewards);
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
  ) public override onlyRoleOrGovernance(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    super.setXAllocationVoting(_xAllocationVoting);
  }

  /**
   * @dev Set the B3TR contract
   *
   * This function is only callable through goverance proposals or by the CONTRACTS_ADDRESS_MANAGER_ROLE
   *
   * @param _b3tr The new B3TR contract
   */
  function setB3tr(IB3TR _b3tr) public override onlyRoleOrGovernance(CONTRACTS_ADDRESS_MANAGER_ROLE) {
    super.setB3tr(_b3tr);
  }

  /**
   * @dev See {GovernorFunctionsSettingsUpgradeable-setWhitelistFunction}.
   *
   * This function is only callable by the GOVERNOR_FUNCTIONS_SETTINGS_ROLE
   */
  function setWhitelistFunction(
    address target,
    bytes4 functionSelector,
    bool isWhitelisted
  ) public override onlyRoleOrGovernance(GOVERNOR_FUNCTIONS_SETTINGS_ROLE) {
    super.setWhitelistFunction(target, functionSelector, isWhitelisted);
  }

  /**
   * @dev See {GovernorFunctionsSettingsUpgradeable-setWhitelistFunctions}.
   *
   * This function is only callable by the GOVERNOR_FUNCTIONS_SETTINGS_ROLE
   */
  function setWhitelistFunctions(
    address target,
    bytes4[] memory functionSelectors,
    bool isWhitelisted
  ) public override onlyRoleOrGovernance(GOVERNOR_FUNCTIONS_SETTINGS_ROLE) {
    super.setWhitelistFunctions(target, functionSelectors, isWhitelisted);
  }

  /**
   * @dev See {GovernorFunctionsSettingsUpgradeable-setIsFunctionRestrictionEnabled}.
   *
   * This function is only callable by the GOVERNOR_FUNCTIONS_SETTINGS_ROLE
   */
  function setIsFunctionRestrictionEnabled(
    bool isEnabled
  ) public override onlyRoleOrGovernance(GOVERNOR_FUNCTIONS_SETTINGS_ROLE) {
    super.setIsFunctionRestrictionEnabled(isEnabled);
  }

  // ------------------ Overrides riquired by solidity ------------------ //

  function state(
    uint256 proposalId
  ) public view override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (ProposalState) {
    return super.state(proposalId);
  }

  function quorum(
    uint256 blockNumber
  ) public view override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable) returns (uint256) {
    return super.quorum(blockNumber);
  }

  function depositThreshold() public view override(GovernorUpgradeable, GovernorSettingsUpgradeable) returns (uint256) {
    return super.depositThreshold();
  }

  function _queueOperations(
    uint256 proposalId,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (uint48) {
    return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
  }

  function _executeOperations(
    uint256 proposalId,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) {
    super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
  }

  function _cancel(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) internal override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (uint256) {
    return super._cancel(targets, values, calldatas, descriptionHash);
  }

  function _executor()
    internal
    view
    override(GovernorUpgradeable, GovernorTimelockControlUpgradeable)
    returns (address)
  {
    return super._executor();
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(GovernorUpgradeable, AccessControlUpgradeable) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
