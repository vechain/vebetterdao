// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

interface IVoterRewards {
  error AccessControlBadConfirmation();

  error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

  error ReentrancyGuardReentrantCall();

  event RewardClaimed(uint256 indexed cycle, address indexed voter, uint256 reward);

  event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

  event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);

  event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

  event VoteRegistered(uint256 indexed cycle, address indexed voter, uint256 votes);

  function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

  function X_ALLOCATION_VOTE_REGISTRAR_ROLE() external view returns (bytes32);

  function b3tr() external view returns (address);

  function b3trBadge() external view returns (address);

  function claimReward(uint256 cycle, address voter) external;

  function cycleToTotal(uint256) external view returns (uint256);

  function cycleToVoterToTotal(uint256, address) external view returns (uint256);

  function emissions() external view returns (address);

  function getReward(uint256 cycle, address voter) external view returns (uint256);

  function getRoleAdmin(bytes32 role) external view returns (bytes32);

  function grantRole(bytes32 role, address account) external;

  function hasRole(bytes32 role, address account) external view returns (bool);

  function levelToMultiplier(uint256) external view returns (uint256);

  function registerXallocationVote(uint256 proposalStart, address voter, uint256 votes) external;

  function renounceRole(bytes32 role, address callerConfirmation) external;

  function revokeRole(bytes32 role, address account) external;

  function scalingFactor() external view returns (uint256);

  function setB3TRBadge(address _b3trBadge) external;

  function setEmissions(address _emissions) external;

  function setLevelToMultiplier(uint256 level, uint256 multiplier) external;

  function setScalingFactor(uint256 newScalingFactor) external;

  function setXallocationVoteRegistrarRole(address _voteRegistrar) external;

  function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
