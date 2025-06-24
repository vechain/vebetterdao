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
import { DoubleEndedQueue } from "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

/// @title GovernorMilestoneLogic
/// @notice Library for managing milestones in the Governor contract.
/// @dev This library provides functions to create, edit, validate, reject, and refund milestones.
library GovernorMilestoneLogic {
  using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;

  /**
   * @dev Emitted when a milestone is created.
   */
  event MilestonesCreated(
    uint256 indexed proposalId,
    uint256 totalAmount,
    uint256 milestoneCount,
    address recipient,
    string description,
    uint256 depositAmount,
    uint256 startRoundId
  );

  /**
   * @dev Emitted when a milestone is registered.
   */
  event MilestoneRegistered(
    uint256 indexed proposalId,
    uint256 indexed milestoneIndex,
    uint256 amount,
    uint256 deadline
  );

  /**
   * @dev Emitted when milestone editing phase is toggled
   */
  event MilestoneEditingPhaseChanged(uint256 indexed proposalId, bool canEdit);

  /**
   * @dev Error thrown when trying to edit a milestone that is not editable
   */
  error MilestoneNotEditable();

  /**
   * @dev Error thrown when trying to edit a milestone with an invalid deadline
   */
  error InvalidDeadline();

  /**
   * @dev Emitted when a milestone deadline is edited
   */
  event MilestoneDeadlineEdited(
    uint256 indexed proposalId,
    uint256 indexed milestoneIndex,
    uint256 oldDeadline,
    uint256 newDeadline
  );

  /** ------------------ GETTERS ------------------ **/

  /**
   * @notice Returns a milestone for a proposal.
   * @param proposalId The id of the proposal
   * @param milestoneIndex The index of the milestone
   * @return GovernorTypes.Milestone The milestone
   */
  function getMilestone(
    GovernorStorageTypes.GovernorStorage storage $,
    uint256 proposalId,
    uint256 milestoneIndex
  ) external view returns (GovernorTypes.Milestone memory) {
    return $.proposalMilestones[proposalId].milestone[milestoneIndex];
  }

  /**
   * @notice Returns the milestones for a proposal.
   * @param proposalId The id of the proposal
   * @return GovernorTypes.Milestone[] The milestones for the proposal
   */
  function getMilestones(
    GovernorStorageTypes.GovernorStorage storage $,
    uint256 proposalId
  ) external view returns (GovernorTypes.Milestone[] memory) {
    return $.proposalMilestones[proposalId].milestone;
  }

  /**
   * @notice Returns whether milestones for a proposal are editable
   * @param self The storage reference for the GovernorStorage
   * @param proposalId The id of the proposal
   * @return bool Whether the milestones are editable
   */
  function areMilestonesEditable(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId
  ) external view returns (bool) {
    return self.proposalMilestones[proposalId].editable;
  }

  /** ------------------ SETTERS ------------------ **/
  /**
   * @dev Internal function to create milestones for a proposal.
   * @param self The storage reference for the GovernorStorage.
   * @param proposalId The id of the proposal.
   * @param targets The addresses of the contracts to call.
   * @param values The values to send to the contracts.
   * @param calldatas The function signatures and arguments.
   */
  function _createMilestones(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description,
    uint256 depositAmount,
    uint256 startRoundId
  ) internal {
    // Decode milestones from the calldata
    require(targets.length == 1 && calldatas.length == 1, "Invalid milestone proposal format");

    // Extract milestones array from calldata
    bytes memory functionCalldata = calldatas[0];
    require(functionCalldata.length >= 4, "Invalid calldata length");

    // Decode the entire function call including the selector
    (bytes4 selector, GovernorTypes.Milestone[] memory milestonesData) = abi.decode(
      functionCalldata,
      (bytes4, GovernorTypes.Milestone[])
    );

    GovernorTypes.Milestones storage proposalMilestones = self.proposalMilestones[proposalId];
    proposalMilestones.id = proposalId;
    proposalMilestones.editable = true;

    uint256 totalAmount = 0;
    if (depositAmount > 0) {
      totalAmount += depositAmount;
    }

    for (uint256 i = 0; i < milestonesData.length; i++) {
      GovernorTypes.Milestone memory milestone = milestonesData[i];

      require(milestone.amount > 0, "Invalid milestone amount");
      require(milestone.deadline > block.timestamp, "Invalid milestone deadline");

      proposalMilestones.milestone.push(
        GovernorTypes.Milestone({
          amount: milestone.amount,
          description: milestone.description,
          deadline: milestone.deadline,
          status: GovernorTypes.MilestoneState.Pending // Start in Queued state for community phase
        })
      );

      totalAmount += milestone.amount;
    }

    proposalMilestones.totalAmount = totalAmount;
    proposalMilestones.claimedAmount = 0;

    emit MilestonesCreated(
      proposalId,
      totalAmount,
      milestonesData.length,
      proposalMilestones.recipient,
      description,
      depositAmount,
      startRoundId
    );

    for (uint256 i = 0; i < milestonesData.length; i++) {
      emit MilestoneRegistered(proposalId, i, milestonesData[i].amount, milestonesData[i].deadline);
    }
  }

  /**
   * @dev Function to edit a milestone's deadline before proposal execution
   * @param self The storage reference for the GovernorStorage
   * @param proposalId The id of the proposal
   * @param milestoneIndex The index of the milestone to edit
   * @param newDeadline The new deadline for the milestone
   * @notice the milestone are editable only during the community phae
   * while the voting phase, milestone should not be editable ( community are alredy voting on the milestone, might be unfair to change during this phase )
   */
  function editMilestone(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId,
    uint256 milestoneIndex,
    uint256 newDeadline
  ) external {
    GovernorTypes.Milestones storage milestones = self.proposalMilestones[proposalId];
    require(milestoneIndex < milestones.milestone.length, "Invalid milestone index");
    require(msg.sender == milestones.recipient, "Caller is not the owner of the milestone");

    // Check if milestone editing is enabled
    if (!milestones.editable) {
      revert MilestoneNotEditable();
    }

    GovernorTypes.Milestone storage milestone = milestones.milestone[milestoneIndex];

    // Validate new deadline
    if (newDeadline <= block.timestamp) {
      revert InvalidDeadline();
    }

    uint256 oldDeadline = milestone.deadline;
    milestone.deadline = newDeadline;

    emit MilestoneDeadlineEdited(proposalId, milestoneIndex, oldDeadline, newDeadline);
  }

  /**
   * @notice Returns the state of a milestone
   * @param self The storage reference for the GovernorStorage
   * @param proposalId The id of the proposal
   * @param milestoneIndex The index of the milestone
   * @return GovernorTypes.MilestoneState The state of the milestone
   */
  function milestoneState(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId,
    uint256 milestoneIndex
  ) external view returns (GovernorTypes.MilestoneState) {
    return self.proposalMilestones[proposalId].milestone[milestoneIndex].status;
  }

  /**
   * @notice Sets the editability of milestones for a proposal
   * @param self The storage reference for the GovernorStorage
   * @param proposalId The id of the proposal
   * @param canEdit Whether the milestones can be edited
   */
  function setMilestoneEditingPhase(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId,
    bool canEdit
  ) external {
    self.proposalMilestones[proposalId].editable = canEdit;
    emit MilestoneEditingPhaseChanged(proposalId, canEdit);
  }
}
