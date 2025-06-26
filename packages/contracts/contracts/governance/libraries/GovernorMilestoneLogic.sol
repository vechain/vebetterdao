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
/// @dev This library provides functions to create, validate, reject, refund, send funds to TreasuryGrantsmilestones.
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
   * @return GovernorTypes.Milestones The milestones for the proposal
   */
  function getMilestones(
    GovernorStorageTypes.GovernorStorage storage $,
    uint256 proposalId
  ) external view returns (GovernorTypes.Milestones memory) {
    return $.proposalMilestones[proposalId];
  }

  function getMilestonesCount(
    GovernorStorageTypes.GovernorStorage storage $,
    uint256 proposalId
  ) external view returns (uint256) {
    return $.proposalMilestones[proposalId].minimumMilestoneCount;
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

    // TODO: double check that the depositAmount is ok to be included in the totalAmount of the grant
    // Q? can user deposit funds for a grant proposal ?
    uint256 totalAmount = 0;
    if (depositAmount > 0) {
      totalAmount += depositAmount;
    }

    for (uint256 i = 0; i < milestonesData.length; i++) {
      GovernorTypes.Milestone memory milestone = milestonesData[i];

      require(milestone.amount > 0, "GovernorMilestoneLogic: Milestone amount must be greater than 0");
      require(milestone.deadline > block.timestamp, "GovernorMilestoneLogic: Deadline must be in the future");

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

  function approveMilestones(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId,
    uint256 milestoneIndex
  ) internal {
    self.governor.setMilestoneStatus(proposalId, milestoneIndex, GovernorTypes.MilestoneState.Validated);
  }

  function rejectMilestone(GovernorStorageTypes.GovernorStorage storage self, uint256 proposalId) internal {
    // for every milestones in the proposal, we set the status to Rejected
    for (uint256 i = 0; i < self.proposalMilestones[proposalId].milestone.length; i++) {
      self.governor.setMilestoneStatus(proposalId, i, GovernorTypes.MilestoneState.Rejected);
    }
  }

  function setMinimumMilestoneCount(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 proposalId,
    uint256 minimumMilestoneCount
  ) internal {
    self.proposalMilestones[proposalId].minimumMilestoneCount = minimumMilestoneCount;
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
}
