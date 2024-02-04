// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IXAllocationPool } from "./interfaces/IXAllocationPool.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";

contract XAllocationPool is IXAllocationPool, AccessControl {
  // Mapping from app ID to app
  mapping(bytes32 => App) private apps;

  // List of app IDs to enable retrieval of all apps
  bytes32[] private appIds;

  constructor(address[] memory admins) {
    for (uint i = 0; i < admins.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, admins[i]);
    }
  }

  function isAppAvailableForAllocationVoting(bytes32 appId) public view virtual override returns (bool) {
    return apps[appId].appAvailableForAllocationVoting;
  }

  function addApp(address appAddress, string memory name) public override onlyRole(DEFAULT_ADMIN_ROLE) {
    // Convert name to bytes32 ID
    bytes32 id = keccak256(abi.encodePacked(name));

    // Check if an app with the same ID already exists
    require(apps[id].addr == address(0), "App with this ID already exists");

    // Store the new app
    apps[id] = App(id, appAddress, true);
    appIds.push(id); // Store the ID for retrieval of all apps

    // Emit an event
    emit AppAdded(id, appAddress);
  }

  // Function to retrieve an app by ID
  function getApp(bytes32 id) public view override returns (address) {
    require(apps[id].addr != address(0), "App does not exist");
    return apps[id].addr;
  }

  // Function to retrieve all apps
  function getAllApps() public view returns (App[] memory) {
    App[] memory allApps = new App[](appIds.length);
    for (uint i = 0; i < appIds.length; i++) {
      allApps[i] = apps[appIds[i]];
    }
    return allApps;
  }
}
