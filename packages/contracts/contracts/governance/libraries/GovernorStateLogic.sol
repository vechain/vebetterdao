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

import { GovernorTypes } from "./GovernorTypes.sol";
import { GovernorStorageTypes } from "./GovernorStorageTypes.sol";
import { GovernorProposalLogic } from "./GovernorProposalLogic.sol";
import { GovernorVotesLogic } from "./GovernorVotesLogic.sol";
import { GovernorQuorumLogic } from "./GovernorQuorumLogic.sol";
import { GovernorClockLogic } from "./GovernorClockLogic.sol";
import { GovernorDepositLogic } from "./GovernorDepositLogic.sol";

/**
 * @title Governor State Logic
 * @dev Library for Governor state logic.
 */
library GovernorStateLogic {
  using GovernorProposalLogic for GovernorStorageTypes.GovernorGeneralStorage;
  using GovernorVotesLogic for GovernorStorageTypes.GovernorVotesStorage;
  using GovernorQuorumLogic for GovernorStorageTypes.GovernorQuoromStorage;
  using GovernorClockLogic for GovernorStorageTypes.GovernorExternalContractsStorage;
  using GovernorDepositLogic for GovernorStorageTypes.GovernorDepositStorage;
  using GovernorDepositLogic for GovernorStorageTypes.GovernorGeneralStorage;

  bytes32 internal constant ALL_PROPOSAL_STATES_BITMAP =
    bytes32((2 ** (uint8(type(GovernorTypes.ProposalState).max) + 1)) - 1);

  /**
   * @dev The `proposalId` doesn't exist.
   */
  error GovernorNonexistentProposal(uint256 proposalId);

  /**
   * @dev The current state of a proposal is not the required for performing an operation.
   * The `expectedStates` is a bitmap with the bits enabled for each ProposalState enum position
   * counting from right to left.
   *
   * NOTE: If `expectedState` is `bytes32(0)`, the proposal is expected to not be in any state (i.e. not exist).
   * This is the case when a proposal that is expected to be unset is already initiated (the proposal is duplicated).
   *
   * See {Governor-_encodeStateBitmap}.
   */
  error GovernorUnexpectedProposalState(
    uint256 proposalId,
    GovernorTypes.ProposalState current,
    bytes32 expectedStates
  );

  /**
   * @dev See {IB3TRGovernor-state}.
   */
  function state(
    GovernorStorageTypes.GovernorGeneralStorage storage self,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts,
    GovernorStorageTypes.GovernorVotesStorage storage votes,
    GovernorStorageTypes.GovernorQuoromStorage storage quorum,
    uint256 proposalId
  ) public view returns (GovernorTypes.ProposalState) {
    // We read the struct fields into the stack at once so Solidity emits a single SLOAD
    GovernorTypes.ProposalCore storage proposal = self.proposals[proposalId];
    bool proposalExecuted = proposal.executed;
    bool proposalCanceled = proposal.canceled;

    if (proposalExecuted) {
      return GovernorTypes.ProposalState.Executed;
    }

    if (proposalCanceled) {
      return GovernorTypes.ProposalState.Canceled;
    }

    if (proposal.roundIdVoteStart == 0) {
      revert GovernorNonexistentProposal(proposalId);
    }

    // If the round where the proposal should be active is not started yet, the proposal is pending
    if (externalContracts.xAllocationVoting.currentRoundId() < proposal.roundIdVoteStart) {
      return GovernorTypes.ProposalState.Pending;
    }

    uint256 currentTimepoint = externalContracts.clock();

    uint256 deadline = self.proposalDeadline(externalContracts, proposalId);

    if (deadline >= currentTimepoint) {
      if (self.proposalDepositReached(proposalId)) {
        return GovernorTypes.ProposalState.Active;
      } else {
        return GovernorTypes.ProposalState.DepositNotMet;
      }
    } else if (!quorum.quorumReached(self, externalContracts, votes, proposalId) || !votes.voteSucceeded(proposalId)) {
      return GovernorTypes.ProposalState.Defeated;
    } else if (self.proposalEta(proposalId) == 0) {
      return GovernorTypes.ProposalState.Succeeded;
    } else {
      return GovernorTypes.ProposalState.Queued;
    }
  }

  /**
   * @dev Check that the current state of a proposal matches the requirements described by the `allowedStates` bitmap.
   * This bitmap should be built using `_encodeStateBitmap`.
   *
   * If requirements are not met, reverts with a {GovernorUnexpectedProposalState} error.
   */
  function validateStateBitmap(
    GovernorStorageTypes.GovernorGeneralStorage storage self,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts,
    GovernorStorageTypes.GovernorVotesStorage storage votes,
    GovernorStorageTypes.GovernorQuoromStorage storage quorum,
    uint256 proposalId,
    bytes32 allowedStates
  ) internal view returns (GovernorTypes.ProposalState) {
    GovernorTypes.ProposalState currentState = state(self, externalContracts, votes, quorum, proposalId);
    if (encodeStateBitmap(currentState) & allowedStates == bytes32(0)) {
      revert GovernorUnexpectedProposalState(proposalId, currentState, allowedStates);
    }
    return currentState;
  }

  /**
   * @dev Encodes a `ProposalState` into a `bytes32` representation where each bit enabled corresponds to
   * the underlying position in the `ProposalState` enum. For example:
   *
   * 0x000...10000
   *   ^^^^^^------ ...
   *         ^----- Succeeded
   *          ^---- Defeated
   *           ^--- Canceled
   *            ^-- Active
   *             ^- Pending
   */
  function encodeStateBitmap(GovernorTypes.ProposalState proposalState) internal pure returns (bytes32) {
    return bytes32(1 << uint8(proposalState));
  }
}
