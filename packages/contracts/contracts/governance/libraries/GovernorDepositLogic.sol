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

import { GovernorStorageTypes } from "./GovernorStorageTypes.sol";
import { GovernorStateLogic } from "./GovernorStateLogic.sol";
import { GovernorTypes } from "./GovernorTypes.sol";

library GovernorDepositLogic {
  using GovernorStateLogic for GovernorStorageTypes.GovernorStorage;
  /**
   * @dev Emitted when a deposit is made to a proposal.
   */
  event ProposalDeposit(address indexed depositor, uint256 indexed proposalId, uint256 amount);

  /**
   * @dev There is no deposit to withdraw.
   */
  error GovernorNoDepositToWithdraw(uint256 proposalId, address depositer);

  /**
   * @dev The deposit amount must be greater than 0.
   */
  error GovernorInvalidDepositAmount();

  /**
   * @dev The `proposalId` doesn't exist.
   */
  error GovernorNonexistentProposal(uint256 proposalId);

  // --------------- SETTERS ---------------
  /**
   * @dev Deposit tokens for a proposal. Proposer and proposal sponsors can contribute
   * towards a proposal's deposit using this function. The proposal must be in the
   * Pending state to make a deposit. The amount deposited from an address is tracked
   * and can be withdrawn by the same address when the voting round is over.
   *
   * @param amount The amount of tokens to deposit.
   * @param proposalId The id of the proposal.
   */
  function deposit(GovernorStorageTypes.GovernorStorage storage self, uint256 amount, uint256 proposalId) external {
    if (amount == 0) {
      revert GovernorInvalidDepositAmount();
    }

    GovernorTypes.ProposalCore storage proposal = self.proposals[proposalId];

    if (proposal.roundIdVoteStart == 0) {
      revert GovernorNonexistentProposal(proposalId);
    }

    self.validateStateBitmap(proposalId, GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Pending));

    proposal.depositAmount += amount;

    depositFunds(self, amount, msg.sender, proposalId);
  }

  /**
   * @dev Withdraw tokens previously deposited to a proposal. A depositor can only
   * withdraw their tokens once the proposal is no longer Pending or Active. Each
   * address can only withdraw once per proposal.
   *
   * Reverts if no deposits are available to withdraw or if the deposits have
   * already been withdrawn by the message sender.
   * Reverts if the token transfer fails.
   *
   * @param proposalId The id of the proposal to withdraw deposits from.
   * @param depositer The address of the depositer.
   */
  function withdraw(GovernorStorageTypes.GovernorStorage storage self, uint256 proposalId, address depositer) external {
    uint256 amount = self.deposits[proposalId][depositer];

    self.validateStateBitmap(
      proposalId,
      GovernorStateLogic.ALL_PROPOSAL_STATES_BITMAP ^
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Pending) ^
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Active)
    );

    if (amount == 0) {
      revert GovernorNoDepositToWithdraw(proposalId, depositer);
    }

    self.deposits[proposalId][depositer] = 0;

    require(self.vot3.transfer(depositer, amount), "B3TRGovernor: transfer failed");
  }

  /**
   * @dev Deposit tokens to a proposal.
   *
   * Emits a {IB3TRGovernor-ProposalDeposit} event.
   *
   * @param amount The amount of tokens to deposit.
   * @param depositor The address of the depositor.
   * @param proposalId The id of the proposal.
   */
  function depositFunds(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 amount,
    address depositor,
    uint256 proposalId
  ) internal {
    require(self.vot3.transferFrom(depositor, address(this), amount), "B3TRGovernor: transfer failed");

    self.deposits[proposalId][depositor] += amount;

    emit ProposalDeposit(depositor, proposalId, amount);
  }

  // --------------- GETTERS ---------------

  function getUserDeposit(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId,
    address user
  ) internal view returns (uint256) {
    return self.deposits[proposalId][user];
  }

  /**
   * @dev Returns the deposit threshold for a proposal.
   * @param proposalId The id of the proposal.
   * @return uint256 The deposit threshold for the proposal.
   */
  function proposalDepositThreshold(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (uint256) {
    return self.proposals[proposalId].depositThreshold;
  }

  /**
   * @dev Returns the amount of deposits made to a proposal.
   *
   * @param proposalId The id of the proposal.
   */
  function getProposalDeposits(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (uint256) {
    return self.proposals[proposalId].depositAmount;
  }

  /**
   * @dev Returns true if the threshold of deposits required to reach a proposal has been reached.
   *
   * @param proposalId The id of the proposal.
   */
  function proposalDepositReached(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) internal view returns (bool) {
    GovernorTypes.ProposalCore storage proposal = self.proposals[proposalId];
    return proposal.depositAmount >= proposal.depositThreshold;
  }

  /**
   * @dev See {Governor-depositThreshold}.
   */
  function getDepositThreshold(GovernorStorageTypes.GovernorStorage storage self) external view returns (uint256) {
    // deposit threshold is a percentage of the total supply of B3TR tokens
    return depositThreshold(self);
  }

  /**
   * @dev See {Governor-depositThreshold}.
   */
  function depositThreshold(GovernorStorageTypes.GovernorStorage storage self) internal view returns (uint256) {
    // deposit threshold is a percentage of the total supply of B3TR tokens
    return (self.depositThresholdPercentage * self.b3tr.totalSupply()) / 100;
  }
}
