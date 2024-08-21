// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IVeBetterDAOPassport {
  event ModuleAdded(string moduleName, bytes32 moduleHash, address moduleAddress);
  event ModuleRemoved(string moduleName, bytes32 moduleHash, address moduleAddress);
  event WhitelistedUserSet(address user, bool isWhitelisted);
  event BlacklistedUserSet(address user, bool isBlacklisted);

  /// @notice Emitted when a user is not authorized to perform an action
  error VeBetterDAOPassportUnauthorizedUser(address user);

  // Get the combined score for a user, considering the weights of different modules
  function getTotalScore(address user) external view returns (uint256);

  // Check if the user is a real person based on combined scores
  function isPerson(address user) external view returns (bool);

  // Add a module (e.g., SustainabilityProof, OffchainIdentity)
  function addModule(string memory moduleName, address moduleAddress) external;

  // Remove a module
  function removeModule(string memory moduleName) external;
}
