// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { IBotSignaling } from "./IBotSignaling.sol";
import { IProofOfParticipation } from "./IProofOfParticipation.sol";

interface IVeBetterPassport is IBotSignaling, IProofOfParticipation {
  error VeBetterPassportUnauthorizedUser(address user);

  function isPerson(address _user) external view returns (bool);
}
