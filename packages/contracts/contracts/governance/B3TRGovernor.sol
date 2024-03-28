// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesQuorumFractionUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorTimelockControlUpgradeable.sol";
import "./modules/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import { IVoterRewards } from "../interfaces/IVoterRewards.sol";

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
  error UnauthorizedAccess(address user);

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  /// @custom:storage-location erc7201:b3tr.storage.B3TRGovernor
  struct B3TRGovernorStorage {
    IVoterRewards voterRewards;
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
   * @param _quorumPercentage quorum as a percentage of the total supply at the block a proposal’s voting power is retrieved
   * @param _initialVotingPeriod How long does a proposal remain open to votes
   * @param _initialVotingDelay How long after a proposal is created should become active
   * @param _initialProposalThreshold The Proposal Threshold is the amount of voting power that an account needs to make a proposal
   */
  function initialize(
    IVotes _vot3Token,
    TimelockControllerUpgradeable _timelock,
    uint256 _quorumPercentage,
    uint32 _initialVotingPeriod,
    uint48 _initialVotingDelay,
    uint256 _initialProposalThreshold,
    address governorAdmin,
    address _voterRewards
  ) public initializer {
    __Governor_init("B3TRGovernor");
    __GovernorSettings_init(_initialVotingDelay, _initialVotingPeriod, _initialProposalThreshold);
    __GovernorCountingSimple_init();
    __GovernorVotes_init(_vot3Token);
    __GovernorVotesQuorumFraction_init(_quorumPercentage);
    __GovernorTimelockControl_init(_timelock);
    __AccessControl_init();
    __UUPSUpgradeable_init();

    B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();

    $.voterRewards = IVoterRewards(_voterRewards);

    _grantRole(DEFAULT_ADMIN_ROLE, governorAdmin);
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

  // ------------------ GETTERS ------------------ //

  function quorumReached(uint256 proposalId) public view returns (bool) {
    return _quorumReached(proposalId);
  }

  // ------------------ SETTERS ------------------ //

  function setVoterRewards(address _voterRewards) public onlyGovernance {
    B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();

    $.voterRewards = IVoterRewards(_voterRewards);
  }

  // ------------------ OVERRIDES ------------------ //

  function _authorizeUpgrade(address newImplementation) internal override onlyGovernance {}

  function votingDelay() public view override(GovernorUpgradeable, GovernorSettingsUpgradeable) returns (uint256) {
    return super.votingDelay();
  }

  function votingPeriod() public view override(GovernorUpgradeable, GovernorSettingsUpgradeable) returns (uint256) {
    return super.votingPeriod();
  }

  function quorum(
    uint256 blockNumber
  ) public view override(GovernorUpgradeable, GovernorVotesQuorumFractionUpgradeable) returns (uint256) {
    return super.quorum(blockNumber);
  }

  function state(
    uint256 proposalId
  ) public view override(GovernorUpgradeable, GovernorTimelockControlUpgradeable) returns (ProposalState) {
    return super.state(proposalId);
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

  function castVote(uint256 proposalId, uint8 support) public override(GovernorUpgradeable) returns (uint256) {
    uint256 weight = super.castVote(proposalId, support);

    if (weight > 0) {
      B3TRGovernorStorage storage $ = _getB3TRGovernorStorage();

      uint256 proposalSnapshot = proposalSnapshot(proposalId);

      $.voterRewards.registerVote(proposalSnapshot, msg.sender, weight);
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
