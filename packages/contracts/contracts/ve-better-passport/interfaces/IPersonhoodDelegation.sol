// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

/// @title IPersonhoodDelegation
/// @notice Interface for the Personhood Delegation module.
interface IPersonhoodDelegation {
  /// @notice Emitted when a user does not have permission to delegate personhood.
  error PersonhoodDelegationUnauthorizedUser(address user);

  /// @notice Emitted when a user tries to delegate personhood to a user that has already been delegated to.
  error AlreadyDelegated(address delegator);

  /// @notice Emitted when a user tries to delegate personhood to themselves.
  error CannotDelegateToSelf(address user);

  /// @notice Emitted when a user tries to revoke a delegation that does not exist.
  error NotDelegated(address user);

  /// @notice Emitted when a user tries to delegate personhood to more than one user.
  error OnlyOneUserAllowed();

  /// @notice Emitted when a user delegates personhood to another user.
  event DelegationCreated(address indexed delegator, address indexed delegatee);

  /// @notice Emitted when a user revokes the delegation of personhood to another user.
  event DelegationRevoked(address indexed delegator, address indexed delegatee);

  /// @notice Delegates personhood, must be called by the delegatee providing the delegator signature.
  function delegateWithSignature(address delegator, uint256 nonce, uint256 deadline, bytes memory signature) external;

  /// @notice Revokes the delegation of personhood to another user.
  function revokeDelegation(address delegator) external;

  /// @notice Checks if a user is a delegator.
  function isDelegator(address user) external view returns (bool);

  /// @notice Checks if a user is a delegator in a specific timepoint.
  function isDelegatorInTimepoint(address user, uint256 timepoint) external view returns (bool);

  /// @notice Checks if a user is a delegatee.
  function isDelegatee(address user) external view returns (bool);

  /// @notice Checks if a user is a delegatee in a specific timepoint.
  function isDelegateeInTimepoint(address user, uint256 timepoint) external view returns (bool);

  /// @notice Gets the delegator of a delegatee.
  function getDelegator(address delegatee) external view returns (address);

  /// @notice Gets the delegator of a delegatee in a specific timepoint.
  function getDelegatorInTimepoint(address delegatee, uint256 timepoint) external view returns (address);

  /// @notice Gets the delegatee of a delegator.
  function getDelegatee(address delegator) external view returns (address);

  /// @notice Gets the delegatee of a delegator in a specific timepoint.
  function getDelegateeInTimepoint(address delegator, uint256 timepoint) external view returns (address);
}
