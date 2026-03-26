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

import { GovernorStorageTypes } from "./GovernorStorageTypes.sol";
import { GovernorStateLogic } from "./GovernorStateLogic.sol";
import { GovernorTypes } from "./GovernorTypes.sol";
import { GovernorConfigurator } from "./GovernorConfigurator.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { GovernorClockLogic } from "./GovernorClockLogic.sol";
/// @title GovernorDepositLogic Library
/// @notice Library for managing deposits related to proposals in the Governor contract.
/// @dev This library provides functions to deposit and withdraw tokens for proposals, and to get deposit-related information.
library GovernorDepositLogic {
  using Checkpoints for Checkpoints.Trace208;
  /// @dev Emitted when a deposit is made to a proposal.
  event ProposalDeposit(address indexed depositor, uint256 indexed proposalId, uint256 amount);

  /// @dev Emitted when a deposit is withdrawn from a proposal.
  event ProposalWithdraw(address indexed withdrawer, uint256 indexed proposalId, uint256 amount);

  /// @dev Thrown when there is no deposit to withdraw.
  error GovernorNoDepositToWithdraw(uint256 proposalId, address depositer);

  /// @dev Thrown when the deposit amount is invalid (must be greater than 0).
  error GovernorInvalidDepositAmount();

  /// @dev Thrown when the proposal ID does not exist.
  error GovernorNonexistentProposal(uint256 proposalId);

  /// @dev Thrown when the grantee tries to deposit for their own grant.
  error GranteeCannotDepositOwnGrant(uint256 proposalId);

  // --------------- SETTERS ---------------
  /**
   * @notice Deposits tokens for a proposal.
   * @dev Proposer and proposal sponsors can contribute towards a proposal's deposit using this function. The proposal must be in the Pending state to make a deposit. The amount deposited from an address is tracked and can be withdrawn by the same address when the voting round is over.
   * @param amount The amount of tokens to deposit.
   * @param proposalId The ID of the proposal.
   */
  function deposit(uint256 amount, uint256 proposalId) external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    if (amount == 0) {
      revert GovernorInvalidDepositAmount();
    }

    GovernorTypes.ProposalCore storage proposal = $.proposals[proposalId];

    if (proposal.roundIdVoteStart == 0) {
      revert GovernorNonexistentProposal(proposalId);
    }

    if (proposal.proposer == msg.sender && $.proposalType[proposalId] == GovernorTypes.ProposalType.Grant) {
      revert GranteeCannotDepositOwnGrant(proposalId);
    }

    GovernorStateLogic.validateStateBitmap(
      proposalId,
      GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Pending)
    );

    proposal.depositAmount += amount;

    depositFunds(amount, msg.sender, proposalId);
  }

  /**
   * @notice Withdraws tokens previously deposited to a proposal.
   * @dev A depositor can only withdraw their tokens once the proposal is no longer Pending or Active. Each address can only withdraw once per proposal. Reverts if no deposits are available to withdraw or if the deposits have already been withdrawn by the message sender. Reverts if the token transfer fails.
   * @param proposalId The ID of the proposal to withdraw deposits from.
   * @param depositer The address of the depositor.
   */
  function withdraw(uint256 proposalId, address depositer) external {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    uint256 amount = $.deposits[proposalId][depositer];

    GovernorStateLogic.validateStateBitmap(
      proposalId,
      GovernorStateLogic.ALL_PROPOSAL_STATES_BITMAP ^
        GovernorStateLogic.encodeStateBitmap(GovernorTypes.ProposalState.Pending)
    );

    if (amount == 0) {
      revert GovernorNoDepositToWithdraw(proposalId, depositer);
    }

    $.deposits[proposalId][depositer] = 0;

    uint208 currentVotes = $.depositsVotingPower[depositer].upperLookupRecent(GovernorClockLogic.clock());
    uint208 newVotes = SafeCast.toUint208(currentVotes - amount);
    $.depositsVotingPower[depositer].push(GovernorClockLogic.clock(), newVotes);

    require($.vot3.transfer(depositer, amount), "B3TRGovernor: transfer failed");

    emit ProposalWithdraw(depositer, proposalId, amount);
  }

  /**
   * @notice Internal function to deposit tokens to a proposal and store the deposit in the deposits checkpoint.
   * @dev Emits a {ProposalDeposit} event.
   * @param amount The amount of tokens to deposit.
   * @param depositor The address of the depositor.
   * @param proposalId The ID of the proposal.
   */
  function depositFunds(
    uint256 amount,
    address depositor,
    uint256 proposalId
  ) internal {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    require($.vot3.transferFrom(depositor, address(this), amount), "B3TRGovernor: transfer failed");

    $.deposits[proposalId][depositor] += amount;

    uint208 currentVotes = $.depositsVotingPower[depositor].upperLookupRecent(GovernorClockLogic.clock());
    uint208 newVotes = currentVotes + SafeCast.toUint208(amount);
    $.depositsVotingPower[depositor].push(GovernorClockLogic.clock(), newVotes);

    emit ProposalDeposit(depositor, proposalId, amount);
  }

  // --------------- GETTERS ---------------
  /**
   * @notice Returns the amount of tokens deposited by a user for a proposal.
   * @param proposalId The ID of the proposal.
   * @param user The address of the user.
   * @return uint256 The amount of tokens deposited by the user.
   */
  function getUserDeposit(
    uint256 proposalId,
    address user
  ) internal view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    return $.deposits[proposalId][user];
  }

  /**
   * @notice Returns the deposit threshold for a proposal.
   * @param proposalId The ID of the proposal.
   * @return uint256 The deposit threshold for the proposal.
   */
  function proposalDepositThreshold(
    uint256 proposalId
  ) internal view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    return $.proposals[proposalId].depositThreshold;
  }

  /**
   * @notice Returns the total amount of deposits made to a proposal.
   * @param proposalId The ID of the proposal.
   * @return uint256 The total amount of deposits made to the proposal.
   */
  function getProposalDeposits(
    uint256 proposalId
  ) internal view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    return $.proposals[proposalId].depositAmount;
  }

  /**
   * @notice Returns true if the threshold of deposits required to reach a proposal has been reached.
   * @param proposalId The ID of the proposal.
   * @return True if the deposit threshold has been reached, false otherwise.
   */
  function proposalDepositReached(
    uint256 proposalId
  ) internal view returns (bool) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    GovernorTypes.ProposalCore storage proposal = $.proposals[proposalId];
    return proposal.depositAmount >= proposal.depositThreshold;
  }

  /**
   * @notice Internal function to calculate the deposit threshold for a proposal type as a percentage of the total supply of B3TR tokens.
   * @dev In case the percentage based threshold is greater than the max threshold, the max threshold is returned.
   * @param proposalType The type of proposal.
   * @return uint256 The deposit threshold for the proposal type.
   */
  function _depositThresholdByProposalType(
    GovernorTypes.ProposalType proposalType
  ) internal view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    uint256 percentageBasedThreshold = (GovernorConfigurator.getDepositThresholdPercentage(proposalType) *
      $.b3tr.totalSupply()) / 100;
    uint256 maxThreshold = GovernorConfigurator.getDepositThresholdCap(proposalType);

    if (percentageBasedThreshold > maxThreshold) {
      return maxThreshold;
    }

    return percentageBasedThreshold;
  }
  /**
   * @notice Returns the deposit threshold for a proposal type.
   * @param proposalTypeValue The type of proposal (uint8-encoded enum).
   * @return uint256 The deposit threshold for the proposal type.
   */
  function depositThresholdByProposalType(
    uint8 proposalTypeValue
  ) external view returns (uint256) {
    return _depositThresholdByProposalType(GovernorTypes.ProposalType(proposalTypeValue));
  }

  /**
   * @notice Returns the deposit voting power for a given account at a given timepoint.
   * @param account The address of the account.
   * @param timepoint The timepoint.
   * @return The deposit voting power.
   */
  function getDepositVotingPower(
    address account,
    uint256 timepoint
  ) public view returns (uint256) {
    GovernorStorageTypes.GovernorStorage storage $ = GovernorStorageTypes.getGovernorStorage();
    return $.depositsVotingPower[account].upperLookupRecent(SafeCast.toUint48(timepoint));
  }
}
