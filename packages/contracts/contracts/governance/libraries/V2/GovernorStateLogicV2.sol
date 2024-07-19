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

import { GovernorTypesV2 } from "./GovernorTypesV2.sol";
import { GovernorStorageTypesV2 } from "./GovernorStorageTypesV2.sol";
import { GovernorProposalLogicV2 } from "./GovernorProposalLogicV2.sol";
import { GovernorVotesLogicV2 } from "./GovernorVotesLogicV2.sol";
import { GovernorQuorumLogicV2 } from "./GovernorQuorumLogicV2.sol";
import { GovernorClockLogicV2 } from "./GovernorClockLogicV2.sol";
import { GovernorDepositLogicV2 } from "./GovernorDepositLogicV2.sol";

/// @title GovernorStateLogic
/// @notice Library for Governor state logic, managing the state transitions and validations of governance proposals.
/// @dev Difference from V1: Updated the GovernorStorageTypes, GovernorProposalLogic, GovernorVotesLogic, GovernorQuorumLogic, GovernorClockLogic, and GovernorDepositLogic to V2.
library GovernorStateLogicV2 {
  /// @notice Bitmap representing all possible proposal states.
  bytes32 internal constant ALL_PROPOSAL_STATES_BITMAP =
    bytes32((2 ** (uint8(type(GovernorTypesV2.ProposalState).max) + 1)) - 1);

  /// @dev Thrown when the `proposalId` does not exist.
  /// @param proposalId The ID of the proposal that does not exist.
  error GovernorNonexistentProposal(uint256 proposalId);

  /// @dev Thrown when the current state of a proposal does not match the expected states.
  /// @param proposalId The ID of the proposal.
  /// @param current The current state of the proposal.
  /// @param expectedStates The expected states of the proposal as a bitmap.
  error GovernorUnexpectedProposalState(
    uint256 proposalId,
    GovernorTypesV2.ProposalState current,
    bytes32 expectedStates
  );

  /** ------------------ GETTERS ------------------ **/

  /**
   * @notice Retrieves the current state of a proposal.
   * @param self The storage reference for the GovernorStorage.
   * @param proposalId The ID of the proposal.
   * @return The current state of the proposal.
   */
  function state(
    GovernorStorageTypesV2.GovernorStorage storage self,
    uint256 proposalId
  ) external view returns (GovernorTypesV2.ProposalState) {
    return _state(self, proposalId);
  }

  /** ------------------ INTERNAL FUNCTIONS ------------------ **/

  /**
   * @dev Internal function to validate the current state of a proposal against expected states.
   * @param self The storage reference for the GovernorStorage.
   * @param proposalId The ID of the proposal.
   * @param allowedStates The bitmap of allowed states.
   * @return The current state of the proposal.
   */
  function validateStateBitmap(
    GovernorStorageTypesV2.GovernorStorage storage self,
    uint256 proposalId,
    bytes32 allowedStates
  ) internal view returns (GovernorTypesV2.ProposalState) {
    GovernorTypesV2.ProposalState currentState = _state(self, proposalId);
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
  function encodeStateBitmap(GovernorTypesV2.ProposalState proposalState) internal pure returns (bytes32) {
    return bytes32(1 << uint8(proposalState));
  }

  /**
   * @notice Retrieves the current state of a proposal.
   * @dev See {IB3TRGovernor-state}.
   * @param self The storage reference for the GovernorStorage.
   * @param proposalId The ID of the proposal.
   * @return The current state of the proposal.
   */
  function _state(
    GovernorStorageTypesV2.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (GovernorTypesV2.ProposalState) {
    // Load the proposal into memory
    GovernorTypesV2.ProposalCore storage proposal = self.proposals[proposalId];
    bool proposalExecuted = proposal.executed;
    bool proposalCanceled = proposal.canceled;

    if (proposalExecuted) {
      return GovernorTypesV2.ProposalState.Executed;
    }

    if (proposalCanceled) {
      return GovernorTypesV2.ProposalState.Canceled;
    }

    if (proposal.roundIdVoteStart == 0) {
      revert GovernorNonexistentProposal(proposalId);
    }

    // Check if the proposal is pending
    if (self.xAllocationVoting.currentRoundId() < proposal.roundIdVoteStart) {
      return GovernorTypesV2.ProposalState.Pending;
    }

    uint256 currentTimepoint = GovernorClockLogicV2.clock(self);
    uint256 deadline = GovernorProposalLogicV2._proposalDeadline(self, proposalId);

    if (!GovernorDepositLogicV2.proposalDepositReached(self, proposalId)) {
      return GovernorTypesV2.ProposalState.DepositNotMet;
    }

    if (deadline >= currentTimepoint) {
      return GovernorTypesV2.ProposalState.Active;
    } else if (
      !GovernorQuorumLogicV2.quorumReached(self, proposalId) || !GovernorVotesLogicV2.voteSucceeded(self, proposalId)
    ) {
      return GovernorTypesV2.ProposalState.Defeated;
    } else if (GovernorProposalLogicV2.proposalEta(self, proposalId) == 0) {
      return GovernorTypesV2.ProposalState.Succeeded;
    } else {
      bytes32 queueid = self.timelockIds[proposalId];
      if (self.timelock.isOperationPending(queueid)) {
        return GovernorTypesV2.ProposalState.Queued;
      } else if (self.timelock.isOperationDone(queueid)) {
        return GovernorTypesV2.ProposalState.Executed;
      } else {
        return GovernorTypesV2.ProposalState.Canceled;
      }
    }
  }
}
