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
  UUPSUpgradeable
{
  bytes32 public constant GOVERNOR_FUNCTIONS_SETTINGS_ROLE = keccak256("GOVERNOR_FUNCTIONS_SETTINGS_ROLE");

  error UnauthorizedAccess(address user);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @dev Struct containing data to initialize the contract
   * @param vot3Token The address of the Vot3 token used for voting
   * @param timelock The address of the Timelock
   * @param xAllocationVoting The address of the xAllocationVoting
   * @param quorumPercentage quorum as a percentage of the total supply at the block a proposal’s voting power is retrieved
   * @param initialDepositThreshold The Deposit Threshold is the amount of voting power that an account needs to make a proposal
   * @param initialMinVotingDelay The minimum delay before a proposal can start
   * @param initialVotingThreshold The minimum amount of voting power needed in order to vote
   * @param governorAdmin The address of the governor admin
   * @param voterRewards The address of the voter rewards contract
   * @param governorFunctionSettingsRoleAddress The address that should have the GOVERNOR_FUNCTIONS_SETTINGS_ROLE
   * @param isFunctionRestrictionEnabled If the function restriction is enabled
   */
  struct InitializationData {
    IVotes vot3Token;
    TimelockControllerUpgradeable timelock;
    IXAllocationVotingGovernor xAllocationVoting;
    uint256 quorumPercentage;
    uint256 initialDepositThreshold;
    uint256 initialMinVotingDelay;
    uint256 initialVotingThreshold;
    address governorAdmin;
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
    __ExternalContracts_init(data.voterRewards, data.xAllocationVoting);
    __AccessControl_init();
    __UUPSUpgradeable_init();

    _grantRole(DEFAULT_ADMIN_ROLE, data.governorAdmin);
    _grantRole(GOVERNOR_FUNCTIONS_SETTINGS_ROLE, data.governorFunctionSettingsRoleAddress);
  }

  // ------------------ GETTERS ------------------ //

  // ------------------ SETTERS ------------------ //

  /**
   * @dev See {GovernorExternalContractsUpgradeable-setVoterRewards}.
   *
   * This function is only callable through governance
   */
  function setVoterRewards(IVoterRewards _voterRewards) public override onlyGovernance {
    super.setVoterRewards(_voterRewards);
  }

  /**
   * @dev See {GovernorExternalContractsUpgradeable-setXAllocationVoting}.
   *
   * This function is only callable through governance
   */
  function setXAllocationVoting(IXAllocationVotingGovernor _xAllocationVoting) public override onlyGovernance {
    super.setXAllocationVoting(_xAllocationVoting);
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

  /**
   * @dev See {IB3TRGovernor-propose}. This function has opt-in frontrunning protection, described in {_isValidDescriptionForProposer}.
   *
   * The {startRoundId} parameter is used to specify the round in which the proposal should be active. The round must be in the future.
   *
   * @param targets The addresses of the contracts to call
   * @param values The values to send to the contracts
   * @param calldatas Function signatures and arguments
   * @param description The description of the proposal
   * @param startRoundId The round in which the proposal should be active
   * @param depositAmount The amount of tokens the proposer intends to deposit
   */
  function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    uint256 startRoundId,
    uint256 depositAmount
  ) public virtual returns (uint256) {
    address proposer = _msgSender();
    uint256 currentRoundId = xAllocationVoting().currentRoundId();

    // if allocation rounds did not start yet, revert, otherwise we will have issues with roundSnapshot and roundDeadline
    if (currentRoundId == 0) {
      revert GovernorInvalidStartRound(startRoundId);
    }

    // round must be in the future
    if (startRoundId <= currentRoundId) {
      revert GovernorInvalidStartRound(startRoundId);
    }

    // only do this check if user wants to start proposal in the next round
    if (startRoundId == currentRoundId + 1) {
      if (!canProposalStartInNextRound()) {
        revert GovernorInvalidStartRound(startRoundId);
      }
    }

    // check description restriction
    if (!_isValidDescriptionForProposer(proposer, description)) {
      revert GovernorRestrictedProposer(proposer);
    }

    return _propose(targets, values, calldatas, description, proposer, startRoundId, depositAmount);
  }

  /**
   * @dev Internal propose mechanism. Can be overridden to add more logic on proposal creation.
   *
   * @param targets The addresses of the contracts to call
   * @param values The values to send to the contracts
   * @param calldatas Function signatures and arguments
   * @param description The description of the proposal
   * @param proposer The address of the proposer
   * @param startRoundId The round in which the proposal should be active
   * @param depositAmount The amount of tokens the proposer intends to deposit
   *
   * Emits a {IB3TRGovernor-ProposalCreated} event.
   */
  // This function is getting market as a false positive by Slither as there is a reentrancy guard in place on _depositFunds
  // slither-disable-next-line reentrancy-no-eth
  function _propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    address proposer,
    uint256 startRoundId,
    uint256 depositAmount
  ) internal virtual returns (uint256 proposalId) {
    proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

    _validateProposeParams(targets, values, calldatas, proposalId);

    _checkFunctionsRestriction(targets, calldatas);

    _setProposal(
      proposalId,
      proposer,
      SafeCast.toUint32(votingPeriod()),
      startRoundId,
      targets.length > 0,
      depositAmount
    );

    _depositFunds(depositAmount, proposer, proposalId);

    emit ProposalCreated(
      proposalId,
      proposer,
      targets,
      values,
      new string[](targets.length),
      calldatas,
      description,
      startRoundId
    );

    // Using a named return variable to avoid stack too deep errors
  }

  /**
   * @dev Internal function to validate the propose parameters
   *
   * @param targets The addresses of the contracts to call
   * @param values The values to send to the contracts
   * @param calldatas Function signatures and arguments
   * @param proposalId The id of the proposal
   */
  function _validateProposeParams(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    uint256 proposalId
  ) internal view {
    GovernorStorage storage $ = _getGovernorStorage();

    if (targets.length != values.length || targets.length != calldatas.length) {
      revert GovernorInvalidProposalLength(targets.length, calldatas.length, values.length);
    }
    if ($._proposals[proposalId].roundIdVoteStart != 0) {
      // Proposal already exists
      revert GovernorUnexpectedProposalState(proposalId, state(proposalId), bytes32(0));
    }
  }

  /**
   * @dev Internal function to save the proposal data in storage
   *
   * @param proposalId The id of the proposal
   * @param proposer The address of the proposer
   * @param voteDuration The duration of the vote
   * @param roundIdVoteStart The round in which the proposal should be active
   * @param isExecutable If the proposal is executable
   * @param depositAmount The amount of tokens the proposer intends to deposit
   */
  function _setProposal(
    uint256 proposalId,
    address proposer,
    uint32 voteDuration,
    uint256 roundIdVoteStart,
    bool isExecutable,
    uint256 depositAmount
  ) internal {
    GovernorStorage storage $ = _getGovernorStorage();

    ProposalCore storage proposal = $._proposals[proposalId];

    proposal.proposer = proposer;
    proposal.roundIdVoteStart = roundIdVoteStart;
    proposal.voteDuration = voteDuration;
    proposal.isExecutable = isExecutable;
    proposal.depositAmount = depositAmount;
  }

  /**
   * @dev Internal function check if the targets and calldatas are whitelisted
   * @param targets The addresses of the contracts to call
   * @param calldatas Function signatures and arguments
   */
  function _checkFunctionsRestriction(address[] memory targets, bytes[] memory calldatas) internal view {
    GovernorFunctionsSettingsStorage storage $$ = _getGovernorFunctionsSettingsStorage();

    if ($$.isFunctionRestrictionEnabled == true) {
      for (uint256 i = 0; i < targets.length; i++) {
        bytes4 functionSelector = _extractFunctionSelector(calldatas[i]);
        if ($$.whitelistedFunctions[targets[i]][functionSelector] == false) {
          revert GovernorRestrictedFunction(functionSelector);
        }
      }
    }
  }

  function _extractFunctionSelector(bytes memory data) internal pure returns (bytes4) {
    if (data.length < 4) revert GovernorFunctionInvalidSelector(data);
    bytes4 sig;
    assembly {
      sig := mload(add(data, 32))
    }
    return sig;
  }

  // ------------------ OVERRIDES ------------------ //

  function _authorizeUpgrade(address newImplementation) internal override onlyGovernance {}

  /**
   * @dev See {Governor-cancel}.
   *
   * Proposal can be canceled by the proposer or by the admin before it becomes active.
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
