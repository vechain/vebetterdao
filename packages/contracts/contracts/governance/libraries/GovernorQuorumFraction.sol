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

/// @title GovernorQuorumFraction
/// @notice Library for managing quorum numerators using checkpointed data structures.
library GovernorQuorumFraction {
  using Checkpoints for Checkpoints.Trace208;

  /// @dev Struct to encapsulate quorum numerator history.
  struct QuorumFractionStorage {
    Checkpoints.Trace208 _quorumNumeratorHistory;
  }

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
  /// @param numeratorHistory The history of numerator values
  /// @param timepoint The specific timepoint for which to fetch the numerator
  /// @return The quorum numerator at the given timepoint
  function quorumNumerator(
    Checkpoints.Trace208 storage numeratorHistory,
    uint256 timepoint
  ) public view returns (uint256) {
    uint256 length = numeratorHistory._checkpoints.length;

    // Optimistic search, check the latest checkpoint
    Checkpoints.Checkpoint208 storage latest = numeratorHistory._checkpoints[length - 1];
    uint48 latestKey = latest._key;
    uint208 latestValue = latest._value;
    if (latestKey <= timepoint) {
      return latestValue;
    }

    // Otherwise, do the binary search
    return numeratorHistory.upperLookupRecent(SafeCast.toUint48(timepoint));
  }

  /// @notice Updates the quorum numerator to a new value at a specified time, emitting an event upon success.
  /// @dev This function should only be called from governance actions where numerators need updating.
  /// @dev New numerator must be smaller or equal to the denominator.
  /// @param numeratorHistory The history storage of numerator values
  /// @param newQuorumNumerator The new value for the quorum numerator
  /// @param oldQuorumNumerator The previous value for the quorum numerator, needed for the event emission
  /// @param clock The block timestamp or other clock identifier to register in the history
  function updateQuorumNumerator(
    Checkpoints.Trace208 storage numeratorHistory,
    uint256 newQuorumNumerator,
    uint256 oldQuorumNumerator,
    uint48 clock
  ) external {
    uint256 denominator = quorumDenominator();

    if (newQuorumNumerator > denominator) {
      revert GovernorInvalidQuorumFraction(newQuorumNumerator, denominator);
    }

    numeratorHistory.push(clock, SafeCast.toUint208(newQuorumNumerator));

    emit QuorumNumeratorUpdated(oldQuorumNumerator, newQuorumNumerator);
  }
}
