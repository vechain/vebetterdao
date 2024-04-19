// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./governance/GovernorUpgradeable.sol";
import "./governance/modules/GovernorSettingsUpgradeable.sol";
import "./governance/modules/GovernorVotesUpgradeable.sol";
import "./governance/modules/GovernorVotesQuorumFractionUpgradeable.sol";
import "./governance/modules/GovernorTimelockControlUpgradeable.sol";
import "./governance/modules/GovernorCountingSimpleUpgradeable.sol";
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
  UUPSUpgradeable
{
  /**
   * @dev Emitted when a proposal is created.
   */
  event ProposalCreated(
    uint256 proposalId,
    address proposer,
    address[] targets,
    uint256[] values,
    string[] signatures,
    bytes[] calldatas,
    string description,
    uint256 roundIdVoteStart
  );

  error UnauthorizedAccess(address user);
  error GovernorInvalidStartRound(uint256 roundId);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
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

  /**
   * @dev Initializes the contract with the initial parameters
   * @param _vot3Token The address of the Vot3 token used for voting
   * @param _timelock The address of the Timelock
   * @param _xAllocationVoting The address of the xAllocationVoting
   * @param _quorumPercentage quorum as a percentage of the total supply at the block a proposal’s voting power is retrieved
   * @param _initialProposalThreshold The Proposal Threshold is the amount of voting power that an account needs to make a proposal
   * @param _initialMinVotingDelay The minimum delay before a proposal can start
   * @param governorAdmin The address of the governor admin
   * @param _voterRewards The address of the voter rewards contract
   */
  function initialize(
    IVotes _vot3Token,
    TimelockControllerUpgradeable _timelock,
    IXAllocationVotingGovernor _xAllocationVoting,
    uint256 _quorumPercentage,
    uint256 _initialProposalThreshold,
    uint256 _initialMinVotingDelay,
    address governorAdmin,
    address _voterRewards
  ) public initializer {
    __Governor_init("B3TRGovernor");
    __GovernorSettings_init(_initialProposalThreshold, _initialMinVotingDelay);
    __GovernorCountingSimple_init();
    __GovernorVotes_init(_vot3Token);
    __GovernorVotesQuorumFraction_init(_quorumPercentage);
    __GovernorTimelockControl_init(_timelock);
    __AccessControl_init();
    __UUPSUpgradeable_init();

    B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();
    $.voterRewards = IVoterRewards(_voterRewards);
    $.xAllocationVoting = _xAllocationVoting;

    _grantRole(DEFAULT_ADMIN_ROLE, governorAdmin);
  }

  // ------------------ GETTERS ------------------ //

  function quorumReached(uint256 proposalId) public view returns (bool) {
    return _quorumReached(proposalId);
  }

  function proposalStartRound(uint256 proposalId) public view returns (uint256) {
    return _getGovernorStorage()._proposals[proposalId].roundIdVoteStart;
  }

  function xAllocationVotingAddress() public view returns (IXAllocationVotingGovernor) {
    return _getB3TRGovernorStorage().xAllocationVoting;
  }

  function voterRewardsAddress() public view returns (IVoterRewards) {
    return _getB3TRGovernorStorage().voterRewards;
  }

  /**
   * @dev returns the quadratic voting power that `account` has.
   */
  function getQuadraticVotingPower(address account, uint256 timepoint) public view virtual returns (uint256) {
    // scale the votes by 1e9 so that number returned is 1e18
    return Math.sqrt(_getVotes(account, timepoint, _defaultParams())) * 1e9;
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
   * @dev See {IB3TRGovernor-propose}. This function has opt-in frontrunning protection, described in {_isValidDescriptionForProposer}.
   *
   * The {startRoundId} parameter is used to specify the round in which the proposal should be active. The round must be in the future.
   */
  function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    uint256 startRoundId
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

    // check proposal threshold
    uint256 proposerVotes = getVotes(proposer, clock() - 1);
    uint256 votesThreshold = proposalThreshold();
    if (proposerVotes < votesThreshold) {
      revert GovernorInsufficientProposerVotes(proposer, proposerVotes, votesThreshold);
    }

    return _propose(targets, values, calldatas, description, proposer, startRoundId);
  }

  /**
   * @dev Internal propose mechanism. Can be overridden to add more logic on proposal creation.
   *
   * Emits a {IB3TRGovernor-ProposalCreated} event.
   */
  function _propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    address proposer,
    uint256 startRoundId
  ) internal virtual returns (uint256 proposalId) {
    GovernorStorage storage $ = _getGovernorStorage();
    proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

    if (targets.length != values.length || targets.length != calldatas.length) {
      revert GovernorInvalidProposalLength(targets.length, calldatas.length, values.length);
    }
    if ($._proposals[proposalId].roundIdVoteStart != 0) {
      // Proposal already exists
      revert GovernorUnexpectedProposalState(proposalId, state(proposalId), bytes32(0));
    }

    ProposalCore storage proposal = $._proposals[proposalId];
    proposal.proposer = proposer;
    proposal.roundIdVoteStart = startRoundId;
    proposal.voteDuration = SafeCast.toUint32(votingPeriod());
    proposal.isExecutable = targets.length > 0;

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

  // ------------------ OVERRIDES ------------------ //

  function _authorizeUpgrade(address newImplementation) internal override onlyGovernance {}

  /**
   * @dev See {IGovernor-proposalSnapshot}.
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
   * @dev See {IGovernor-proposalDeadline}.
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

  // The following functions are overrides required by Solidity.

  /**
   * @dev See {IGovernor-votingPeriod}.
   */
  function votingPeriod() public view virtual override returns (uint256) {
    B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();

    return $.xAllocationVoting.votingPeriod();
  }

  function quorum(
    uint256 blockNumber
  ) public view override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable) returns (uint256) {
    return super.quorum(blockNumber);
  }

  /**
   * @dev See {IGovernor-state}.
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
      return ProposalState.Active;
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

  function proposalThreshold()
    public
    view
    override(GovernorUpgradeable, GovernorSettingsUpgradeable)
    returns (uint256)
  {
    return super.proposalThreshold();
  }

  // To maintain compatibility with the previous version of the Governor, we need to override the propose function
  // to call the new propose function with a default value for roundId (currentRoundId + 1)
  function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description
  ) public virtual override returns (uint256) {
    B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();
    uint256 currentRoundId = $.xAllocationVoting.currentRoundId();

    // call the new propose function with the next round id as default value
    return propose(targets, values, calldatas, description, currentRoundId + 1);
  }

  function castVote(uint256 proposalId, uint8 support) public override(GovernorUpgradeable) returns (uint256) {
    uint256 weight = super.castVote(proposalId, support);

    if (weight > 0) {
      B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();

      $.voterRewards.registerVote(proposalSnapshot(proposalId), msg.sender, weight);
    }

    return weight;
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
