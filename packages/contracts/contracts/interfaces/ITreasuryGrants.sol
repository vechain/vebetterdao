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

import { GovernorTypes } from "../governance/libraries/GovernorTypes.sol";

/**
 * @title ITreasuryGrants
 * @notice Interface for the TreasuryGrants contract that manages grant execution and milestone creation
 * @dev This contract handles the execution of approved grant proposals and manages milestone-based funding
 */
interface ITreasuryGrants {
  // Events
  event MilestoneValidated(uint256 indexed proposalId, uint256 indexed milestoneIndex);
  event MilestoneClaimed(uint256 indexed proposalId, uint256 indexed milestoneIndex, uint256 amount);
  event FundsReceived(uint256 indexed proposalId, uint256 amount);

  // Errors
  error InvalidMilestoneState();
  error NotGrantRecipient();
  error InsufficientFunds();
  error InvalidMilestoneIndex();
  error PreviousMilestoneNotClaimed();

  // Functions
  function receiveFunds(uint256 proposalId) external payable;

  function validateMilestone(uint256 proposalId, uint256 milestoneIndex) external;

  function claimMilestone(uint256 proposalId, uint256 milestoneIndex) external;

  function isClaimable(uint256 proposalId, uint256 milestoneIndex) external view returns (bool);
}
