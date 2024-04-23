// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library DataTypes {
  struct App {
    bytes32 id;
    address receiverAddress;
    string name;
    string metadataURI;
    uint48 createdAt; // block number when app was added
    uint256 createdAtTimestamp;
  }
}
