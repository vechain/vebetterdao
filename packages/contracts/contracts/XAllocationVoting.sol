// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./x-allocation-voting-governance/XAllocationVotingGovernor.sol";
import "./x-allocation-voting-governance/modules/GovernorXAllocationVotesCounting.sol";
import "./x-allocation-voting-governance/modules/GovernorVotes.sol";
import "./x-allocation-voting-governance/modules/GovernorVotesQuorumFraction.sol";
import "./x-allocation-voting-governance/modules/GovernorSettings.sol";
import "./x-allocation-voting-governance/modules/XApps.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract XAllocationVoting is
  XAllocationVotingGovernor,
  GovernorSettings,
  GovernorXAllocationVotesCounting,
  GovernorVotes,
  GovernorVotesQuorumFraction,
  AccessControl,
  XApps
{
  /**
   * @notice Construct a XAllocationVotingGovernor contract
   * @param _vot3Token The address of the Vot3 token used for voting
   * @param _quorumPercentage quorum as a percentage of the total supply at the block a proposal’s voting power is retrieved
   * @param _initialVotingPeriod How long does a proposal remain open to votes
   * @param _initialVotingDelay How long after a proposal is created should become active
   * @param _b3trGovernor The address of the B3trGovernor DAO
   * @param _admins The addresses of the admins (DAO + another address) that can update the XAllocationPool address, only DAO will remain in the final version
   */
  constructor(
    IVotes _vot3Token,
    uint256 _quorumPercentage,
    uint32 _initialVotingPeriod,
    uint48 _initialVotingDelay,
    address _b3trGovernor,
    address[] memory _admins
  )
    XAllocationVotingGovernor("XAllocationVoting", _b3trGovernor)
    GovernorSettings(_initialVotingDelay, _initialVotingPeriod)
    GovernorVotes(_vot3Token)
    GovernorVotesQuorumFraction(_quorumPercentage)
    XApps(_admins)
  {
    for (uint256 i = 0; i < _admins.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, _admins[i]);
    }
  }

  // ---------- Setters ---------- //
  function setB3trGovernanceAddress(address b3trGovernor_) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    _b3trGovernor = b3trGovernor_;
  }

  function _propose(address proposer) internal virtual override returns (uint256 proposalId) {
    ++_proposalCount;
    proposalId = _proposalCount;

    if (_proposals[proposalId].voteStart != 0) {
      revert GovernorUnexpectedProposalState(proposalId, state(proposalId), bytes32(0));
    }

    // save x-apps that users can vote for
    bytes32[] memory apps = allElegibleApps();
    _appsElegibleForVoting[proposalId] = apps;

    uint256 snapshot = clock() + votingDelay();
    uint256 duration = votingPeriod();

    ProposalCore storage proposal = _proposals[proposalId];
    proposal.proposer = proposer;
    proposal.voteStart = SafeCast.toUint48(snapshot);
    proposal.voteDuration = SafeCast.toUint32(duration);

    emit AllocationProposalCreated(proposalId, proposer, snapshot, snapshot + duration);

    // Using a named return variable to avoid stack too deep errors
  }

  // ---------- Getters ---------- //

  function getCurrentAllocationRoundSnapshot() public view returns (uint256) {
    uint256 currentId = currentRoundId();
    return proposalSnapshot(currentId);
  }

  // ---------- Required overrides ---------- //

  function votingDelay() public view override(XAllocationVotingGovernor, GovernorSettings) returns (uint256) {
    return super.votingDelay();
  }

  function votingPeriod() public view override(XAllocationVotingGovernor, GovernorSettings) returns (uint256) {
    return super.votingPeriod();
  }

  function quorum(
    uint256 blockNumber
  ) public view override(XAllocationVotingGovernor, GovernorVotesQuorumFraction) returns (uint256) {
    return super.quorum(blockNumber);
  }

  function state(uint256 proposalId) public view override(XAllocationVotingGovernor) returns (AllocationProposalState) {
    return super.state(proposalId);
  }

  function supportsInterface(
    bytes4 interfaceId
  ) public view override(AccessControl, XAllocationVotingGovernor, XApps) returns (bool) {
    return super.supportsInterface(interfaceId);
  }
}
