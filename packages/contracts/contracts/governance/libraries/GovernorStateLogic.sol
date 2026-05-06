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

import { GovernorTypes } from "./GovernorTypes.sol";
import { GovernorStorageTypes } from "./GovernorStorageTypes.sol";
import { GovernorProposalLogic } from "./GovernorProposalLogic.sol";
import { GovernorVotesLogic } from "./GovernorVotesLogic.sol";
import { GovernorQuorumLogic } from "./GovernorQuorumLogic.sol";
import { GovernorClockLogic } from "./GovernorClockLogic.sol";
import { GovernorDepositLogic } from "./GovernorDepositLogic.sol";

/// @title GovernorStateLogic
/// @notice Library for Governor state logic, managing the state transitions and validations of governance proposals.
library GovernorStateLogic {
  /// @notice Bitmap representing all possible proposal states.
  bytes32 internal constant ALL_PROPOSAL_STATES_BITMAP =
    bytes32((2 ** (uint8(type(GovernorTypes.ProposalState).max) + 1)) - 1);

  /// @dev Thrown when the `proposalId` does not exist.
  /// @param proposalId The ID of the proposal that does not exist.
  error GovernorNonexistentProposal(uint256 proposalId);

  /// @dev Thrown when the current state of a proposal does not match the expected states.
  /// @param proposalId The ID of the proposal.
  /// @param current The current state of the proposal.
  /// @param expectedStates The expected states of the proposal as a bitmap.
  error GovernorUnexpectedProposalState(
    uint256 proposalId,
    GovernorTypes.ProposalState current,
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
  ) internal view returns (GovernorTypes.ProposalState) {
    GovernorTypes.ProposalState currentState = _state(proposalId);
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
  function encodeStateBitmap(GovernorTypes.ProposalState proposalState) internal pure returns (bytes32) {
    return bytes32(1 << uint8(proposalState));
  }

  /**
   * @notice Retrieves the current state of a proposal.
   * @dev See {IB3TRGovernor-state}.
   * @param proposalId The ID of the proposal.
   * @return The current state of the proposal.
   */
  function _state(
    uint256 proposalId
  ) internal view returns (GovernorTypes.ProposalState) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    // Load the proposal into memory
    GovernorTypes.ProposalCore storage proposal = $.proposals[proposalId];
    GovernorTypes.ProposalDevelopmentState proposalDevelopmentState = $.proposalDevelopmentState[proposalId];
    bool proposalExecuted = proposal.executed;
    bool proposalCanceled = proposal.canceled;

    if (proposalDevelopmentState == GovernorTypes.ProposalDevelopmentState.InDevelopment) {
      return GovernorTypes.ProposalState.InDevelopment;
    }

    if (proposalDevelopmentState == GovernorTypes.ProposalDevelopmentState.Completed) {
      return GovernorTypes.ProposalState.Completed;
    }

    if (proposalExecuted) {
      return GovernorTypes.ProposalState.Executed;
    }

    if (proposalCanceled) {
      return GovernorTypes.ProposalState.Canceled;
    }

    if (proposal.roundIdVoteStart == 0) {
      revert GovernorNonexistentProposal(proposalId);
    }

    // Check if the proposal is pending
    if ($.xAllocationVoting.currentRoundId() < proposal.roundIdVoteStart) {
      return GovernorTypes.ProposalState.Pending;
    }

    uint256 currentTimepoint = GovernorClockLogic.clock();
    uint256 deadline = GovernorProposalLogic._proposalDeadline(proposalId);

    if (!GovernorDepositLogic.proposalDepositReached(proposalId)) {
      return GovernorTypes.ProposalState.DepositNotMet;
    }

    if (deadline >= currentTimepoint) {
      return GovernorTypes.ProposalState.Active;
    } else if (
      !GovernorQuorumLogic.quorumReached(proposalId) || !GovernorVotesLogic.voteSucceeded(proposalId)
    ) {
      return GovernorTypes.ProposalState.Defeated;
    } else if (GovernorProposalLogic.proposalEta(proposalId) == 0) {
      return GovernorTypes.ProposalState.Succeeded;
    } else {
      bytes32 queueid = $.timelockIds[proposalId];
      if ($.timelock.isOperationPending(queueid)) {
        return GovernorTypes.ProposalState.Queued;
      } else if ($.timelock.isOperationDone(queueid)) {
        return GovernorTypes.ProposalState.Executed;
      } else {
        return GovernorTypes.ProposalState.Canceled;
      }
    }
  }
}
