// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IPassportModule {
  function getScore(address _user) external view returns (uint256);
}
