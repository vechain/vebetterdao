// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

interface IEmissions {
  error AccessControlBadConfirmation();

  error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

  error ReentrancyGuardReentrantCall();

  event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);

  event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
  
  event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

  function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

  function MINTER_ROLE() external view returns (bytes32);

  function START_BLOCK() external view returns (uint256);

  function b3tr() external view returns (address);

  function cycleDuration() external view returns (uint256);

  function distribute() external;

  function distributeLast() external;

  function getCurrentCycle() external view returns (uint256);

  function getCurrentTreasuryAmount() external view returns (uint256);

  function getCurrentVote2EarnAmount() external view returns (uint256);

  function getCurrentXAllocationsAmount() external view returns (uint256);

  function getCycleBlock(uint256 cycle) external view returns (uint256);

  function getCycleFromBlock(uint256 blockNumber) external view returns (uint256);

  function getLastTreasuryAmount() external view returns (uint256);

  function getLastVote2EarnAmount() external view returns (uint256);

  function getLastXAllocationsAmount() external view returns (uint256);

  function getPreMintAllocations() external view returns (uint256[] memory);

  function getRemainingEmissions() external view returns (uint256);

  function getRoleAdmin(bytes32 role) external view returns (bytes32);

  function getScaledDecayPercentage(uint256 decayPercentage) external view returns (uint256);

  function getTreasuryAmount(uint256 blockNumber) external view returns (uint256);

  function getTreasuryAmountForCycle(uint256 cycle) external view returns (uint256);

  function getVote2EarnAmount(uint256 blockNumber) external view returns (uint256);

  function getVote2EarnAmountForCycle(uint256 cycle) external view returns (uint256);

  function getVote2EarnDecayPeriods(uint256 blockNumber) external view returns (uint256);

  function getXAllocationAmountForCycle(uint256 cycle) external view returns (uint256);

  function getXAllocationDecayPeriods(uint256 blockNumber) external view returns (uint256);

  function getXAllocationsAmount(uint256 blockNumber) external view returns (uint256);

  function grantRole(bytes32 role, address account) external;

  function hasRole(bytes32 role, address account) external view returns (bool);

  function initialEmissions() external view returns (uint256);

  function isCycleDistributable(uint256 cycle) external view returns (bool);

  function isCycleDistributed(uint256 cycle) external view returns (bool);

  function isCycleEnded(uint256 cycle) external view returns (bool);

  function isLastCycle() external view returns (bool);

  function lastEmissions(uint256) external view returns (uint256);

  function maxVote2EarnDecay() external view returns (uint256);

  function nextCycle() external view returns (uint256);

  function preMint() external;

  function preMintAllocations(uint256) external view returns (uint256);

  function renounceRole(bytes32 role, address callerConfirmation) external;

  function revokeRole(bytes32 role, address account) external;

  function scalingFactor() external view returns (uint256);

  function setCycleDuration(uint256 _cycleDuration) external;

  function setInitialEmissions(uint256 _emissions) external;

  function setLastEmissions(uint256[] memory _lastEmissions) external;

  function setMaxVote2EarnDecay(uint256 _maxVote2EarnDecay) external;

  function setPreMintAllocations(uint256[] memory _allocations) external;

  function setScalingFactor(uint256 _scalingFactor) external;

  function setTreasuryAddress(address treasuryAddress) external;

  function setTreasuryPercentage(uint256 _percentage) external;

  function setVote2EarnAddress(address vote2EarnAddress) external;

  function setVote2EarnDecay(uint256 _decay) external;

  function setVote2EarnDecayDelay(uint256 _delay) external;

  function setXAllocationsDecay(uint256 _decay) external;

  function setXAllocationsDecayDelay(uint256 _delay) external;

  function setXAllocationsGovernorAddress(address _xAllocationsGovernor) external;

  function setXallocationsAddress(address xAllocationAddress) external;

  function supportsInterface(bytes4 interfaceId) external view returns (bool);

  function treasury() external view returns (address);

  function treasuryPercentage() external view returns (uint256);

  function vote2Earn() external view returns (address);

  function vote2EarnDecay() external view returns (uint256);

  function vote2EarnDecayDelay() external view returns (uint256);

  function xAllocations() external view returns (address);

  function xAllocationsDecay() external view returns (uint256);

  function xAllocationsDecayDelay() external view returns (uint256);

  function xAllocationsGovernor() external view returns (address);
}
