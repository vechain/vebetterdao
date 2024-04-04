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
    uint256 voteStartsInRound
  );

  error UnauthorizedAccess(address user);
  error GovernorInvalidRound(uint256 roundId);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /**
   * @dev Initializes the contract with the initial parameters
   * @param _vot3Token The address of the Vot3 token used for voting
   * @param _timelock The address of the Timelock
   * @param _xAllocationVotingGovernor The address of the xAllocationVotingGovernor
   * @param _quorumPercentage quorum as a percentage of the total supply at the block a proposal’s voting power is retrieved
   * @param _initialProposalThreshold The Proposal Threshold is the amount of voting power that an account needs to make a proposal
   */
  function initialize(
    IVotes _vot3Token,
    TimelockControllerUpgradeable _timelock,
    IXAllocationVotingGovernor _xAllocationVotingGovernor,
    uint256 _quorumPercentage,
    uint256 _initialProposalThreshold,
    address governorAdmin
  ) public initializer {
    __Governor_init("B3TRGovernor", _xAllocationVotingGovernor);
    __GovernorSettings_init(_initialProposalThreshold);
    __GovernorCountingSimple_init();
    __GovernorVotes_init(_vot3Token);
    __GovernorVotesQuorumFraction_init(_quorumPercentage);
    __GovernorTimelockControl_init(_timelock);
    __AccessControl_init();
    __UUPSUpgradeable_init();

    _grantRole(DEFAULT_ADMIN_ROLE, governorAdmin);
  }

  function _authorizeUpgrade(address newImplementation) internal override onlyGovernance {}

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

  function setXAllocationVotingGovernor(
    IXAllocationVotingGovernor _xAllocationVotingGovernor
  ) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _setXAllocationVotingGovernor(_xAllocationVotingGovernor);
  }

  function quorumReached(uint256 proposalId) public view returns (bool) {
    return _quorumReached(proposalId);
  }

  // The following functions are overrides required by Solidity.

  function votingPeriod() public view override(GovernorUpgradeable, GovernorSettingsUpgradeable) returns (uint256) {
    return super.votingPeriod();
  }

  function quorum(
    uint256 blockNumber
  ) public view override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable) returns (uint256) {
    return super.quorum(blockNumber);
  }

  /**
   * @dev See {IGovernor-state}.
   */
  function state(
    uint256 proposalId
  ) public view virtual override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (ProposalState) {
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

    if (proposal.voteStartsInRound == 0) {
      revert GovernorNonexistentProposal(proposalId);
    }

    // If the round where the proposal should be active is not started yet, the proposal is pending
    if ($._xAllocationVotingGovernor.currentRoundId() < proposal.voteStartsInRound) {
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
      return ProposalState.Queued;
    }
  }

  function proposalRound(uint256 proposalId) public view returns (uint256) {
    return _getGovernorStorage()._proposals[proposalId].voteStartsInRound;
  }

  function proposalNeedsQueuing(
    uint256 proposalId
  ) public view override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (bool) {
    return super.proposalNeedsQueuing(proposalId);
  }

  function proposalThreshold()
    public
    view
    override(GovernorUpgradeable, GovernorSettingsUpgradeable)
    returns (uint256)
  {
    return super.proposalThreshold();
  }

  /**
   * @dev See {IB3TRGovernor-propose}. This function has opt-in frontrunning protection, described in {_isValidDescriptionForProposer}.
   *
   * The {targetRoundId} parameter is used to specify the round in which the proposal should be active. The round must be in the future.
   */
  function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    uint256 targetRoundId
  ) public virtual returns (uint256) {
    address proposer = _msgSender();

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

    // round must be in the future
    uint256 currentRoundId = _getGovernorStorage()._xAllocationVotingGovernor.currentRoundId();
    if (currentRoundId == 0) {
      revert("Governor: emissions not started yet");
    }
    if (targetRoundId <= currentRoundId) {
      revert GovernorInvalidRound(targetRoundId);
    }

    // TODO: if between now and the start of the round is less then 3 days then revert

    return _propose(targets, values, calldatas, description, proposer, targetRoundId);
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
    uint256 roundId
  ) internal virtual returns (uint256 proposalId) {
    GovernorStorage storage $ = _getGovernorStorage();
    proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

    if (targets.length != values.length || targets.length != calldatas.length || targets.length == 0) {
      revert GovernorInvalidProposalLength(targets.length, calldatas.length, values.length);
    }
    if ($._proposals[proposalId].voteStartsInRound != 0) {
      // Proposal already exists
      revert GovernorUnexpectedProposalState(proposalId, state(proposalId), bytes32(0));
    }

    ProposalCore storage proposal = $._proposals[proposalId];
    proposal.proposer = proposer;
    proposal.voteStartsInRound = roundId;
    proposal.voteDuration = SafeCast.toUint32(votingPeriod());

    emit ProposalCreated(
      proposalId,
      proposer,
      targets,
      values,
      new string[](targets.length),
      calldatas,
      description,
      roundId
    );

    // Using a named return variable to avoid stack too deep errors
  }

  // To maintain compatibility with the previous version of the Governor, we need to override the propose function
  // to call the new propose function with a default value for roundId (currentRoundId + 1)
  function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description
  ) public virtual override returns (uint256) {
    GovernorStorage storage $ = _getGovernorStorage();
    uint256 currentRoundId = $._xAllocationVotingGovernor.currentRoundId();

    // call the new propose function with the next round id as default value
    return propose(targets, values, calldatas, description, currentRoundId + 1);
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
