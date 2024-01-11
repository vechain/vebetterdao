// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AppVotingGovernor.sol";
import "./modules/GovernorCounting.sol";
import "./modules/GovernorVotes.sol";
import "./modules/GovernorVotesQuorumFraction.sol";
import "./modules/GovernorSettings.sol";

// import "./B3trApps.sol";

contract VotingContract is
  AppVotingGovernor,
  GovernorSettings,
  GovernorCounting,
  GovernorVotes,
  GovernorVotesQuorumFraction
{
  /**
   * @notice Construct a AppVotingGovernor contract
   * @param _vot3Token The address of the Vot3 token used for voting
   * @param _quorumPercentage quorum as a percentage of the total supply at the block a proposal’s voting power is retrieved
   * @param _initialVotingPeriod How long does a proposal remain open to votes
   * @param _initialVotingDelay How long after a proposal is created should become active
   * @param _initialProposalThreshold The Proposal Threshold is the amount of voting power that an account needs to make a proposal
   */
  constructor(
    IVotes _vot3Token,
    uint256 _quorumPercentage,
    uint32 _initialVotingPeriod,
    uint48 _initialVotingDelay,
    uint256 _initialProposalThreshold,
    address _admin
  )
    AppVotingGovernor("AppsGovernorContract", _admin)
    GovernorSettings(_initialVotingDelay, _initialVotingPeriod, _initialProposalThreshold)
    GovernorVotes(_vot3Token)
    GovernorVotesQuorumFraction(_quorumPercentage)
  {}

  // The following functions are overrides required by Solidity.

  function votingDelay() public view override(AppVotingGovernor, GovernorSettings) returns (uint256) {
    return super.votingDelay();
  }

  function votingPeriod() public view override(AppVotingGovernor, GovernorSettings) returns (uint256) {
    return super.votingPeriod();
  }

  function quorum(
    uint256 blockNumber
  ) public view override(AppVotingGovernor, GovernorVotesQuorumFraction) returns (uint256) {
    return super.quorum(blockNumber);
  }

  function state(uint256 proposalId) public view override(AppVotingGovernor) returns (ProposalState) {
    return super.state(proposalId);
  }

  function proposalThreshold() public view override(AppVotingGovernor, GovernorSettings) returns (uint256) {
    return super.proposalThreshold();
  }
}
