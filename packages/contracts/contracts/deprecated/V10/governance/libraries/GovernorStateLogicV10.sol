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

import { GovernorTypesV10 } from "./GovernorTypesV10.sol";
import { GovernorStorageTypesV10 } from "./GovernorStorageTypesV10.sol";
import { GovernorProposalLogicV10 } from "./GovernorProposalLogicV10.sol";
import { GovernorVotesLogicV10 } from "./GovernorVotesLogicV10.sol";
import { GovernorQuorumLogicV10 } from "./GovernorQuorumLogicV10.sol";
import { GovernorClockLogicV10 } from "./GovernorClockLogicV10.sol";
import { GovernorDepositLogicV10 } from "./GovernorDepositLogicV10.sol";

/// @title GovernorStateLogicV10
/// @notice Library for Governor state logic, managing the state transitions and validations of governance proposals.
library GovernorStateLogicV10 {
  /// @notice Bitmap representing all possible proposal states.
  bytes32 internal constant ALL_PROPOSAL_STATES_BITMAP =
    bytes32((2 ** (uint8(type(GovernorTypesV10.ProposalState).max) + 1)) - 1);

  /// @dev Thrown when the `proposalId` does not exist.
  /// @param proposalId The ID of the proposal that does not exist.
  error GovernorNonexistentProposal(uint256 proposalId);

  /// @dev Thrown when the current state of a proposal does not match the expected states.
  /// @param proposalId The ID of the proposal.
  /// @param current The current state of the proposal.
  /// @param expectedStates The expected states of the proposal as a bitmap.
  error GovernorUnexpectedProposalState(
    uint256 proposalId,
    GovernorTypesV10.ProposalState current,
    bytes32 expectedStates
  );

  /** ------------------ GETTERS ------------------ **/

  /**
   * @notice Retrieves the current state of a proposal.
   * @param proposalId The ID of the proposal.
   * @return The current state of the proposal.
   */
  function state(
    uint256 proposalId
  ) external view returns (uint8) {
    return uint8(_state(proposalId));
  }

  /** ------------------ INTERNAL FUNCTIONS ------------------ **/

  /**
   * @dev Internal function to validate the current state of a proposal against expected states.
   * @param proposalId The ID of the proposal.
   * @param allowedStates The bitmap of allowed states.
   * @return The current state of the proposal.
   */
  function validateStateBitmap(
    uint256 proposalId,
    bytes32 allowedStates
  ) internal view returns (GovernorTypesV10.ProposalState) {
    GovernorTypesV10.ProposalState currentState = _state(proposalId);
    if (encodeStateBitmap(currentState) & allowedStates == bytes32(0)) {
      revert GovernorUnexpectedProposalState(proposalId, currentState, allowedStates);
    }
    return currentState;
  }

  /**
   * @dev Encodes a `ProposalState` into a `bytes32` representation where each bit enabled corresponds to the underlying position in the `ProposalState` enum.
   * @param proposalState The state to encode.
   * @return The encoded state bitmap.
   */
  function encodeStateBitmap(GovernorTypesV10.ProposalState proposalState) internal pure returns (bytes32) {
    return bytes32(1 << uint8(proposalState));
  }

  /**
   * @notice Retrieves the current state of a proposal.
   * @dev See {IB3TRGovernorV10-state}.
   * @param proposalId The ID of the proposal.
   * @return The current state of the proposal.
   */
  function _state(
    uint256 proposalId
  ) internal view returns (GovernorTypesV10.ProposalState) {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    // Load the proposal into memory
    GovernorTypesV10.ProposalCore storage proposal = $.proposals[proposalId];
    GovernorTypesV10.ProposalDevelopmentState proposalDevelopmentState = $.proposalDevelopmentState[proposalId];
    bool proposalExecuted = proposal.executed;
    bool proposalCanceled = proposal.canceled;

    if (proposalDevelopmentState == GovernorTypesV10.ProposalDevelopmentState.InDevelopment) {
      return GovernorTypesV10.ProposalState.InDevelopment;
    }

    if (proposalDevelopmentState == GovernorTypesV10.ProposalDevelopmentState.Completed) {
      return GovernorTypesV10.ProposalState.Completed;
    }

    if (proposalExecuted) {
      return GovernorTypesV10.ProposalState.Executed;
    }

    if (proposalCanceled) {
      return GovernorTypesV10.ProposalState.Canceled;
    }

    if (proposal.roundIdVoteStart == 0) {
      revert GovernorNonexistentProposal(proposalId);
    }

    // Check if the proposal is pending
    if ($.xAllocationVoting.currentRoundId() < proposal.roundIdVoteStart) {
      return GovernorTypesV10.ProposalState.Pending;
    }

    uint256 currentTimepoint = GovernorClockLogicV10.clock();
    uint256 deadline = GovernorProposalLogicV10._proposalDeadline(proposalId);

    if (!GovernorDepositLogicV10.proposalDepositReached(proposalId)) {
      return GovernorTypesV10.ProposalState.DepositNotMet;
    }

    if (deadline >= currentTimepoint) {
      return GovernorTypesV10.ProposalState.Active;
    } else if (
      !GovernorQuorumLogicV10.quorumReached(proposalId) || !GovernorVotesLogicV10.voteSucceeded(proposalId)
    ) {
      return GovernorTypesV10.ProposalState.Defeated;
    } else if (GovernorProposalLogicV10.proposalEta(proposalId) == 0) {
      return GovernorTypesV10.ProposalState.Succeeded;
    } else {
      bytes32 queueid = $.timelockIds[proposalId];
      if ($.timelock.isOperationPending(queueid)) {
        return GovernorTypesV10.ProposalState.Queued;
      } else if ($.timelock.isOperationDone(queueid)) {
        return GovernorTypesV10.ProposalState.Executed;
      } else {
        return GovernorTypesV10.ProposalState.Canceled;
      }
    }
  }
}
