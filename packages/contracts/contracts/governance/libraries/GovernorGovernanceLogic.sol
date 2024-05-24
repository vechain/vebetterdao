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
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { DoubleEndedQueue } from "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";

/**
 * @title Governor Description Validator
 * @dev Library for validating descriptions in governance proposals based on the proposer's address suffix.
 */
library GovernorGovernanceLogic {
  using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;
  /**
   * @dev The `account` is not the governance executor.
   */
  error GovernorOnlyExecutor(address account);

  /**
   * @dev Get the salt used for the timelock operation.
   */
  function timelockSalt(
    bytes32 descriptionHash,
    address contractAddress // Address of the calling governance contract
  ) internal pure returns (bytes32) {
    return bytes20(contractAddress) ^ descriptionHash;
  }

  /**
   * @dev Address through which the governor executes action. In this case, the timelock.
   */
  function executor(GovernorStorageTypes.GovernorStorage storage self) internal view returns (address) {
    return address(self.timelock);
  }

  /**
   * @dev Reverts if the `msg.sender` is not the executor. In case the executor is not this contract
   * itself, the function reverts if `msg.data` is not whitelisted as a result of an {execute}
   * operation. See {onlyGovernance}.
   */
  function checkGovernance(
    GovernorStorageTypes.GovernorStorage storage self,
    address sender,
    bytes calldata data,
    address contractAddress // Address of the calling governance contract
  ) internal {
    if (executor(self) != sender) {
      revert GovernorOnlyExecutor(sender);
    }
    if (executor(self) != contractAddress) {
      bytes32 msgDataHash = keccak256(data);
      // loop until popping the expected operation - throw if deque is empty (operation not authorized)
      while (self.governanceCall.popFront() != msgDataHash) {}
    }
  }
}
