// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IProofOfSustainability {
  function registerAction(address user, bytes32 appId, string[] memory impactCodes, uint256[] memory impact) external;
}
