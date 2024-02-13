// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IXAllocationPool {
  event AllocationRewardsClaimed(
    bytes32 indexed appId,
    uint256 roundId,
    uint256 amount,
    address indexed recipient,
    address caller
  );

  function calculateAllocationRewards(
    uint256 roundId,
    uint256 lastSucceededRoundId,
    bytes32 appId
  ) external view returns (uint256);

  function baseAllocation(uint256 roundId) external view returns (uint256);

  function variableAllocation(
    uint256 roundId,
    uint256 lastSucceededRoundId,
    bytes32 appId
  ) external view returns (uint256);

  function calculateAppShares(uint256 roundId, bytes32 appId) external view returns (uint256);
}
