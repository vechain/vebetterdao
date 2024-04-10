// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { IGovernor } from "./IGovernor.sol";

interface IB3TRGovernor is IGovernor {
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
  event MinVotingDelaySet(uint256 oldMinMinVotingDelay, uint256 newMinVotingDelay);

  error GovernorInvalidStartRound(uint256 roundId);

  function hasVotedOnce(address user) external view returns (bool);

  function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    uint256 startRoundId
  ) external returns (uint256 proposalId);

  function proposalStartRound(uint256 proposalId) external view returns (uint256);

  function canProposalStartInNextRound() external view returns (bool);

  function minVotingDelay() external view returns (uint256);

  function setMinVotingDelay(uint256 newMinVotingDelay) external;
}
