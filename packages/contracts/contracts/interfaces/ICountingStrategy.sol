// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ICountingStrategy {
  function hasVotedOnce(address account) external view returns (bool);

  function hasVoted(uint256 proposalId, address account) external view returns (bool);

  function proposalVotes(
    uint256 proposalId
  ) external view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes);

  function proposalTotalVotes(uint256 proposalId) external view returns (uint256);

  function _countVote(
    uint256 proposalId,
    address account,
    uint8 support,
    uint256 weight,
    uint256 power,
    bytes memory params
  ) external;

  function COUNTING_MODE() external pure returns (string memory);
}
