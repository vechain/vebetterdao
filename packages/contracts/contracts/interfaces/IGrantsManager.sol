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
 * @title IGrantsManager
 * @notice Interface for the GrantsManager contract that manages grant execution and milestone creation
 * @dev This contract handles the execution of approved grant proposals and manages milestone-based funding
 */
interface IGrantsManager {
  // Events
  event MilestoneValidated(uint256 indexed proposalId, uint256 indexed milestoneIndex);
  event MilestoneClaimed(uint256 indexed proposalId, uint256 indexed milestoneIndex, uint256 amount);
  event FundsReceived(uint256 indexed proposalId, uint256 amount);
  event MilestoneRegistered(uint256 indexed proposalId, uint256 indexed milestoneIndex, uint256 amount);
  event MilestonesCreated(
    uint256 indexed milestonesId,
    uint256 totalAmount,
    address recipient,
    string description,
    Milestones milestones
  );

  // Errors
  error InvalidMilestoneState();
  error NotGrantRecipient();
  error InsufficientFunds();
  error InvalidMilestoneIndex();
  error PreviousMilestoneNotClaimed();

  // Milestone struct
  struct Milestone {
    uint256 amount;
    MilestoneState status;
  }
  // Milestones struct
  struct Milestones {
    uint256 id;
    uint256 totalAmount;
    uint256 claimedAmount;
    address recipient;
    Milestone[] milestone;
    string descriptionHash;
  } 

  // MilestoneState enum to store the status of the milestone
  enum MilestoneState {
    Pending, // 0 - default
    Validated, // 1 - milestone is active and claimable
    Claimed, // 2 - funds claimed by recipient
    Rejected, // 3 - admin rejects
    Expired, // 4 - deadline passed without action
    Refunded // 5 - funds returned to treasury
  }

  // Grants Manager Milestone Functions
  function createMilestones(
    string memory descriptionHash,
    uint256[] memory values,
    Milestones memory milestones,
    uint256 proposalId
  ) external;

  function setMilestoneStatus(
    uint256 proposalId,
    uint256 milestoneIndex,
    MilestoneState newStatus
  ) external;

  function approveMilestones(uint256 proposalId, uint256 milestoneIndex) external;

  function rejectMilestone(uint256 proposalId) external;

  function setMinimumMilestoneCount(uint256 minimumMilestoneCount) external;

  function milestoneState(
    uint256 proposalId,
    uint256 milestoneIndex
  ) external view returns (MilestoneState);

  function getMilestone(
    uint256 proposalId,
    uint256 milestoneIndex
  ) external view returns (Milestone memory);

  function getMilestones(uint256 proposalId) external view returns (Milestones memory);

  function getMinimumMilestoneCount() external view returns (uint256);

  function getTotalAmountForMilestones(uint256 milestoneId) external view returns (uint256);

  // Grants Manager Funds Functions
  function receiveFunds(uint256 proposalId) external payable;

  function validateMilestone(uint256 proposalId, uint256 milestoneIndex) external;

  function claimMilestone(uint256 proposalId, uint256 milestoneIndex) external;

  function isClaimable(uint256 proposalId, uint256 milestoneIndex) external view returns (bool);
}
