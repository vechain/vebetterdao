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

import { GovernorStorageTypesV10 } from "./GovernorStorageTypesV10.sol";
import { DoubleEndedQueue } from "@openzeppelin/contracts/utils/structs/DoubleEndedQueue.sol";

/// @title GovernorGovernanceLogicV10
/// @notice Library for validating descriptions in governance proposals based on the proposer's address suffix.
/// @dev This library provides functions to manage the governance execution flow and validate the governance executor.
library GovernorGovernanceLogicV10 {
  using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;

  /// @dev Thrown when the `account` is not the governance executor.
  /// @param account The address that attempted the unauthorized action.
  error GovernorOnlyExecutor(address account);

  /**
   * @notice Get the salt used for the timelock operation.
   * @dev Combines the contract address and description hash to generate a unique salt.
   * @param descriptionHash The hash of the proposal description.
   * @param contractAddress The address of the calling governance contract.
   * @return The generated salt as a bytes32 value.
   */
  function timelockSalt(bytes32 descriptionHash, address contractAddress) internal pure returns (bytes32) {
    return bytes20(contractAddress) ^ descriptionHash;
  }

  /**
   * @notice Get the address through which the governor executes actions.
   * @dev Returns the timelock address used by the governor.
   * @return The executor address.
   */
  function executor() internal view returns (address) {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    return address($.timelock);
  }

  /**
   * @notice Validates that the `msg.sender` is the executor.
   * @dev Reverts if the `msg.sender` is not the executor. If the executor is not the calling contract itself, it verifies that the `msg.data` is whitelisted.
   * @param sender The address of the sender.
   * @param data The calldata to be validated.
   * @param contractAddress The address of the calling governance contract.
   */
  function checkGovernance(
    address sender,
    bytes calldata data,
    address contractAddress
  ) internal {
    GovernorStorageTypesV10.GovernorStorage storage $ = GovernorStorageTypesV10.getGovernorStorage();
    if (executor() != sender) {
      revert GovernorOnlyExecutor(sender);
    }
    if (executor() != contractAddress) {
      bytes32 msgDataHash = keccak256(data);
      // Loop until popping the expected operation, revert if deque is empty (operation not authorized)
      while ($.governanceCall.popFront() != msgDataHash) {}
    }
  }
}
