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

pragma solidity 0.8.20;

import { XAllocationVotingStorageTypes } from "./XAllocationVotingStorageTypes.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
 * @title VotesQuorumFractionUtils
 * @notice Library for managing quorum as a fraction of total token supply in the XAllocationVoting system.
 * @dev Extracted from VotesQuorumFractionUpgradeable module. Uses ERC-7201 namespaced storage.
 *      Cross-reads VotesStorage for the token (to get pastTotalSupply for quorum calculation).
 */
library VotesQuorumFractionUtils {
  using Checkpoints for Checkpoints.Trace208;

  event QuorumNumeratorUpdated(uint256 oldQuorumNumerator, uint256 newQuorumNumerator);

  /**
   * @dev The quorum set is not a valid fraction.
   */
  error GovernorInvalidQuorumFraction(uint256 quorumNumerator, uint256 quorumDenominator);

  /**
   * @notice Initialize quorum as a fraction of the token's total supply.
   * @dev The fraction is specified as `numerator / denominator`. The denominator is 100,
   *      so quorum is specified as a percent: a numerator of 10 corresponds to quorum being 10% of total supply.
   * @param quorumNumeratorValue The initial quorum numerator value
   * @param currentClock The current clock value (passed by caller to avoid cross-reading VotesStorage)
   */
  function initialize(uint256 quorumNumeratorValue, uint48 currentClock) external {
    XAllocationVotingStorageTypes.VotesQuorumFractionStorage
      storage $ = XAllocationVotingStorageTypes._getVotesQuorumFractionStorage();

    uint256 denominator = quorumDenominator();
    if (quorumNumeratorValue > denominator) {
      revert GovernorInvalidQuorumFraction(quorumNumeratorValue, denominator);
    }

    $._quorumNumeratorHistory.push(currentClock, SafeCast.toUint208(quorumNumeratorValue));

    emit QuorumNumeratorUpdated(0, quorumNumeratorValue);
  }

  /**
   * @notice Returns the current quorum numerator. See {quorumDenominator}.
   * @return The latest quorum numerator value
   */
  function quorumNumerator() external view returns (uint256) {
    XAllocationVotingStorageTypes.VotesQuorumFractionStorage
      storage $ = XAllocationVotingStorageTypes._getVotesQuorumFractionStorage();
    return $._quorumNumeratorHistory.latest();
  }

  /**
   * @notice Returns the quorum numerator at a specific timepoint. See {quorumDenominator}.
   * @dev Uses an optimistic lookup on the latest checkpoint, falling back to binary search.
   * @param timepoint The timepoint to query
   * @return The quorum numerator at the given timepoint
   */
  function quorumNumerator(uint256 timepoint) external view returns (uint256) {
    XAllocationVotingStorageTypes.VotesQuorumFractionStorage
      storage $ = XAllocationVotingStorageTypes._getVotesQuorumFractionStorage();

    uint256 length = $._quorumNumeratorHistory._checkpoints.length;

    // Optimistic search, check the latest checkpoint
    Checkpoints.Checkpoint208 storage latest = $._quorumNumeratorHistory._checkpoints[length - 1];
    uint48 latestKey = latest._key;
    uint208 latestValue = latest._value;
    if (latestKey <= timepoint) {
      return latestValue;
    }

    // Otherwise, do the binary search
    return $._quorumNumeratorHistory.upperLookupRecent(SafeCast.toUint48(timepoint));
  }

  /**
   * @notice Returns the quorum denominator. Defaults to 100.
   * @return The quorum denominator
   */
  function quorumDenominator() public pure returns (uint256) {
    return 100;
  }

  /**
   * @notice Returns the quorum for a timepoint, in terms of number of votes: `supply * numerator / denominator`.
   * @dev Cross-reads VotesStorage to get the token for getPastTotalSupply.
   * @param timepoint The timepoint to query
   * @return The quorum (minimum votes required) at the given timepoint
   */
  function quorum(uint256 timepoint) external view returns (uint256) {
    XAllocationVotingStorageTypes.VotesStorage storage votesStorage = XAllocationVotingStorageTypes._getVotesStorage();
    XAllocationVotingStorageTypes.VotesQuorumFractionStorage
      storage $ = XAllocationVotingStorageTypes._getVotesQuorumFractionStorage();

    // Get quorum numerator at timepoint using the optimistic + binary search pattern
    uint256 numerator;
    {
      uint256 length = $._quorumNumeratorHistory._checkpoints.length;
      Checkpoints.Checkpoint208 storage latest = $._quorumNumeratorHistory._checkpoints[length - 1];
      uint48 latestKey = latest._key;
      uint208 latestValue = latest._value;
      if (latestKey <= timepoint) {
        numerator = latestValue;
      } else {
        numerator = $._quorumNumeratorHistory.upperLookupRecent(SafeCast.toUint48(timepoint));
      }
    }

    return (votesStorage._token.getPastTotalSupply(timepoint) * numerator) / quorumDenominator();
  }

  /**
   * @notice Changes the quorum numerator.
   * @dev Validates the new numerator and pushes it to the checkpoint history.
   *      Receives clock as param to avoid needing VotesStorage.
   *
   * Emits a {QuorumNumeratorUpdated} event.
   *
   * Requirements:
   * - New numerator must be smaller or equal to the denominator.
   *
   * @param newQuorumNumerator The new quorum numerator value
   * @param currentClock The current clock value (passed by caller)
   */
  function updateQuorumNumerator(uint256 newQuorumNumerator, uint48 currentClock) external {
    uint256 denominator = quorumDenominator();
    if (newQuorumNumerator > denominator) {
      revert GovernorInvalidQuorumFraction(newQuorumNumerator, denominator);
    }

    XAllocationVotingStorageTypes.VotesQuorumFractionStorage
      storage $ = XAllocationVotingStorageTypes._getVotesQuorumFractionStorage();

    uint256 oldQuorumNumerator = $._quorumNumeratorHistory.latest();

    $._quorumNumeratorHistory.push(currentClock, SafeCast.toUint208(newQuorumNumerator));

    emit QuorumNumeratorUpdated(oldQuorumNumerator, newQuorumNumerator);
  }

  /**
   * @notice Returns the current quorum percentage (alias for latest quorumNumerator).
   * @return The current quorum percentage
   */
  function quorumPercentage() external view returns (uint256) {
    XAllocationVotingStorageTypes.VotesQuorumFractionStorage
      storage $ = XAllocationVotingStorageTypes._getVotesQuorumFractionStorage();
    return $._quorumNumeratorHistory.latest();
  }
}
