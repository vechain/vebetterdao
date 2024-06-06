// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library X2EarnAppsDataTypes {
  struct App {
    bytes32 id;
    string name;
    uint256 createdAtTimestamp;
  }

  struct AppWithDetails {
    bytes32 id;
    address teamWalletAddress;
    string name;
    string metadataURI;
    uint256 createdAtTimestamp;
    address admin;
    address[] moderators;
    uint256 teamAllocationPercentage;
    bool appAvailableForAllocationVoting;
  }
}
