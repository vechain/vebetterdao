// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorSettings.sol)

pragma solidity ^0.8.19;

import { XAllocationVotingGovernor } from "../XAllocationVotingGovernor.sol";

/**
 * @dev Extension of {XAllocationVotingGovernor} for settings updatable through governance.
 *
 * This module is forked from OpenZeppelin's GovernorSettings.sol and was modified to remove proposalThreshold.
 */
abstract contract GovernorSettings is XAllocationVotingGovernor {
  // timepoint: limited to uint48 in core (same as clock() type)
  uint48 private _votingDelay;
  // duration: limited to uint32 in core
  uint32 private _votingPeriod;

  event VotingDelaySet(uint256 oldVotingDelay, uint256 newVotingDelay);
  event VotingPeriodSet(uint256 oldVotingPeriod, uint256 newVotingPeriod);

  /**
   * @dev Initialize the governance parameters.
   */
  constructor(uint48 initialVotingDelay, uint32 initialVotingPeriod) {
    _setVotingDelay(initialVotingDelay);
    _setVotingPeriod(initialVotingPeriod);
  }

  /**
   * @dev See {IXAllocationVotingGovernor-votingDelay}.
   */
  function votingDelay() public view virtual override returns (uint256) {
    return _votingDelay;
  }

  /**
   * @dev See {IXAllocationVotingGovernor-votingPeriod}.
   */
  function votingPeriod() public view virtual override returns (uint256) {
    return _votingPeriod;
  }

  /**
   * @dev Update the voting delay. This operation can only be performed through a governance proposal.
   *
   * Emits a {VotingDelaySet} event.
   */
  function setVotingDelay(uint48 newVotingDelay) public virtual onlyGovernance {
    _setVotingDelay(newVotingDelay);
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
   * @dev Internal setter for the voting delay.
   *
   * Emits a {VotingDelaySet} event.
   */
  function _setVotingDelay(uint48 newVotingDelay) internal virtual {
    emit VotingDelaySet(_votingDelay, newVotingDelay);
    _votingDelay = newVotingDelay;
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
