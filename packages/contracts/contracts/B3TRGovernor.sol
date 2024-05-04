// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./governance/GovernorUpgradeable.sol";
import "./governance/modules/GovernorSettingsUpgradeable.sol";
import "./governance/modules/GovernorVotesUpgradeable.sol";
import "./governance/modules/GovernorVotesQuorumFractionUpgradeable.sol";
import "./governance/modules/GovernorTimelockControlUpgradeable.sol";
import "./governance/modules/GovernorCountingSimpleUpgradeable.sol";
import "./governance/modules/GovernorDepositUpgradeable.sol";
import "./governance/modules/GovernorFunctionsSettingsUpgradeable.sol";
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
  UUPSUpgradeable
{
  bytes32 public constant GOVERNOR_FUNCTIONS_SETTINGS_ROLE = keccak256("GOVERNOR_FUNCTIONS_SETTINGS_ROLE");
  bytes32 public constant PROPOSAL_EXECUTOR_ROLE = keccak256("PROPOSAL_EXECUTOR_ROLE");
  bytes32 public constant PROPOSAL_QUEUER_ROLE = keccak256("PROPOSAL_QUEUER_ROLE");

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
   * @param governorAdmin The address of the governor admin
   * @param proposalQueuer The address that should have the PROPOSAL_QUEUER_ROLE
   * @param proposalExecutor The address that should be set as executor and have the PROPOSAL_EXECUTOR_ROLE
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
    address governorAdmin;
    address proposalQueuer;
    address proposalExecutor;
    address voterRewards;
    address governorFunctionSettingsRoleAddress;
    bool isFunctionRestrictionEnabled;
  }

  /// @custom:storage-location erc7201:b3tr.storage.B3TRGovernor
  struct B3TRGovernorStorage {
    IVoterRewards voterRewards;
    IXAllocationVotingGovernor xAllocationVoting;
  }

  // keccak256(abi.encode(uint256(keccak256("b3tr.storage.B3TRGovernor")) - 1)) & ~bytes32(uint256(0xff))
  bytes32 private constant B3TRGovernorStorageLocation =
    0x25dff2c77042a04dd0be920205965690a1ebd1f0dd565f4fe04be0006d94d400;

  function _getB3TRGovernorStorage() private pure returns (B3TRGovernorStorage storage $) {
    assembly {
      $.slot := B3TRGovernorStorageLocation
    }
  }

  /// @notice modifier to check if the caller has the specified role or if the function is called through a governance proposal
  modifier onlyRoleOrGovernance(bytes32 role) {
    if (!hasRole(role, _msgSender())) _checkGovernance();
    _;
  }

  function initialize(InitializationData memory data) public initializer {
    __Governor_init("B3TRGovernor");
    __GovernorSettings_init(data.initialDepositThreshold, data.initialMinVotingDelay);
    __GovernorCountingSimple_init();
    __GovernorVotes_init(data.vot3Token);
    __GovernorVotesQuorumFraction_init(data.quorumPercentage);
    __GovernorTimelockControl_init(data.timelock);
    __GovernorDeposit_init(address(data.vot3Token));
    __GovernorFunctionsSettings_init(data.isFunctionRestrictionEnabled);
    __AccessControl_init();
    __UUPSUpgradeable_init();

    B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();
    $.voterRewards = IVoterRewards(data.voterRewards);
    $.xAllocationVoting = data.xAllocationVoting;

    _grantRole(DEFAULT_ADMIN_ROLE, data.governorAdmin);
    _grantRole(GOVERNOR_FUNCTIONS_SETTINGS_ROLE, data.governorFunctionSettingsRoleAddress);
    _grantRole(PROPOSAL_EXECUTOR_ROLE, data.proposalExecutor);
    _grantRole(PROPOSAL_QUEUER_ROLE, data.proposalQueuer);

    // self administration
    // _grantRole(DEFAULT_ADMIN_ROLE, address(this));
  }

  // ------------------ MODIFIERS ------------------ //
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

  // ------------------ GETTERS ------------------ //

  function xAllocationVotingAddress() public view returns (IXAllocationVotingGovernor) {
    return _getB3TRGovernorStorage().xAllocationVoting;
  }

  function voterRewardsAddress() public view returns (IVoterRewards) {
    return _getB3TRGovernorStorage().voterRewards;
  }

  function canProposalStartInNextRound() public view returns (bool) {
    B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();
    uint256 currentRoundId = $.xAllocationVoting.currentRoundId();
    uint256 minVotingDelay = minVotingDelay();
    uint256 currentRoundDeadline = $.xAllocationVoting.roundDeadline(currentRoundId);
    uint48 currentBlock = clock();

    // this could happen if the round ended and the next one not started yet
    if (currentRoundDeadline <= currentBlock) {
      return false;
    }

    // if between now and the start of the new round is less then the min delay, revert
    if (minVotingDelay > currentRoundDeadline - currentBlock) {
      return false;
    }

    return true;
  }

  // ------------------ SETTERS ------------------ //

  function setVoterRewards(address _voterRewards) public onlyGovernance {
    B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();

    $.voterRewards = IVoterRewards(_voterRewards);
  }

  function setXAllocationVoting(IXAllocationVotingGovernor _xAllocationVoting) public onlyGovernance {
    B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();
    $.xAllocationVoting = _xAllocationVoting;
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
    uint256 currentRoundId = _getB3TRGovernorStorage().xAllocationVoting.currentRoundId();

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
    GovernorStorage storage $ = _getGovernorStorage();
    GovernorFunctionsSettingsStorage storage $$ = _getGovernorFunctionsSettingsStorage();
    proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

    if (targets.length != values.length || targets.length != calldatas.length) {
      revert GovernorInvalidProposalLength(targets.length, calldatas.length, values.length);
    }
    if ($._proposals[proposalId].roundIdVoteStart != 0) {
      // Proposal already exists
      revert GovernorUnexpectedProposalState(proposalId, state(proposalId), bytes32(0));
    }

    // Check if the calldatas function selectors are whitelisted
    if ($$.isFunctionRestrictionEnabled == true) {
      for (uint256 i = 0; i < targets.length; i++) {
        bytes4 functionSelector = _extractFunctionSelector(calldatas[i]);
        if ($$.whitelistedFunctions[targets[i]][functionSelector] == false) {
          revert GovernorRestrictedFunction(functionSelector);
        }
      }
    }

    ProposalCore storage proposal = $._proposals[proposalId];
    proposal.proposer = proposer;
    proposal.roundIdVoteStart = startRoundId;
    proposal.voteDuration = SafeCast.toUint32(votingPeriod());
    proposal.isExecutable = targets.length > 0;
    proposal.depositAmount = depositAmount;

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
   * @dev See {IB3TRGovernor-queue}.
   */
  function queue(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
  ) public override onlyRoleOrOpenRole(PROPOSAL_QUEUER_ROLE) returns (uint256) {
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
  ) public payable override onlyRoleOrOpenRole(PROPOSAL_EXECUTOR_ROLE) returns (uint256) {
    return super.execute(targets, values, calldatas, descriptionHash);
  }

  /**
   * @dev See {IB3TRGovernor-proposalSnapshot}.
   *
   * We take for granted that the round starts the block after it ends. But it can happen that the round is not started yet for whatever reason.
   * Knowing this, if the proposal starts 4 rounds in the future we need to consider also those extra blocks used to start the rounds.
   */
  function proposalSnapshot(uint256 proposalId) public view virtual override returns (uint256) {
    B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();
    GovernorStorage storage $$ = _getGovernorStorage();

    // round when proposal should be active is already started
    if ($.xAllocationVoting.currentRoundId() >= $$._proposals[proposalId].roundIdVoteStart) {
      return $.xAllocationVoting.roundSnapshot($$._proposals[proposalId].roundIdVoteStart);
    }

    uint256 amountOfRoundsLeft = $$._proposals[proposalId].roundIdVoteStart - $.xAllocationVoting.currentRoundId();
    uint256 roundsDurationLeft = $.xAllocationVoting.votingPeriod() * (amountOfRoundsLeft - 1); // -1 because if only 1 round left we want this to be 0
    uint256 currentRoundDeadline = $.xAllocationVoting.currentRoundDeadline();

    // if current round ended and a new one did not start yet
    if (currentRoundDeadline <= clock()) {
      currentRoundDeadline = clock();
    }

    return currentRoundDeadline + roundsDurationLeft + amountOfRoundsLeft;
  }

  /**
   * @dev See {IB3TRGovernor-proposalDeadline}.
   */
  function proposalDeadline(uint256 proposalId) public view virtual override returns (uint256) {
    B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();
    GovernorStorage storage $$ = _getGovernorStorage();

    // if round is active or already occured proposal end block is the block when round ends
    if ($.xAllocationVoting.currentRoundId() >= $$._proposals[proposalId].roundIdVoteStart) {
      return $.xAllocationVoting.roundDeadline($$._proposals[proposalId].roundIdVoteStart);
    }

    // if we call this function before the round starts, it will return 0, so we need to estimate the end block
    return proposalSnapshot(proposalId) + $.xAllocationVoting.votingPeriod();
  }

  /**
   * @dev See {IB3TRGovernor-castVote}.
   */
  function castVote(uint256 proposalId, uint8 support) public override(GovernorUpgradeable) returns (uint256) {
    uint256 weight = super.castVote(proposalId, support);

    if (weight > 0) {
      B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();

      $.voterRewards.registerVote(proposalSnapshot(proposalId), msg.sender, weight);
    }

    return weight;
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
   * @dev See {IB3TRGovernor-votingPeriod}.
   */
  function votingPeriod() public view virtual override returns (uint256) {
    B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();

    return $.xAllocationVoting.votingPeriod();
  }

  /**
   * @dev See {IB3TRGovernor-state}.
   *
   * This function is the copy of what was inside GovernorUpgradeable plus the copy of GovernorTimelockControlUpgradeable (when it ends up in QUEUED state),
   * modified however to check the PENDING state based on roundId instead of based on the snapshot block.
   */
  function state(uint256 proposalId) public view virtual override returns (ProposalState) {
    GovernorStorage storage $ = _getGovernorStorage();
    // We read the struct fields into the stack at once so Solidity emits a single SLOAD
    ProposalCore storage proposal = $._proposals[proposalId];
    bool proposalExecuted = proposal.executed;
    bool proposalCanceled = proposal.canceled;

    if (proposalExecuted) {
      return ProposalState.Executed;
    }

    if (proposalCanceled) {
      return ProposalState.Canceled;
    }

    if (proposal.roundIdVoteStart == 0) {
      revert GovernorNonexistentProposal(proposalId);
    }

    // If the round where the proposal should be active is not started yet, the proposal is pending
    if (_getB3TRGovernorStorage().xAllocationVoting.currentRoundId() < proposal.roundIdVoteStart) {
      return ProposalState.Pending;
    }

    uint256 currentTimepoint = clock();

    uint256 deadline = proposalDeadline(proposalId);

    if (deadline >= currentTimepoint) {
      if (proposalDepositReached(proposalId)) {
        return ProposalState.Active;
      } else {
        return ProposalState.DepositNotMet;
      }
    } else if (!_quorumReached(proposalId) || !_voteSucceeded(proposalId)) {
      return ProposalState.Defeated;
    } else if (proposalEta(proposalId) == 0) {
      return ProposalState.Succeeded;
    } else {
      // Forked from GovernorTimelockControlUpgradeable:state OZ implementation
      GovernorTimelockControlStorage storage $$ = _getGovernorTimelockControlStorage();
      bytes32 queueid = $$._timelockIds[proposalId];
      if ($$._timelock.isOperationPending(queueid)) {
        return ProposalState.Queued;
      } else if ($$._timelock.isOperationDone(queueid)) {
        // This can happen if the proposal is executed directly on the timelock.
        return ProposalState.Executed;
      } else {
        // This can happen if the proposal is canceled directly on the timelock.
        return ProposalState.Canceled;
      }
    }
  }

  function proposalNeedsQueuing(
    uint256 proposalId
  ) public view override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (bool) {
    GovernorStorage storage $ = _getGovernorStorage();
    ProposalCore storage proposal = $._proposals[proposalId];
    if (proposal.roundIdVoteStart == 0) {
      revert GovernorNonexistentProposal(proposalId);
    }

    return proposal.isExecutable;
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
