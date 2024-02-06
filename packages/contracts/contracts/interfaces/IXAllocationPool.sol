// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IXAllocationPool {
  event AppAdded(bytes32 indexed id, address addr, string name, string metadata, bool appAvailableForAllocationVoting);

  function isAppAvailableForAllocationVoting(bytes32 appId) external view returns (bool);

  function addApp(
    address appAddress,
    string memory name,
    string memory metadata,
    bool availableForAllocationVoting
  ) external;
}
