// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract MockPassportActions {
  mapping(address account => mapping(uint256 roundId => uint256 count)) private _userRoundActionCount;
  mapping(address account => mapping(uint256 roundId => mapping(bytes32 appId => uint256 count))) private _userRoundActionCountApp;

  function setUserRoundActionCount(address account, uint256 roundId, uint256 count) external {
    _userRoundActionCount[account][roundId] = count;
  }

  function setUserRoundActionCountApp(address account, uint256 roundId, bytes32 appId, uint256 count) external {
    _userRoundActionCountApp[account][roundId][appId] = count;
  }

  function userRoundActionCount(address account, uint256 roundId) external view returns (uint256) {
    return _userRoundActionCount[account][roundId];
  }

  function userRoundActionCountApp(address account, uint256 roundId, bytes32 appId) external view returns (uint256) {
    return _userRoundActionCountApp[account][roundId][appId];
  }
}
