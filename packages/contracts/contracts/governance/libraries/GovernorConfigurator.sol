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
import { IVOT3 } from "../../interfaces/IVOT3.sol";
import { IVoterRewards } from "../../interfaces/IVoterRewards.sol";
import { IXAllocationVotingGovernor } from "../../interfaces/IXAllocationVotingGovernor.sol";
import { TimelockControllerUpgradeable } from "@openzeppelin/contracts-upgradeable/governance/TimelockControllerUpgradeable.sol";
import { IB3TR } from "../../interfaces/IB3TR.sol";

library GovernorConfigurator {
  /**
   * @dev Emitted when the `votingThreshold` is set.
   */
  event VotingThresholdSet(uint256 oldVotingThreshold, uint256 newVotingThreshold);
  /**
   * @dev Emitted when the minimum delay before vote starts is set.
   */
  event MinVotingDelaySet(uint256 oldMinMinVotingDelay, uint256 newMinVotingDelay);

  // @dev Emit when the deposit threshold percentage is set
  event DepositThresholdSet(uint256 oldDepositThreshold, uint256 newDepositThreshold);

  // @dev Emit when the voter rewards contract is set
  event VoterRewardsSet(address oldContractAddress, address newContractAddress);

  // @dev Emit when the XAllocationVotingGovernor contract is set
  event XAllocationVotingSet(address oldContractAddress, address newContractAddress);

  /**
   * @dev Emitted when the timelock controller used for proposal execution is modified.
   */
  event TimelockChange(address oldTimelock, address newTimelock);

  /**
   * @dev The deposit threshold is not in the valid range for a percentage - 0 to 100.
   */
  error GovernorDepositThresholdNotInRange(uint256 depositThreshold);

  /**------------------ SETTERS ------------------**/
  /**
   * @dev setter for the voting threshold.
   *
   * Emits a {VotingThresholdSet} event.
   */
  function setVotingThreshold(GovernorStorageTypes.GovernorStorage storage self, uint256 newVotingThreshold) external {
    emit VotingThresholdSet(self.votingThreshold, newVotingThreshold);
    self.votingThreshold = newVotingThreshold;
  }

  /**
   * @dev Internal setter for the min delay before vote starts.
   *
   * Emits a {MinVotingDelaySet} event.
   */
  function setMinVotingDelay(GovernorStorageTypes.GovernorStorage storage self, uint256 newMinVotingDelay) external {
    emit MinVotingDelaySet(self.minVotingDelay, newMinVotingDelay);
    self.minVotingDelay = newMinVotingDelay;
  }

  /**
   * @dev Internal function to set the voter rewards contract
   *
   * @param newVoterRewards The new voter rewards contract
   *
   * Emits a {VoterRewardsSet} event
   */
  function setVoterRewards(GovernorStorageTypes.GovernorStorage storage self, IVoterRewards newVoterRewards) external {
    emit VoterRewardsSet(address(self.voterRewards), address(newVoterRewards));
    self.voterRewards = newVoterRewards;
  }

  /**
   * @dev Internal function to set the XAllocationVotingGovernor contract
   *
   * @param newXAllocationVoting The new XAllocationVotingGovernor contract
   *
   * Emits a {XAllocationVotingSet} event
   */
  function setXAllocationVoting(
    GovernorStorageTypes.GovernorStorage storage self,
    IXAllocationVotingGovernor newXAllocationVoting
  ) external {
    emit XAllocationVotingSet(address(self.xAllocationVoting), address(newXAllocationVoting));
    self.xAllocationVoting = newXAllocationVoting;
  }

  /**
   * @dev Setter for the deposit threshold.
   *
   * Emits a {DepositThresholdSet} event.
   */
  function setDepositThresholdPercentage(
    GovernorStorageTypes.GovernorStorage storage self,
    uint256 newDepositThreshold
  ) external {
    if (newDepositThreshold > 100) {
      revert GovernorDepositThresholdNotInRange(newDepositThreshold);
    }

    emit DepositThresholdSet(self.depositThresholdPercentage, newDepositThreshold);
    self.depositThresholdPercentage = newDepositThreshold;
  }

  function updateTimelock(
    GovernorStorageTypes.GovernorStorage storage self,
    TimelockControllerUpgradeable newTimelock
  ) external {
    emit TimelockChange(address(self.timelock), address(newTimelock));
    self.timelock = newTimelock;
  }

  /**------------------ GETTERS ------------------**/
  /**
   * @dev Returns the voting threshold.
   */
  function getVotingThreshold(GovernorStorageTypes.GovernorStorage storage self) internal view returns (uint256) {
    return self.votingThreshold;
  }

  /**
   * @dev Returns the minimum delay before vote starts.
   */
  function getMinVotingDelay(GovernorStorageTypes.GovernorStorage storage self) internal view returns (uint256) {
    return self.minVotingDelay;
  }

  function getDepositThresholdPercentage(
    GovernorStorageTypes.GovernorStorage storage self
  ) internal view returns (uint256) {
    return self.depositThresholdPercentage;
  }
}
