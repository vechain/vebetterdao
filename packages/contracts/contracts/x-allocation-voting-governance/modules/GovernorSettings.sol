// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorSettings.sol)

pragma solidity ^0.8.18;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";

/**
 * @dev Extension of {XAllocationVotingGovernor} for settings updatable through governance.
 */
abstract contract GovernorSettings is XAllocationVotingGovernor {
  // duration: limited to uint32 in core
  uint32 private _votingPeriod;

  event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);

  /**
   * @dev Initialize the governance parameters.
   */
  constructor(uint32 initialVotingPeriod) {
    _setVotingPeriod(initialVotingPeriod);
  }

  /**
   * @dev See {IXAllocationVotingGovernor-votingPeriod}.
   */
  function votingPeriod() public view virtual override returns (uint256) {
    return _votingPeriod;
  }

  /**
   * @dev Update the voting period. This operation can only be performed through a governance proposal.
   *
   * Emits a {VotingPeriodSet} event.
   */
  function setVotingPeriod(uint32 newVotingPeriod) public virtual onlyGovernance {
    _setVotingPeriod(newVotingPeriod);
  }

  /**
   * @dev Internal setter for the voting period.
   *
   * Emits a {VotingPeriodSet} event.
   */
  function _setVotingPeriod(uint32 newVotingPeriod) internal virtual {
    if (newVotingPeriod == 0) {
      revert GovernorInvalidVotingPeriod(0);
    }
    emit VotingPeriodSet(_votingPeriod, newVotingPeriod);
    _votingPeriod = newVotingPeriod;
  }
}
