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
import { GovernorTypes } from "./GovernorTypes.sol";

library GovernorDepositLogic {
  /**
   * @dev Emitted when a deposit is made to a proposal.
   */
  event ProposalDeposit(address indexed depositor, uint256 indexed proposalId, uint256 amount);

  /**
   * @dev Returns true if the threshold of deposits required to reach a proposal has been reached.
   *
   * @param proposalId The id of the proposal.
   */
  function proposalDepositReached(
    GovernorStorageTypes.GovernorGeneralStorage storage governorStorage,
    uint256 proposalId
  ) external view returns (bool) {
    GovernorTypes.ProposalCore storage proposal = governorStorage.proposals[proposalId];
    return proposal.depositAmount >= proposal.depositThreshold;
  }

  /**
   * @dev See {Governor-depositThreshold}.
   */
  function depositThreshold(
    GovernorStorageTypes.GovernorDepositStorage storage self,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts
  ) public view returns (uint256) {
    // deposit threshold is a percentage of the total supply of B3TR tokens
    return (self.depositThresholdPercentage * externalContracts.b3tr.totalSupply()) / 100;
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
    GovernorStorageTypes.GovernorDepositStorage storage self,
    GovernorStorageTypes.GovernorExternalContractsStorage storage externalContracts,
    uint256 amount,
    address depositor,
    uint256 proposalId
  ) internal {
    require(externalContracts.vot3.transferFrom(depositor, address(this), amount), "B3TRGovernor: transfer failed");

    self.deposits[proposalId][depositor] += amount;

    emit ProposalDeposit(depositor, proposalId, amount);
  }
}
