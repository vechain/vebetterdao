// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { IXAllocationPool } from "./interfaces/IXAllocationPool.sol";
import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { Time } from "@openzeppelin/contracts/utils/types/Time.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { IXAllocationVotingGovernor } from "./interfaces/IXAllocationVotingGovernor.sol";
import { IEmissions } from "./interfaces/IEmissions.sol";

contract XAllocationPool is IXAllocationPool, AccessControl {
  IXAllocationVotingGovernor internal _xAllocationVoting;
  IEmissions internal _emissions;

  constructor(address[] memory admins) {
    for (uint i = 0; i < admins.length; i++) {
      _grantRole(DEFAULT_ADMIN_ROLE, admins[i]);
    }
  }

  // ---------- Setters ---------- //

  function setXAllocationVotingAddress(address xAllocationVoting_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _xAllocationVoting = IXAllocationVotingGovernor(xAllocationVoting_);
  }

  function setEmissionsAddress(address emissions_) public onlyRole(DEFAULT_ADMIN_ROLE) {
    _emissions = IEmissions(emissions_);
  }

  // ---------- Internal and private ---------- //

  // ---------- Getters ---------- //

  /**
   * @dev Returns the XAllocationVotingGovernor contract.
   */
  function xAllocationVoting() public view returns (IXAllocationVotingGovernor) {
    return _xAllocationVoting;
  }

  /**
   * @dev Returns the emissions contract.
   */
  function emissions() public view returns (IEmissions) {
    return _emissions;
  }
}
