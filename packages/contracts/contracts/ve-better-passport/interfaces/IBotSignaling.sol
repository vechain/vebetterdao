// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IBotSignaling {
  event UserWhitelisted(address indexed user, address indexed whitelister);
  event UserSignaled(address indexed user, address indexed signaler, bytes32 indexed app);
  event SignalerAssignedToApp(address indexed signaler, bytes32 indexed app);
  event SignalerRemovedFromApp(address indexed signaler, bytes32 indexed app);

  error BotSignalingUnauthorizedUser(address user);

  function whitelistUser(address user) external;

  function signalUser(address user) external;

  function isWhitelisted(address _user) external view returns (bool);

  function signaledCounter(address _user) external view returns (uint256);
}
