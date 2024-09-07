// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title IVeBetterPassport
/// @notice Full Interface (with joined IBotSignaling and IProofOfParticipation) for the VeBetterPassport contract.
interface IVeBetterPassport {
  function ACTION_REGISTRAR_ROLE() external view returns (bytes32);

  function ACTION_SCORE_MANAGER_ROLE() external view returns (bytes32);

  function CONTRACTS_ADDRESS_MANAGER_ROLE() external view returns (bytes32);

  function DEFAULT_ADMIN_ROLE() external view returns (bytes32);

  function ROLE_GRANTER() external view returns (bytes32);

  function SIGNALER_ROLE() external view returns (bytes32);

  function UPGRADER_ROLE() external view returns (bytes32);

  function UPGRADE_INTERFACE_VERSION() external view returns (string memory);

  function WHITELISTER_ROLE() external view returns (bytes32);

  function _registerAction(address user, bytes32 appId, uint256 round) external;

  function appOfSignaler(address _signaler) external view returns (bytes32);

  function appSecurity(bytes32 appId) external view returns (uint8);

  function appSignalsCounter(bytes32 _app, address _user) external view returns (uint256);

  function appTotalSignalsCounter(bytes32 _app) external view returns (uint256);

  function assignSignalerToApp(bytes32 _app, address user) external;

  function getCumulativeScoreWithDecay(address user, uint256 lastRound) external view returns (uint256);

  function getQuadraticCumulativeScore(address user, uint256 lastRound) external view returns (uint256);

  function getRoleAdmin(bytes32 role) external view returns (bytes32);

  function grantRole(bytes32 role, address account) external;

  function hasRole(bytes32 role, address account) external view returns (bool);

  function isPerson(address _user) external view returns (bool);

  function isWhitelisted(address _user) external view returns (bool);

  function registerAction(address user, bytes32 appId) external;

  function registerActionForRound(address user, bytes32 appId, uint256 round) external;

  function removeSignalerFromApp(address user) external;

  function renounceRole(bytes32 role, address callerConfirmation) external;

  function revokeRole(bytes32 role, address account) external;

  function roundsForCumulativeScore() external view returns (uint256);

  function securityMultiplier(uint8 security) external view returns (uint256);

  function setAppSecurity(bytes32 appId, uint8 security) external;

  function setDecayRate(uint256 decayRate) external;

  function setRoundsForCumulativeScore(uint256 rounds) external;

  function setSecurityMultiplier(uint8 security, uint256 multiplier) external;

  function setThreshold(uint256 threshold) external;

  function setX2EarnApps(address _x2EarnApps) external;

  function signalUser(address _user) external;

  function signaledCounter(address _user) external view returns (uint256);

  function supportsInterface(bytes4 interfaceId) external view returns (bool);

  function thresholdParticipationScore() external view returns (uint256);

  function userAppTotalScore(address user, bytes32 appId) external view returns (uint256);

  function userRoundScore(address user, uint256 round) external view returns (uint256);

  function userRoundScoreApp(address user, uint256 round, bytes32 appId) external view returns (uint256);

  function userTotalScore(address user) external view returns (uint256);

  function version() external pure returns (string memory);

  function whitelistUser(address _user) external;

  function x2EarnApps() external view returns (address);

  function delegate(address user) external;

  function revokeDelegation() external;

  function isDelegator(address user) external view returns (bool);

  function isDelegatorInTimepoint(address user, uint256 timepoint) external view returns (bool);

  function isDelegatee(address user) external view returns (bool);

  function isDelegateeInTimepoint(address user, uint256 timepoint) external view returns (bool);

  function getDelegator(address delegatee) external view returns (address);

  function getDelegatorInTimepoint(address delegatee, uint256 timepoint) external view returns (address);

  function getDelegatee(address delegator) external view returns (address);

  function getDelegateeInTimepoint(address delegator, uint256 timepoint) external view returns (address);
}
