// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IGovernanceSettings {
  function proposalThreshold() external view returns (uint256);

  function minVotingDelay() external view returns (uint256);
}
