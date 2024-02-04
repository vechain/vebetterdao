// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

abstract contract IXAllocationPool {
  struct App {
    bytes32 id;
    address addr;
    bool appAvailableForAllocationVoting;
  }

  event AppAdded(bytes32 indexed id, address addr);

  function isAppAvailableForAllocationVoting(bytes32 appId) public view virtual returns (bool);

  function addApp(address appAddress, string memory name) public virtual;

  function getApp(bytes32 id) public view virtual returns (address);
}
