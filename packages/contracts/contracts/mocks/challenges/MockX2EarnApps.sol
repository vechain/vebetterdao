// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract MockX2EarnApps {
  mapping(bytes32 appId => bool exists) private _appExists;

  function setAppExists(bytes32 appId, bool exists) external {
    _appExists[appId] = exists;
  }

  function appExists(bytes32 appId) external view returns (bool) {
    return _appExists[appId];
  }
}
