// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./x-alloaction-voting-governance/XAllocationVotingGovernor.sol";
import "./x-alloaction-voting-governance/modules/GovernorXAllocationVotesCounting.sol";
import "./x-alloaction-voting-governance/modules/GovernorVotes.sol";
import "./x-alloaction-voting-governance/modules/GovernorVotesQuorumFraction.sol";
import "./x-alloaction-voting-governance/modules/GovernorSettings.sol";

contract XAllocationVoting is
  XAllocationVotingGovernor,
  GovernorSettings,
  GovernorXAllocationVotesCounting,
  GovernorVotes,
  GovernorVotesQuorumFraction
{
  /**
   * @notice Construct a XAllocationVotingGovernor contract
   * @param _vot3Token The address of the Vot3 token used for voting
   * @param _quorumPercentage quorum as a percentage of the total supply at the block a proposal’s voting power is retrieved
   * @param _initialVotingPeriod How long does a proposal remain open to votes
   * @param _initialVotingDelay How long after a proposal is created should become active
   * @param _b3trGovernance The address of the B3trGovernance DAO
   */
  constructor(
    IVotes _vot3Token,
    uint256 _quorumPercentage,
    uint32 _initialVotingPeriod,
    uint48 _initialVotingDelay,
    address _b3trGovernance
  )
    XAllocationVotingGovernor("XAllocationVoting", _b3trGovernance)
    GovernorSettings(_initialVotingDelay, _initialVotingPeriod)
    GovernorVotes(_vot3Token)
    GovernorVotesQuorumFraction(_quorumPercentage)
  {}

  // The following functions are overrides required by Solidity.

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
}
