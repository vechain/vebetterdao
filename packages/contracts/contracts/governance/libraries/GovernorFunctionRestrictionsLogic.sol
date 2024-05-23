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

  /// @notice method that allows to restrict functions that can be called by proposals for a single function selector
  /// @param target - address of the contract
  /// @param functionSelector - function selector
  /// @param isWhitelisted - bool indicating if function is whitelisted for proposals
  function setWhitelistFunction(
    GovernorStorageTypes.GovernorStorage storage self,
    address target,
    bytes4 functionSelector,
    bool isWhitelisted
  ) public {
    self.whitelistedFunctions[target][functionSelector] = isWhitelisted;
  }

  /// @notice method that allows to restrict functions that can be called by proposals for multiple function selectors at once
  /// @param target - address of the contract
  /// @param functionSelectors - array of function selectors
  /// @param isWhitelisted - bool indicating if function is whitelisted for proposals
  function setWhitelistFunctions(GovernorStorageTypes.GovernorStorage storage self, address target, bytes4[] memory functionSelectors, bool isWhitelisted) public {
    for (uint256 i = 0; i < functionSelectors.length; i++) {
      setWhitelistFunction(self, target, functionSelectors[i], isWhitelisted);
    }
  }

  /// @notice method that allows to toggle the function restriction on/off
  /// @param isEnabled - flag to enable/disable function restriction
  function setIsFunctionRestrictionEnabled(GovernorStorageTypes.GovernorStorage storage self, bool isEnabled) public {
    self.isFunctionRestrictionEnabled = isEnabled;
  }

  /// @notice Check if a function is restricted by the governor
  /// @param target - address of the contract
  /// @param functionSelector - function selector
  function isFunctionWhitelisted(GovernorStorageTypes.GovernorStorage storage self, address target, bytes4 functionSelector) public view returns (bool) {
    return self.whitelistedFunctions[target][functionSelector];
  }

  /**
   * @dev Internal function check if the targets and calldatas are whitelisted
   * @param targets The addresses of the contracts to call
   * @param calldatas Function signatures and arguments
   */
  function checkFunctionsRestriction(
    GovernorStorageTypes.GovernorStorage storage self,
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
