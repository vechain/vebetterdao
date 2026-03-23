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

import { GovernorTypesV9 } from "./GovernorTypesV9.sol";
import { GovernorStorageTypesV9 } from "./GovernorStorageTypesV9.sol";
import { GovernorProposalLogicV9 } from "./GovernorProposalLogicV9.sol";
import { GovernorVotesLogicV9 } from "./GovernorVotesLogicV9.sol";
import { GovernorQuorumLogicV9 } from "./GovernorQuorumLogicV9.sol";
import { GovernorClockLogicV9 } from "./GovernorClockLogicV9.sol";
import { GovernorDepositLogicV9 } from "./GovernorDepositLogicV9.sol";

/// @title GovernorStateLogic
/// @notice Library for Governor state logic, managing the state transitions and validations of governance proposals.
library GovernorStateLogicV9 {
  /// @notice Bitmap representing all possible proposal states.
  bytes32 internal constant ALL_PROPOSAL_STATES_BITMAP =
    bytes32((2 ** (uint8(type(GovernorTypesV9.ProposalState).max) + 1)) - 1);

  /// @dev Thrown when the `proposalId` does not exist.
  /// @param proposalId The ID of the proposal that does not exist.
  error GovernorNonexistentProposal(uint256 proposalId);

  /// @dev Thrown when the current state of a proposal does not match the expected states.
  /// @param proposalId The ID of the proposal.
  /// @param current The current state of the proposal.
  /// @param expectedStates The expected states of the proposal as a bitmap.
  error GovernorUnexpectedProposalState(
    uint256 proposalId,
    GovernorTypesV9.ProposalState current,
    bytes32 expectedStates
  );

  /** ------------------ GETTERS ------------------ **/

  /**
   * @notice Retrieves the current state of a proposal.
   * @param self The storage reference for the GovernorStorageV9.
   * @param proposalId The ID of the proposal.
   * @return The current state of the proposal.
   */
  function state(
    GovernorStorageTypesV9.GovernorStorage storage self,
    uint256 proposalId
  ) external view returns (GovernorTypesV9.ProposalState) {
    return _state(self, proposalId);
  }

  /** ------------------ INTERNAL FUNCTIONS ------------------ **/

  /**
   * @dev Internal function to validate the current state of a proposal against expected states.
   * @param self The storage reference for the GovernorStorageV9.
   * @param proposalId The ID of the proposal.
   * @param allowedStates The bitmap of allowed states.
   * @return The current state of the proposal.
   */
  function validateStateBitmap(
    GovernorStorageTypesV9.GovernorStorage storage self,
    uint256 proposalId,
    bytes32 allowedStates
  ) internal view returns (GovernorTypesV9.ProposalState) {
    GovernorTypesV9.ProposalState currentState = _state(self, proposalId);
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
  function encodeStateBitmap(GovernorTypesV9.ProposalState proposalState) internal pure returns (bytes32) {
    return bytes32(1 << uint8(proposalState));
  }

  /**
   * @notice Retrieves the current state of a proposal.
   * @dev See {IB3TRGovernor-state}.
   * @param self The storage reference for the GovernorStorageV9.
   * @param proposalId The ID of the proposal.
   * @return The current state of the proposal.
   */
  function _state(
    GovernorStorageTypesV9.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (GovernorTypesV9.ProposalState) {
    // Load the proposal into memory
    GovernorTypesV9.ProposalCore storage proposal = self.proposals[proposalId];
    GovernorTypesV9.ProposalDevelopmentState proposalDevelopmentState = self.proposalDevelopmentState[proposalId];
    bool proposalExecuted = proposal.executed;
    bool proposalCanceled = proposal.canceled;

    if (proposalDevelopmentState == GovernorTypesV9.ProposalDevelopmentState.InDevelopment) {
      return GovernorTypesV9.ProposalState.InDevelopment;
    }

    if (proposalDevelopmentState == GovernorTypesV9.ProposalDevelopmentState.Completed) {
      return GovernorTypesV9.ProposalState.Completed;
    }

    if (proposalExecuted) {
      return GovernorTypesV9.ProposalState.Executed;
    }

    if (proposalCanceled) {
      return GovernorTypesV9.ProposalState.Canceled;
    }

    if (proposal.roundIdVoteStart == 0) {
      revert GovernorNonexistentProposal(proposalId);
    }

    // Check if the proposal is pending
    if (self.xAllocationVoting.currentRoundId() < proposal.roundIdVoteStart) {
      return GovernorTypesV9.ProposalState.Pending;
    }

    uint256 currentTimepoint = GovernorClockLogicV9.clock(self);
    uint256 deadline = GovernorProposalLogicV9._proposalDeadline(self, proposalId);

    if (!GovernorDepositLogicV9.proposalDepositReached(self, proposalId)) {
      return GovernorTypesV9.ProposalState.DepositNotMet;
    }

    if (deadline >= currentTimepoint) {
      return GovernorTypesV9.ProposalState.Active;
    } else if (
      !GovernorQuorumLogicV9.quorumReached(self, proposalId) || !GovernorVotesLogicV9.voteSucceeded(self, proposalId)
    ) {
      return GovernorTypesV9.ProposalState.Defeated;
    } else if (GovernorProposalLogicV9.proposalEta(self, proposalId) == 0) {
      return GovernorTypesV9.ProposalState.Succeeded;
    } else {
      bytes32 queueid = self.timelockIds[proposalId];
      if (self.timelock.isOperationPending(queueid)) {
        return GovernorTypesV9.ProposalState.Queued;
      } else if (self.timelock.isOperationDone(queueid)) {
        return GovernorTypesV9.ProposalState.Executed;
      } else {
        return GovernorTypesV9.ProposalState.Canceled;
      }
    }
  }
}
