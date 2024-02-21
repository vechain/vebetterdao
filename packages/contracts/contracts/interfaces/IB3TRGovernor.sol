// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import { IGovernor } from "./IGovernor.sol";

interface IB3TRGovernor is IGovernor {
  function hasVotedOnce(address user) external view returns (bool);
}
