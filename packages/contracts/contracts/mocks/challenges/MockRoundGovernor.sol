// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract MockRoundGovernor {
  uint256 private _currentRoundId;

  function setCurrentRoundId(uint256 roundId) external {
    _currentRoundId = roundId;
  }

  function currentRoundId() external view returns (uint256) {
    return _currentRoundId;
  }
}
