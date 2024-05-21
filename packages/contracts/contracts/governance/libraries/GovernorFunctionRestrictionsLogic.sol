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

/// @title GovernorQuorumFraction
/// @notice Library for managing quorum numerators using checkpointed data structures.
library GovernorFunctionRestrictionsLogic {
  /// @notice Error message for when a function is restricted by the governor
  /// @param functionSelector The function selector that is restricted
  error GovernorRestrictedFunction(bytes4 functionSelector);

  /// @notice Error message for when a function selector is invalid
  /// @param selector The function selector that is invalid
  error GovernorFunctionInvalidSelector(bytes selector);

  /**
   * @dev Internal function check if the targets and calldatas are whitelisted
   * @param targets The addresses of the contracts to call
   * @param calldatas Function signatures and arguments
   */
  function checkFunctionsRestriction(
    GovernorStorageTypes.GovernorFunctionRestrictionsStorage storage self,
    address[] memory targets,
    bytes[] memory calldatas
  ) internal view {
    if (self.isFunctionRestrictionEnabled == true) {
      for (uint256 i = 0; i < targets.length; i++) {
        bytes4 functionSelector = extractFunctionSelector(calldatas[i]);
        if (self.whitelistedFunctions[targets[i]][functionSelector] == false) {
          revert GovernorRestrictedFunction(functionSelector);
        }
      }
    }
  }

  /// @notice Extract the function selector from the calldata
  function extractFunctionSelector(bytes memory data) internal pure returns (bytes4) {
    if (data.length < 4) revert GovernorFunctionInvalidSelector(data);
    bytes4 sig;
    assembly {
      sig := mload(add(data, 32))
    }
    return sig;
  }
}
