// SPDX-License-Identifier: MIT

//                                      #######
//                                 ################
//                               ####################
//                             ###########   #########
//                            #########      #########
//          #######          #########       #########
//          #########       #########      ##########
//           ##########     ########     ####################
//            ##########   #########  #########################
//              ################### ############################
//               #################  ##########          ########
//                 ##############      ###              ########
//                  ############                       #########
//                    ##########                     ##########
//                     ########                    ###########
//                       ###                    ############
//                                          ##############
//                                    #################
//                                   ##############
//                                   #########

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { GovernorStorageTypes } from "./GovernorStorageTypes.sol";
import { GovernorClockLogic } from "./GovernorClockLogic.sol";
import { GovernorVotesLogic } from "./GovernorVotesLogic.sol";
import { GovernorProposalLogic } from "./GovernorProposalLogic.sol";

/// @title GovernorQuorumFraction
/// @notice Library for managing quorum numerators using checkpointed data structures.
library GovernorQuorumLogic {
  using Checkpoints for Checkpoints.Trace208;
  using GovernorClockLogic for GovernorStorageTypes.GovernorExternalContractsStorage;
  using GovernorVotesLogic for GovernorStorageTypes.GovernorVotesStorage;
  using GovernorProposalLogic for GovernorStorageTypes.GovernorGeneralStorage;

  /// @notice Error that is thrown when the new quorum numerator exceeds the denominator.
  /// @param quorumNumerator The attempted new numerator that failed the update
  /// @param quorumDenominator The denominator against which the numerator was compared
  error GovernorInvalidQuorumFraction(uint256 quorumNumerator, uint256 quorumDenominator);

  /// @notice Emitted when the quorum numerator is updated.
  /// @param oldNumerator The numerator before the update
  /// @param newNumerator The numerator after the update
  event QuorumNumeratorUpdated(uint256 oldNumerator, uint256 newNumerator);

  /// @notice Retrieves the quorum denominator, which is a constant in this implementation.
  /// @return The quorum denominator (constant value of 100)
  function quorumDenominator() public pure returns (uint256) {
    return 100;
  }

  /// @notice Retrieves the quorum numerator at a specific timepoint using checkpoint data.
  /// @param self The storage structure containing the quorum numerator history
  /// @param timepoint The specific timepoint for which to fetch the numerator
  /// @return The quorum numerator at the given timepoint
  function quorumNumerator(
    GovernorStorageTypes.GovernorQuoromStorage storage self,
    uint256 timepoint
  ) public view returns (uint256) {
    uint256 length = self.quorumNumeratorHistory._checkpoints.length;

    // Optimistic search, check the latest checkpoint
    Checkpoints.Checkpoint208 storage latest = self.quorumNumeratorHistory._checkpoints[length - 1];
    uint48 latestKey = latest._key;
    uint208 latestValue = latest._value;
    if (latestKey <= timepoint) {
      return latestValue;
    }

    // Otherwise, do the binary search
    return self.quorumNumeratorHistory.upperLookupRecent(SafeCast.toUint48(timepoint));
  }

  /// @notice Updates the quorum numerator to a new value at a specified time, emitting an event upon success.
  /// @dev This function should only be called from governance actions where numerators need updating.
  /// @dev New numerator must be smaller or equal to the denominator.
  /// @param self The storage structure containing the quorum numerator history
  /// @param newQuorumNumerator The new value for the quorum numerator
  /// @param oldQuorumNumerator The previous value for the quorum numerator, needed for the event emission
  /// @param clock The block timestamp or other clock identifier to register in the history
  function updateQuorumNumerator(
    GovernorStorageTypes.GovernorQuoromStorage storage self,
    uint256 newQuorumNumerator,
    uint256 oldQuorumNumerator,
    uint48 clock
  ) external {
    uint256 denominator = quorumDenominator();

    if (newQuorumNumerator > denominator) {
      revert GovernorInvalidQuorumFraction(newQuorumNumerator, denominator);
    }

    self.quorumNumeratorHistory.push(clock, SafeCast.toUint208(newQuorumNumerator));

    emit QuorumNumeratorUpdated(oldQuorumNumerator, newQuorumNumerator);
  }

  /**
   * @dev See {Governor-_quorumReached}.
   */
  function quorumReached(
    GovernorStorageTypes.GovernorQuoromStorage storage self,
    GovernorStorageTypes.GovernorGeneralStorage storage general,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts,
    GovernorStorageTypes.GovernorVotesStorage storage votes,
    uint256 proposalId
  ) internal view returns (bool) {
    return
      quorum(self, externalContracts, general.proposalSnapshot(externalContracts, proposalId)) <=
      votes.proposalTotalVotes[proposalId];
  }

  /**
   * @dev Returns the quorum for a timepoint, in terms of number of votes: `supply * numerator / denominator`.
   */
  function quorum(
    GovernorStorageTypes.GovernorQuoromStorage storage self,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts,
    uint256 timepoint
  ) public view returns (uint256) {
    return
      (externalContracts.vot3.getPastTotalSupply(timepoint) * quorumNumerator(self, timepoint)) / quorumDenominator();
  }
}
