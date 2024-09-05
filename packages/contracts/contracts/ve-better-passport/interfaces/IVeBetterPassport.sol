// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IBotSignaling } from "./IBotSignaling.sol";
import { IProofOfParticipation } from "./IProofOfParticipation.sol";

/// @title IVeBetterPassport
/// @notice Interface for the VeBetterPassport contract.
interface IVeBetterPassport is IBotSignaling, IProofOfParticipation {
  error VeBetterPassportUnauthorizedUser(address user);

  /// @notice Getter to know if an address can be considered a person.
  function isPerson(address _user) external view returns (bool);

  /// @notice Assigns a signaler to an app.
  function assignSignalerToApp(bytes32 app, address user) external;

  /// @notice Removes a signaler from an app.
  function removeSignalerFromApp(address user) external;

  /// @notice Grants a role to a user.
  function grantRole(bytes32 role, address user) external;

  /// @notice Revokes a role from a user.
  function revokeRole(bytes32 role, address user) external;
}
