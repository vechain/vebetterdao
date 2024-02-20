// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

interface IXAllocationPool {
  event AllocationRewardsClaimed(
    bytes32 indexed appId,
    uint256 roundId,
    uint256 amount,
    address indexed recipient,
    address caller
  );

  function forecastClaimableAmountForActiveRound(bytes32 appId) external view returns (uint256);

  function claimableAmount(uint256 roundId, bytes32 appId) external view returns (uint256);

  function baseAllocationAmount(uint256 roundId) external view returns (uint256);

  function getAppShares(uint256 roundId, bytes32 appId) external view returns (uint256);
}
